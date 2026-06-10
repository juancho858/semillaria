// Módulo 4 — Analizador de Oportunidad Productiva (IA).
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { SUBREGIONES } from "@/data/types";
import { listaCultivos } from "@/lib/dataset";

export const Route = createFileRoute("/analizador")({
  head: () => ({
    meta: [
      { title: "Analizador IA — Semillaria" },
      { name: "description", content: "Análisis de oportunidad productiva agrícola con IA." },
    ],
  }),
  component: AnalizadorPage,
});

type Enfoque =
  | "Expansión de área"
  | "Mejora de rendimiento"
  | "Diversificación"
  | "Sustitución de cultivos";

const ENFOQUES: Enfoque[] = [
  "Expansión de área",
  "Mejora de rendimiento",
  "Diversificación",
  "Sustitución de cultivos",
];

type Resultado = {
  diagnostico: string;
  oportunidad: string;
  riesgos: string;
  recomendacion: string;
};

const CULTIVOS = listaCultivos();

function AnalizadorPage() {
  const [subregion, setSubregion] = useState<string>("Antioquia completa");
  const [cultivo, setCultivo] = useState<string>("Todos");
  const [enfoque, setEnfoque] = useState<Enfoque>("Mejora de rendimiento");
  const [contexto, setContexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const analizar = async () => {
    setCargando(true);
    setError(null);
    setResultado(null);
    try {
      const res = await fetch("/api/analizador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subregion, cultivo, enfoque, contexto }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Falló el análisis");
      setResultado(body.resultado as Resultado);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 grid place-items-center rounded-md bg-primary/15 text-primary border border-primary/30">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Analizador de Oportunidad Productiva
          </h1>
          <p className="text-sm text-muted-foreground">
            Análisis con IA basado en los datos reales del observatorio.
          </p>
        </div>
      </header>

      {/* ── Configuración ──────────────────────────────── */}
      <section className="bg-card border border-border rounded-lg p-5 grid md:grid-cols-2 gap-4">
        <Field label="Subregión">
          <select
            value={subregion}
            onChange={(e) => setSubregion(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="Antioquia completa">Antioquia completa</option>
            {SUBREGIONES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cultivo">
          <select
            value={cultivo}
            onChange={(e) => setCultivo(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="Todos">Todos los cultivos</option>
            {CULTIVOS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Enfoque del análisis">
          <div className="grid grid-cols-2 gap-2">
            {ENFOQUES.map((e) => (
              <button
                key={e}
                onClick={() => setEnfoque(e)}
                className={
                  "text-left text-sm px-3 py-2 rounded-md border transition-colors " +
                  (enfoque === e
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground")
                }
              >
                {e}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Contexto adicional (opcional)">
          <textarea
            value={contexto}
            onChange={(e) => setContexto(e.target.value.slice(0, 1500))}
            placeholder="Ej: sequía 2023, nuevo mercado de exportación a EE.UU., obras viales..."
            rows={4}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
          <div className="text-[10px] text-muted-foreground text-right mt-1 num">
            {contexto.length}/1500
          </div>
        </Field>

        <div className="md:col-span-2 flex justify-end">
          <button
            onClick={analizar}
            disabled={cargando}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {cargando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analizando datos con IA…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analizar oportunidad
              </>
            )}
          </button>
        </div>
      </section>

      {/* ── Error ─────────────────────────────────────── */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/40 text-destructive-foreground rounded-md p-4 text-sm">
          <strong className="block mb-1">No se pudo completar el análisis</strong>
          {error}
        </div>
      )}

      {/* ── Resultado ─────────────────────────────────── */}
      {resultado && (
        <article className="space-y-3">
          <header className="text-xs uppercase tracking-wider text-muted-foreground">
            Análisis · {subregion} · {cultivo} · {enfoque}
          </header>
          <Seccion
            num={1}
            titulo="Diagnóstico actual"
            color="text-primary"
            texto={resultado.diagnostico}
          />
          <Seccion
            num={2}
            titulo="Oportunidad identificada"
            color="text-secondary"
            texto={resultado.oportunidad}
          />
          <Seccion
            num={3}
            titulo="Riesgos y consideraciones"
            color="text-muted-foreground"
            texto={resultado.riesgos}
          />
          <Seccion
            num={4}
            titulo="Recomendación para política pública o inversión"
            color="text-primary"
            texto={resultado.recomendacion}
            highlight
          />
        </article>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Seccion({
  num,
  titulo,
  color,
  texto,
  highlight,
}: {
  num: number;
  titulo: string;
  color: string;
  texto: string;
  highlight?: boolean;
}) {
  return (
    <section
      className={
        "bg-card border rounded-lg p-5 " +
        (highlight ? "border-primary/50 bg-primary/[0.04]" : "border-border")
      }
    >
      <div className="flex items-center gap-3 mb-2">
        <span className={"num text-xs " + color}>{String(num).padStart(2, "0")}</span>
        <h2 className="text-sm font-semibold tracking-tight">{titulo}</h2>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{texto}</p>
    </section>
  );
}
