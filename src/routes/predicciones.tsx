// Módulo 3 — Predicciones con Medias Móviles (SMA / WMA).
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Calculator } from "lucide-react";
import { REGISTROS } from "@/data/dataset";
import type { Metrica } from "@/data/types";
import { METRICA_LABEL } from "@/data/types";
import { listaCultivos, serieAnual } from "@/lib/dataset";
import { calcularPrediccion, type MetodoMA } from "@/lib/forecast";
import { fmtCompact, fmtInt, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/predicciones")({
  head: () => ({
    meta: [
      { title: "Predicciones — Semillaria" },
      { name: "description", content: "Predicción 2024 con medias móviles SMA/WMA por cultivo." },
    ],
  }),
  component: PrediccionesPage,
});

const CULTIVOS = listaCultivos();

function PrediccionesPage() {
  const [cultivo, setCultivo] = useState<string>(CULTIVOS[0] ?? "Café");
  const [variable, setVariable] = useState<Metrica>("volumenProduccionTon");
  const [k, setK] = useState<2 | 3>(3);
  const [metodo, setMetodo] = useState<MetodoMA>("WMA");
  const [busqueda, setBusqueda] = useState("");
  const [resultado, setResultado] = useState<ReturnType<typeof calcularPrediccion> | null>(null);

  const opciones = useMemo(
    () =>
      CULTIVOS.filter((c) =>
        c.toLocaleLowerCase("es").includes(busqueda.toLocaleLowerCase("es")),
      ),
    [busqueda],
  );

  const ejecutar = () => {
    const datos = REGISTROS.filter((r) => r.rubro === cultivo);
    const serie = serieAnual(datos, variable);
    setResultado(calcularPrediccion(serie, k, metodo));
  };

  const chartData = useMemo(() => {
    if (!resultado) return [];
    const base = resultado.serie.map((p, i) => ({
      año: p.año,
      historico: p.valor,
      ma: resultado.ma[i].valor,
      prediccion: null as number | null,
    }));
    base.push({
      año: resultado.prediccion.año,
      historico: null as any,
      ma: null,
      prediccion: resultado.prediccion.valor,
    });
    return base;
  }, [resultado]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Predicciones con medias móviles</h1>
        <p className="text-sm text-muted-foreground">
          Calculado 100% en el navegador a partir de la serie histórica 2018–2023 del cultivo.
        </p>
      </header>

      {/* ── Controles ──────────────────────────────────── */}
      <section className="bg-card border border-border rounded-lg p-4 grid md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Cultivo</label>
          <input
            type="text"
            placeholder="Buscar cultivo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full mt-1 mb-1 bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <select
            value={cultivo}
            onChange={(e) => setCultivo(e.target.value)}
            size={4}
            className="w-full bg-surface border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {opciones.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <Field label="Variable">
          <select
            value={variable}
            onChange={(e) => setVariable(e.target.value as Metrica)}
            className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-sm"
          >
            {(Object.keys(METRICA_LABEL) as Metrica[]).map((m) => (
              <option key={m} value={m}>
                {METRICA_LABEL[m]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Ventana k">
          <div className="flex gap-1 bg-surface border border-border rounded-md p-0.5">
            {[2, 3].map((v) => (
              <button
                key={v}
                onClick={() => setK(v as 2 | 3)}
                className={
                  "flex-1 py-1.5 text-sm rounded-[5px] num " +
                  (k === v ? "bg-primary text-primary-foreground" : "text-muted-foreground")
                }
              >
                k={v}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Método">
          <div className="flex gap-1 bg-surface border border-border rounded-md p-0.5">
            {(["SMA", "WMA"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetodo(m)}
                className={
                  "flex-1 py-1.5 text-sm rounded-[5px] " +
                  (metodo === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")
                }
              >
                {m}
              </button>
            ))}
          </div>
        </Field>

        <div className="lg:col-span-5 flex">
          <button
            onClick={ejecutar}
            className="ml-auto inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Calculator className="h-4 w-4" />
            Calcular predicción
          </button>
        </div>
      </section>

      {/* ── Advertencia ────────────────────────────────── */}
      <div className="flex gap-3 bg-secondary/10 border border-secondary/40 rounded-lg p-3 text-xs text-foreground/90">
        <AlertTriangle className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
        <p>
          Con 6 años de datos el horizonte confiable es <strong>1 período</strong>. Interpreta la
          predicción como indicador de tendencia, no como valor exacto.
        </p>
      </div>

      {/* ── Resultado ──────────────────────────────────── */}
      {resultado && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Metric label={`Predicción ${resultado.prediccion.año}`} value={fmtInt(resultado.prediccion.valor)} unit={variable === "volumenProduccionTon" ? "t" : "ha"} highlight />
            <Metric label="MAE" value={fmtInt(resultado.metricas.mae)} unit="abs" hint="Error absoluto medio" />
            <Metric label="RMSE" value={fmtInt(resultado.metricas.rmse)} unit="abs" hint="Raíz del error cuadrático" />
            <Metric label="MAPE" value={fmtPct(resultado.metricas.mape)} unit="" hint="Error porcentual medio" />
          </div>

          <section className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-sm font-semibold mb-3">
              {cultivo} · {METRICA_LABEL[variable]} · {metodo}-{k}
            </h2>
            <div className="h-80">
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="año" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickFormatter={(v) => fmtCompact(v as number)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      fontSize: 11,
                    }}
                    formatter={(v: any) => (v == null ? "—" : fmtInt(v as number))}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="historico"
                    name="Histórico"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "var(--color-primary)" }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="ma"
                    name={`MA ${metodo}-${k}`}
                    stroke="var(--color-muted-foreground)"
                    strokeDasharray="6 4"
                    strokeWidth={1.8}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="prediccion"
                    name={`Predicción ${resultado.prediccion.año}`}
                    stroke="var(--color-secondary)"
                    strokeWidth={0}
                    dot={{ r: 6, fill: "var(--color-secondary)", stroke: "var(--color-background)", strokeWidth: 2 }}
                  />
                  <ReferenceDot
                    x={resultado.prediccion.año}
                    y={resultado.prediccion.valor}
                    r={7}
                    fill="var(--color-secondary)"
                    stroke="var(--color-background)"
                    strokeWidth={2}
                    label={{
                      value: fmtInt(resultado.prediccion.valor),
                      position: "top",
                      fill: "var(--color-secondary)",
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-4 overflow-x-auto">
            <h2 className="text-sm font-semibold mb-3">Tabla de valores</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 px-3 font-medium">Año</th>
                  <th className="py-2 px-3 font-medium text-right">Histórico</th>
                  <th className="py-2 px-3 font-medium text-right">{metodo}-{k}</th>
                  <th className="py-2 px-3 font-medium text-right">Predicción</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row) => (
                  <tr key={row.año} className="border-b border-border/40">
                    <td className="py-2 px-3 num">{row.año}</td>
                    <td className="py-2 px-3 text-right num">
                      {row.historico != null ? fmtInt(row.historico) : "—"}
                    </td>
                    <td className="py-2 px-3 text-right num text-muted-foreground">
                      {row.ma != null ? fmtInt(row.ma) : "—"}
                    </td>
                    <td className="py-2 px-3 text-right num text-secondary">
                      {row.prediccion != null ? fmtInt(row.prediccion) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  unit: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "bg-card border rounded-lg p-4 " +
        (highlight ? "border-secondary/60" : "border-border")
      }
    >
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={
            "num text-2xl font-semibold tracking-tight " + (highlight ? "text-secondary" : "")
          }
        >
          {value}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}
