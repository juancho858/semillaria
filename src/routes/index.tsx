// Módulo 1 — Resumen General
// KPIs, filtros, gráficas y tabla paginada.
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* ── KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          icon={<Layers className="h-4 w-4" />}
          label="Área cultivada total"
          value={fmtInt(totalArea)}
          suffix="ha"
        />
        <Kpi
          icon={<Activity className="h-4 w-4" />}
          label="Volumen producido"
          value={fmtInt(totalVol)}
          suffix="t"
        />
        <Kpi
          icon={<Sprout className="h-4 w-4" />}
          label="Cultivo líder"
          value={cultivoLider}
          textual
        />
        <Kpi
          icon={<MapPin className="h-4 w-4" />}
          label="Subregión líder"
          value={subLider}
          textual
        />
      </div>

      {/* ── Filtros ─────────────────────────────────────── */}
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Filtros</span>
          <NativeSelect
            value={tipo}
            onChange={(v) => {
              setTipo(v as TipoFiltro);
              setPage(0);
            }}
            options={[
              { value: "todos", label: "Todos los tipos" },
              { value: "Permanente", label: "Permanente" },
              { value: "Transitorio", label: "Transitorio" },
              { value: "Anual", label: "Anual" },
            ]}
          />
          <NativeSelect
            value={sub}
            onChange={(v) => {
              setSub(v as SubFiltro);
              setPage(0);
            }}
            options={[
              { value: "todos", label: "Todas las subregiones" },
              ...SUBREGIONES.map((s) => ({ value: s, label: s })),
            ]}
          />
          <div className="text-xs text-muted-foreground ml-auto">
            <span className="num">{fmtInt(filtrados.length)}</span> registros · año{" "}
            <span className="num">{año}</span>
          </div>
        </div>
      </Panel>

      {/* ── Gráficas ────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Top 10 cultivos por área (ha)">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={topCultivos} layout="vertical" margin={{ left: 10, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickFormatter={(v) => fmtCompact(v as number)}
                />
                <YAxis
                  type="category"
                  dataKey="clave"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  width={120}
                />
                <Tooltip content={<TT unidad="ha" />} cursor={{ fill: "color-mix(in oklch, var(--color-primary) 10%, transparent)" }} />
                <Bar dataKey="valor" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Volumen producido por subregión (t)">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={porSub} margin={{ left: 10, right: 12, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="clave"
                  stroke="var(--color-muted-foreground)"
                  fontSize={10}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickFormatter={(v) => fmtCompact(v as number)}
                />
                <Tooltip content={<TT unidad="t" />} cursor={{ fill: "color-mix(in oklch, var(--color-primary) 10%, transparent)" }} />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {porSub.map((_, i) => (
                    <Cell key={i} fill="var(--color-primary)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Evolución de volumen producido 2018–2023">
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={serie}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="año" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickFormatter={(v) => fmtCompact(v as number)}
              />
              <Tooltip content={<TT unidad="t" />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="valor"
                name="Volumen (t)"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-primary)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* ── Tabla paginada ──────────────────────────────── */}
      <Panel title="Detalle por cultivo y subregión">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 px-3 font-medium">Cultivo</th>
                <th className="py-2 px-3 font-medium">Subregión</th>
                <th className="py-2 px-3 font-medium">Tipo</th>
                <th className="py-2 px-3 font-medium text-right">Área Total (ha)</th>
                <th className="py-2 px-3 font-medium text-right">Volumen (t)</th>
              </tr>
            </thead>
            <tbody>
              {pagina.map((row, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-surface/50">
                  <td className="py-2 px-3 font-medium">{row.rubro}</td>
                  <td className="py-2 px-3 text-muted-foreground">{row.subregion}</td>
                  <td className="py-2 px-3">
                    <span className="inline-flex px-2 py-0.5 text-[10px] uppercase tracking-wider rounded bg-surface border border-border text-muted-foreground">
                      {row.tipo}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right num">{fmtInt(row.area)}</td>
                  <td className="py-2 px-3 text-right num">{fmtInt(row.vol)}</td>
                </tr>
              ))}
              {pagina.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Sin registros para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>
            Mostrando <span className="num">{page * PAGE_SIZE + 1}</span>–
            <span className="num">{Math.min((page + 1) * PAGE_SIZE, tabla.length)}</span> de{" "}
            <span className="num">{fmtInt(tabla.length)}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded border border-border bg-surface hover:bg-surface-elevated disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="px-2 py-1">
              <span className="num">{page + 1}</span> / <span className="num">{totalPages}</span>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded border border-border bg-surface hover:bg-surface-elevated disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ──────────────────────────── helpers UI ────────────────────────────
function Kpi({
  icon,
  label,
  value,
  suffix,
  textual,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  textual?: boolean;
}) {
  return (
    <div className="card-hover bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={textual ? "text-xl font-semibold tracking-tight" : "num text-2xl font-semibold tracking-tight"}>
          {value}
        </span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-lg p-4">
      {title && <h2 className="text-sm font-semibold mb-3 tracking-tight">{title}</h2>}
      {children}
    </section>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// Tooltip compartido de Recharts.
function TT({ active, payload, label, unidad }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2 text-xs shadow-xl">
      {label !== undefined && <div className="text-muted-foreground mb-0.5">{String(label)}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          <span className="text-foreground">{p.name ?? p.dataKey}:</span>
          <span className="num text-foreground">
            {fmtInt(p.value as number)} {unidad}
          </span>
        </div>
      ))}
    </div>
  );
}
