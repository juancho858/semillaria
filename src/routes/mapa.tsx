// Módulo 2 — Mapa de Calor por Subregiones de Antioquia.
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { scaleSequential } from "d3-scale";
import { interpolateGreens } from "d3-scale-chromatic";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, X } from "lucide-react";
import { SUBREGIONES } from "@/data/types";
import type { Metrica, Subregion } from "@/data/types";
import { METRICA_LABEL } from "@/data/types";
import { useAño } from "@/context/AñoContext";
import {
  aplicarFiltros,
  porSubregion,
  serieAnual,
  topCultivosDeSubregion,
  topN,
} from "@/lib/dataset";
import { REGISTROS } from "@/data/dataset";
import { fmtCompact, fmtInt } from "@/lib/format";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Carga perezosa del canvas SVG; si el módulo react-simple-maps falla en
// producción, el ErrorBoundary muestra un fallback sin romper la página.
const MapaCanvas = lazy(() => import("@/components/MapaCanvas"));


export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa de Calor — Semillaria" },
      { name: "description", content: "Mapa de calor agrícola por subregión de Antioquia." },
    ],
  }),
  component: MapaPage,
});

function MapaPage() {
  const { año } = useAño();
  const [metrica, setMetrica] = useState<Metrica>("areaTotalHa");
  const [hover, setHover] = useState<Subregion | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [seleccion, setSeleccion] = useState<Subregion | null>(null);

  // Datos del año seleccionado.
  const dataAño = useMemo(() => aplicarFiltros({ año }, REGISTROS), [año]);
  const porSub = useMemo(() => porSubregion(dataAño, metrica), [dataAño, metrica]);

  const valores = Object.values(porSub);
  const min = Math.min(...valores);
  const max = Math.max(...valores);

  // Escala #E8F5E9 → #1B5E20.
  const color = useMemo(
    () => scaleSequential<string>(interpolateGreens).domain([min * 0.85, max]),
    [min, max],
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Mapa de calor por subregión</h1>
          <p className="text-sm text-muted-foreground">
            Antioquia · año <span className="num">{año}</span> · {METRICA_LABEL[metrica]}
          </p>
        </div>
        <div className="flex gap-1 bg-surface rounded-md border border-border p-0.5">
          {(Object.keys(METRICA_LABEL) as Metrica[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetrica(m)}
              className={
                "px-3 py-1.5 text-xs rounded-[5px] transition-colors " +
                (metrica === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {METRICA_LABEL[m]}
            </button>
          ))}
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* ── Mapa SVG ───────────────────────────────────── */}
        <div className="bg-card border border-border rounded-lg p-4 relative">
          <div
            className="aspect-[5/4] w-full relative"
            onMouseLeave={() => {
              setHover(null);
              setTooltipPos(null);
            }}
          >
            <ErrorBoundary fallback={(err, reset) => <MapaFallback error={err} reset={reset} />}>
              <Suspense fallback={<MapaSkeleton />}>
                <MapaCanvas
                  porSub={porSub}
                  color={color as (v: number) => string}
                  hover={hover}
                  onHover={(sub, x, y) => {
                    setHover(sub);
                    setTooltipPos({ x, y });
                  }}
                  onSelect={(sub) => setSeleccion(sub)}
                />
              </Suspense>
            </ErrorBoundary>


            {/* Tooltip flotante */}
            {hover && tooltipPos && (
              <div
                className="fixed z-50 pointer-events-none bg-popover border border-border rounded-md px-3 py-2 text-xs shadow-xl min-w-[180px]"
                style={{ left: tooltipPos.x + 14, top: tooltipPos.y + 14 }}
              >
                <div className="font-semibold text-foreground mb-1">{hover}</div>
                <div className="flex justify-between gap-3 text-muted-foreground">
                  <span>{METRICA_LABEL[metrica]}</span>
                  <span className="num text-foreground">{fmtInt(porSub[hover])}</span>
                </div>
                <div className="mt-1 pt-1 border-t border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Top cultivos
                </div>
                <ol className="text-foreground/90 mt-0.5 space-y-0.5">
                  {topCultivosDeSubregion(hover, año, metrica, 3).map((c, i) => (
                    <li key={c.clave} className="flex justify-between gap-3">
                      <span>
                        <span className="text-muted-foreground mr-1">{i + 1}.</span>
                        {c.clave}
                      </span>
                      <span className="num text-muted-foreground">{fmtCompact(c.valor)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Leyenda */}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="num">{fmtCompact(min)}</span>
            <div
              className="flex-1 h-2 rounded"
              style={{
                background:
                  "linear-gradient(90deg, " +
                  [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => color(min + (max - min) * t)).join(",") +
                  ")",
              }}
            />
            <span className="num">{fmtCompact(max)}</span>
            <span className="ml-2 hidden md:inline">{METRICA_LABEL[metrica]}</span>
          </div>
        </div>

        {/* ── Panel resumen ────────────────────────────────── */}
        <aside className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Ranking de subregiones</h3>
          <ul className="space-y-2">
            {SUBREGIONES.map((s) => ({ s, v: porSub[s] }))
              .sort((a, b) => b.v - a.v)
              .map(({ s, v }) => (
                <li key={s}>
                  <button
                    onClick={() => setSeleccion(s)}
                    className="w-full text-left group"
                  >
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-foreground group-hover:text-primary transition-colors">
                        {s}
                      </span>
                      <span className="num text-muted-foreground">{fmtCompact(v)}</span>
                    </div>
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${max ? (v / max) * 100 : 0}%`,
                          background: color(v) as string,
                        }}
                      />
                    </div>
                  </button>
                </li>
              ))}
          </ul>
          <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
            Mapa basado en los 125 municipios oficiales de Antioquia agrupados en sus 9 subregiones.
          </p>
        </aside>
      </div>

      {/* ── Drawer de detalle ──────────────────────────────── */}
      {seleccion && <DetalleSubregion sub={seleccion} año={año} metrica={metrica} onClose={() => setSeleccion(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function DetalleSubregion({
  sub,
  año,
  metrica,
  onClose,
}: {
  sub: Subregion;
  año: number;
  metrica: Metrica;
  onClose: () => void;
}) {
  const top10 = useMemo(() => {
    const d = REGISTROS.filter((r) => r.subregion === sub && r.año === año);
    return topN(d, "rubro", metrica, 10);
  }, [sub, año, metrica]);

  const evolucion = useMemo(() => {
    const d = REGISTROS.filter((r) => r.subregion === sub);
    return serieAnual(d, metrica);
  }, [sub, metrica]);

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-md bg-card border-l border-border h-full overflow-y-auto p-5 animate-in slide-in-from-right duration-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Subregión</div>
            <h3 className="text-xl font-semibold">{sub}</h3>
            <div className="text-xs text-muted-foreground mt-1">
              {METRICA_LABEL[metrica]} · año <span className="num">{año}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <section className="mb-6">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Top 10 cultivos
          </h4>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={top10} layout="vertical" margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="var(--color-muted-foreground)"
                  fontSize={10}
                  tickFormatter={(v) => fmtCompact(v as number)}
                />
                <YAxis type="category" dataKey="clave" stroke="var(--color-muted-foreground)" fontSize={10} width={100} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    fontSize: 11,
                  }}
                  formatter={(v: any) => [fmtInt(v as number), METRICA_LABEL[metrica]]}
                />
                <Bar dataKey="valor" fill="var(--color-primary)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Evolución 2018–2023
          </h4>
          <div className="h-52">
            <ResponsiveContainer>
              <LineChart data={evolucion}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="año" stroke="var(--color-muted-foreground)" fontSize={10} />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={10}
                  tickFormatter={(v) => fmtCompact(v as number)}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    fontSize: 11,
                  }}
                  formatter={(v: any) => [fmtInt(v as number), METRICA_LABEL[metrica]]}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--color-primary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function MapaSkeleton() {
  return (
    <div className="w-full h-full grid place-items-center text-xs text-muted-foreground animate-pulse">
      Cargando mapa…
    </div>
  );
}

function MapaFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="w-full h-full grid place-items-center p-6">
      <div className="max-w-sm text-center space-y-3">
        <div className="mx-auto w-10 h-10 rounded-full bg-secondary/10 grid place-items-center">
          <AlertTriangle className="h-5 w-5 text-secondary" />
        </div>
        <h3 className="text-sm font-semibold">No fue posible cargar el mapa</h3>
        <p className="text-xs text-muted-foreground">
          El módulo cartográfico no respondió. Puedes seguir consultando el ranking de
          subregiones a la derecha mientras se restaura.
        </p>
        <p className="text-[10px] text-muted-foreground/80 font-mono break-all">
          {error.message}
        </p>
        <button
          onClick={reset}
          className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
