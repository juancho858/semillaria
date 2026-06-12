// Módulo de diagnóstico: chequea dependencias críticas y entorno del servidor.
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, RefreshCcw, XCircle } from "lucide-react";
import { checkDependencies } from "@/lib/diagnostics.functions";

export const Route = createFileRoute("/diagnostico")({
  head: () => ({
    meta: [
      { title: "Diagnóstico — Semillaria" },
      { name: "description", content: "Verificación de dependencias y entorno del servidor." },
    ],
  }),
  component: DiagnosticoPage,
});

function DiagnosticoPage() {
  const run = useServerFn(checkDependencies);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["diagnostico"],
    queryFn: () => run(),
  });

  const missing = data?.missing ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Diagnóstico del sistema</h1>
          <p className="text-sm text-muted-foreground">
            Estado de dependencias críticas y variables de entorno del servidor.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCcw className={"h-3.5 w-3.5 " + (isFetching ? "animate-spin" : "")} />
          Revaluar
        </button>
      </header>

      {missing.length > 0 && (
        <div className="border border-secondary/40 bg-secondary/5 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-secondary">
            {missing.length} módulo{missing.length === 1 ? "" : "s"} no disponible{missing.length === 1 ? "" : "s"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Estos paquetes no se pudieron cargar y podrían romper el build:
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {missing.map((m) => (
              <li key={m} className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary/10 text-secondary">
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <h2 className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
          Dependencias
        </h2>
        {isLoading && <div className="p-4 text-sm text-muted-foreground">Evaluando…</div>}
        <ul className="divide-y divide-border">
          {data?.checks.map((c) => (
            <li key={c.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                {c.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-secondary shrink-0" />
                )}
                <span className="text-sm font-mono truncate">{c.name}</span>
              </div>
              <div className="text-xs text-muted-foreground font-mono shrink-0">
                {c.ok ? (c.version ?? "ok") : <span className="text-secondary">{c.error}</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {data && (
        <section className="bg-card border border-border rounded-lg p-4 text-xs space-y-1">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Entorno del servidor
          </h2>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <span className="text-muted-foreground">node</span>
            <span>{data.env.node}</span>
            <span className="text-muted-foreground">LOVABLE_API_KEY</span>
            <span className={data.env.lovableKey ? "text-primary" : "text-secondary"}>
              {data.env.lovableKey ? "configurada" : "ausente"}
            </span>
            <span className="text-muted-foreground">SUPABASE_URL</span>
            <span className={data.env.supabaseUrl ? "text-primary" : "text-secondary"}>
              {data.env.supabaseUrl ? "configurada" : "ausente"}
            </span>
            <span className="text-muted-foreground">timestamp</span>
            <span>{data.timestamp}</span>
          </div>
        </section>
      )}
    </div>
  );
}
