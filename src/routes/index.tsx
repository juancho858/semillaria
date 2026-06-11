// Módulo 1 — Resumen General
// KPIs, filtros, gráficas y tabla paginada.
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Layers, MapPin, Sprout } from "lucide-react";

import { REGISTROS } from "@/data/dataset";
import { SUBREGIONES } from "@/data/types";
import type { Registro } from "@/data/types";
import { useAño } from "@/context/AñoContext";
import {
  aplicarFiltros,
  lider,
  serieAnual,
  sumar,
  topN,
} from "@/lib/dataset";
import { fmtCompact, fmtInt } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Resumen General — Semillaria" },
      {
        name: "description",
        content: "KPIs y panorama agrícola general de Antioquia.",
      },
    ],
  }),
  component: ResumenPage,
});

type TipoFiltro = Registro["tipo"] | "todos";
type SubFiltro = (typeof SUBREGIONES)[number] | "todos";

const PAGE_SIZE = 20;

function ResumenPage() {
  const { año } = useAño();
  const [tipo, setTipo] = useState<TipoFiltro>("todos");
  const [sub, setSub] = useState<SubFiltro>("todos");
  const [page, setPage] = useState(0);

  // Datos filtrados (por filtros locales + año global)
  const filtrados = useMemo(
    () => aplicarFiltros({ año, tipo, subregion: sub }, REGISTROS),
    [año, tipo, sub],
  );

  // KPIs
  const totalArea = useMemo(() => sumar(filtrados, "areaTotalHa"), [filtrados]);
  const totalVol = useMemo(() => sumar(filtrados, "volumenProduccionTon"), [filtrados]);
  const cultivoLider = useMemo(() => lider(filtrados, "rubro", "areaTotalHa"), [filtrados]);
  const subLider = useMemo(() => lider(filtrados, "subregion", "volumenProduccionTon"), [filtrados]);

  // Top 10 cultivos por área
  const topCultivos = useMemo(
    () => topN(filtrados, "rubro", "areaTotalHa", 10),
    [filtrados],
  );

  // Por subregión (volumen)
  const porSub = useMemo(
    () =>
      topN(filtrados, "subregion", "volumenProduccionTon", 9).sort((a, b) =>
        a.clave.localeCompare(b.clave, "es"),
      ),
    [filtrados],
  );

  // Evolución 2018–2023 (vol) ignorando el filtro de año
  const serie = useMemo(() => {
    const d = aplicarFiltros({ tipo, subregion: sub }, REGISTROS);
    return serieAnual(d, "volumenProduccionTon");
  }, [tipo, sub]);

  // Tabla agregada cultivo×subregión
  const tabla = useMemo(() => {
    const m = new Map<string, { rubro: string; subregion: string; tipo: string; area: number; vol: number }>();
    for (const r of filtrados) {
      const k = `${r.rubro}|${r.subregion}`;
      const prev = m.get(k);
      if (prev) {
        prev.area += r.areaTotalHa;
        prev.vol += r.volumenProduccionTon;
      } else {
        m.set(k, {
          rubro: r.rubro,
          subregion: r.subregion,
          tipo: r.tipo,
          area: r.areaTotalHa,
          vol: r.volumenProduccionTon,
        });
      }
    }
    return [...m.values()].sort((a, b) => b.area - a.area);
  }, [filtrados]);

  const totalPages = Math.max(1, Math.ceil(tabla.length / PAGE_SIZE));
  const pagina = tabla.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // Tendencia % vs primer año
  const tendencia = useMemo(() => {
    if (serie.length < 2) return 0;
    const first = serie[0].valor || 1;
    const last = serie.at(-1)!.valor;
    return ((last - first) / first) * 100;
  }, [serie]);

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* ── HERO METRIC ─────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-hero text-white p-8 md:p-10 shadow-elev-lg">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18), transparent 50%), radial-gradient(circle at 10% 90%, rgba(216,138,74,0.25), transparent 45%)",
        }} />
        <div className="absolute top-6 right-6 hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/60">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          En vivo · {año}
        </div>
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.2em] text-white/70 mb-3">
            Volumen producido en Antioquia
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-display text-6xl md:text-7xl leading-none text-white">
              {fmtInt(totalVol)}
            </span>
            <span className="text-xl text-white/70">toneladas</span>
            <span className={
              "ml-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium " +
              (tendencia >= 0 ? "bg-accent/20 text-white border border-accent/40" : "bg-white/10 text-white/80")
            }>
              {tendencia >= 0 ? "▲" : "▼"} {Math.abs(tendencia).toFixed(1)}% vs 2018
            </span>
          </div>
          <p className="mt-4 max-w-xl text-sm text-white/70 leading-relaxed">
            Datos consolidados de <span className="num text-white">{fmtInt(totalArea)} ha</span> cultivadas
            en <span className="text-white">{SUBREGIONES.length} subregiones</span>. Líder por área:{" "}
            <span className="text-accent font-medium">{cultivoLider}</span>.
          </p>
        </div>
      </section>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<Layers className="h-4 w-4" />} label="Área cultivada" value={fmtInt(totalArea)} suffix="ha" tone="primary" />
        <Kpi icon={<Activity className="h-4 w-4" />} label="Volumen producido" value={fmtInt(totalVol)} suffix="t" tone="accent" />
        <Kpi icon={<Sprout className="h-4 w-4" />} label="Cultivo líder" value={cultivoLider} textual tone="primary" />
        <Kpi icon={<MapPin className="h-4 w-4" />} label="Subregión líder" value={subLider} textual tone="accent" />
      </div>

      {/* ── Filtros ─────────────────────────────────────── */}
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Filtros</span>
          <NativeSelect
            value={tipo}
            onChange={(v) => { setTipo(v as TipoFiltro); setPage(0); }}
            options={[
              { value: "todos", label: "Todos los tipos" },
              { value: "Permanente", label: "Permanente" },
              { value: "Transitorio", label: "Transitorio" },
              { value: "Anual", label: "Anual" },
            ]}
          />
          <NativeSelect
            value={sub}
            onChange={(v) => { setSub(v as SubFiltro); setPage(0); }}
            options={[
              { value: "todos", label: "Todas las subregiones" },
              ...SUBREGIONES.map((s) => ({ value: s, label: s })),
            ]}
          />
          <div className="text-xs text-muted-foreground ml-auto">
            <span className="num text-foreground font-medium">{fmtInt(filtrados.length)}</span> registros · año{" "}
            <span className="num text-foreground font-medium">{año}</span>
          </div>
        </div>
      </Panel>

      {/* ── Gráficas ────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="Top 10 cultivos por área" subtitle="Hectáreas cultivadas">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={topCultivos} layout="vertical" margin={{ left: 10, right: 12 }}>
                <defs>
                  <linearGradient id="barH" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--color-primary)" />
                    <stop offset="100%" stopColor="var(--color-primary-glow)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => fmtCompact(v as number)} />
                <YAxis type="category" dataKey="clave" stroke="var(--color-muted-foreground)" fontSize={11} width={120} />
                <Tooltip content={<TT unidad="ha" />} cursor={{ fill: "color-mix(in oklch, var(--color-primary) 8%, transparent)" }} />
                <Bar dataKey="valor" fill="url(#barH)" radius={[0, 8, 8, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Volumen por subregión" subtitle="Toneladas producidas">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={porSub} margin={{ left: 10, right: 12, bottom: 30 }}>
                <defs>
                  <linearGradient id="barV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="clave" stroke="var(--color-muted-foreground)" fontSize={10} angle={-30} textAnchor="end" interval={0} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => fmtCompact(v as number)} />
                <Tooltip content={<TT unidad="t" />} cursor={{ fill: "color-mix(in oklch, var(--color-accent) 8%, transparent)" }} />
                <Bar dataKey="valor" fill="url(#barV)" radius={[8, 8, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Evolución 2018–2023" subtitle="Volumen producido (t)">
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={serie} margin={{ left: 5, right: 15, top: 10 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-primary-glow)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="año" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => fmtCompact(v as number)} />
              <Tooltip content={<TT unidad="t" />} />
              <Line
                type="monotone"
                dataKey="valor"
                name="Volumen"
                stroke="url(#lineGrad)"
                strokeWidth={3}
                dot={{ r: 5, fill: "var(--color-primary)", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7, fill: "var(--color-accent)", strokeWidth: 3, stroke: "#fff" }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* ── Tabla paginada ──────────────────────────────── */}
      <Panel title="Detalle por cultivo y subregión">
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground border-b border-border">
                <th className="py-3 px-3 font-medium">Cultivo</th>
                <th className="py-3 px-3 font-medium">Subregión</th>
                <th className="py-3 px-3 font-medium">Tipo</th>
                <th className="py-3 px-3 font-medium text-right">Área (ha)</th>
                <th className="py-3 px-3 font-medium text-right">Volumen (t)</th>
              </tr>
            </thead>
            <tbody>
              {pagina.map((row, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-surface-elevated transition-colors">
                  <td className="py-2.5 px-3 font-medium">{row.rubro}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{row.subregion}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full bg-muted text-muted-foreground">
                      {row.tipo}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right num">{fmtInt(row.area)}</td>
                  <td className="py-2.5 px-3 text-right num font-medium">{fmtInt(row.vol)}</td>
                </tr>
              ))}
              {pagina.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">Sin registros para los filtros seleccionados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span>
            Mostrando <span className="num text-foreground">{page * PAGE_SIZE + 1}</span>–
            <span className="num text-foreground">{Math.min((page + 1) * PAGE_SIZE, tabla.length)}</span> de{" "}
            <span className="num text-foreground">{fmtInt(tabla.length)}</span>
          </span>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-elevated disabled:opacity-40 transition-colors"
            >Anterior</button>
            <span className="px-2 py-1 num">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-elevated disabled:opacity-40 transition-colors"
            >Siguiente</button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ──────────────────────────── helpers UI ────────────────────────────
function Kpi({
  icon, label, value, suffix, textual, tone = "primary",
}: {
  icon: React.ReactNode; label: string; value: string; suffix?: string; textual?: boolean;
  tone?: "primary" | "accent";
}) {
  const isAccent = tone === "accent";
  return (
    <div className="card-elevated rounded-2xl p-5 relative overflow-hidden group">
      <div className={
        "absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.08] blur-2xl transition-opacity group-hover:opacity-20 " +
        (isAccent ? "bg-accent" : "bg-primary")
      } />
      <div className="flex items-center justify-between relative">
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        <span className={
          "w-8 h-8 grid place-items-center rounded-lg " +
          (isAccent ? "bg-accent/15 text-accent" : "bg-primary/12 text-primary")
        }>{icon}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5 relative">
        <span className={
          textual ? "font-display text-2xl tracking-tight" : "num text-3xl font-semibold tracking-tight"
        }>{value}</span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-elev-sm">
      {title && (
        <header className="mb-4">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

function NativeSelect({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-surface border border-border rounded-full px-4 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-elev-sm hover:border-primary/40 transition-colors cursor-pointer"
    >
      {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}

function TT({ active, payload, label, unidad }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl px-3.5 py-2.5 text-xs shadow-elev-lg">
      {label !== undefined && <div className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">{String(label)}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          <span className="text-foreground">{p.name ?? p.dataKey}:</span>
          <span className="num text-foreground font-medium">{fmtInt(p.value as number)} {unidad}</span>
        </div>
      ))}
    </div>
  );
}

