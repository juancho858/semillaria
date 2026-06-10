// Server route: Analizador de Oportunidad con Lovable AI Gateway (streaming JSON).
import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { REGISTROS } from "@/data/dataset";
import { SUBREGIONES } from "@/data/types";
import { porSubregion, serieAnual } from "@/lib/dataset";

const Schema = z.object({
  subregion: z.string().min(1).max(60),
  cultivo: z.string().min(1).max(120),
  enfoque: z.enum([
    "Expansión de área",
    "Mejora de rendimiento",
    "Diversificación",
    "Sustitución de cultivos",
  ]),
  contexto: z.string().max(1500).optional().default(""),
});

const Resultado = z.object({
  diagnostico: z.string(),
  oportunidad: z.string(),
  riesgos: z.string(),
  recomendacion: z.string(),
});

function construirContexto(subregionSel: string, cultivoSel: string) {
  const todos = REGISTROS;
  const subFilter = subregionSel === "Antioquia completa" ? todos : todos.filter((r) => r.subregion === subregionSel);
  const cultivoFilter = cultivoSel === "Todos" ? subFilter : subFilter.filter((r) => r.rubro === cultivoSel);

  const serie = serieAnual(cultivoFilter, "volumenProduccionTon");
  const areaSerie = serieAnual(cultivoFilter, "areaTotalHa");
  const porSub = porSubregion(
    cultivoSel === "Todos" ? todos : todos.filter((r) => r.rubro === cultivoSel),
    "volumenProduccionTon",
  );
  const rankingSubs = SUBREGIONES.map((s) => ({ subregion: s, volumen: Math.round(porSub[s]) }))
    .sort((a, b) => b.volumen - a.volumen);

  const tendVol = serie.length >= 2 ? (serie.at(-1)!.valor - serie[0].valor) / Math.max(1, serie[0].valor) : 0;

  return {
    ambito: { subregion: subregionSel, cultivo: cultivoSel },
    serieVolumenTon: serie.map((p) => ({ año: p.año, valor: Math.round(p.valor) })),
    serieAreaHa: areaSerie.map((p) => ({ año: p.año, valor: Math.round(p.valor) })),
    crecimientoVolumenPctTotal: Number((tendVol * 100).toFixed(1)),
    rankingSubregionesPorVolumen: rankingSubs,
  };
}

export const Route = createFileRoute("/api/analizador")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let input: z.infer<typeof Schema>;
        try {
          input = Schema.parse(await request.json());
        } catch (e: any) {
          return Response.json({ error: "Entrada inválida", detalle: e.message }, { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return Response.json(
            { error: "LOVABLE_API_KEY no configurada" },
            { status: 500 },
          );
        }

        const contextoDatos = construirContexto(input.subregion, input.cultivo);

        const system = `Eres analista agrícola para entidades públicas de Antioquia (Colombia).
Responde SIEMPRE en español formal e institucional, con cifras concretas extraídas de los datos
proporcionados. Cada sección debe tener entre 2 y 4 oraciones, sin viñetas, sin emojis,
sin tecnicismos innecesarios. Habla a alcaldías y secretarías de agricultura.`;

        const prompt = `Datos reales (volumen en toneladas, área en hectáreas):
${JSON.stringify(contextoDatos, null, 2)}

Enfoque solicitado: ${input.enfoque}
Contexto adicional del usuario: ${input.contexto || "(sin contexto adicional)"}

Produce el análisis estructurado:
1. diagnostico: qué está pasando con ${input.cultivo} en ${input.subregion} según los datos 2018-2023.
2. oportunidad: qué se puede aprovechar dado el enfoque "${input.enfoque}".
3. riesgos: limitaciones, sesgos del dato y riesgos productivos/comerciales relevantes.
4. recomendacion: una recomendación concreta para política pública o inversión, ejecutable a 12 meses.`;

        try {
          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-3-flash-preview");

          const { output } = await generateText({
            model,
            system,
            prompt,
            output: Output.object({ schema: Resultado }),
          });

          return Response.json({ ok: true, resultado: output, contexto: contextoDatos });
        } catch (err: any) {
          // Forward gateway status codes when possible.
          const status = err?.statusCode ?? err?.status ?? 500;
          if (status === 429) {
            return Response.json(
              { error: "Límite de uso alcanzado. Intenta en unos minutos." },
              { status: 429 },
            );
          }
          if (status === 402) {
            return Response.json(
              { error: "Créditos de IA agotados en el workspace. Recarga créditos para continuar." },
              { status: 402 },
            );
          }
          console.error("Analizador error:", err);
          return Response.json(
            { error: "Falló el análisis", detalle: String(err?.message ?? err) },
            { status: 500 },
          );
        }
      },
    },
  },
});
