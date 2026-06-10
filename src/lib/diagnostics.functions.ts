// Server function: chequea presencia y versión de dependencias críticas.
import { createServerFn } from "@tanstack/react-start";

type Check = { name: string; ok: boolean; version?: string; error?: string };

const CRITICAS = [
  "react",
  "react-dom",
  "@tanstack/react-router",
  "@tanstack/react-start",
  "ai",
  "@ai-sdk/openai-compatible",
  "react-simple-maps",
  "d3-scale",
  "d3-scale-chromatic",
  "recharts",
  "zod",
  "@supabase/supabase-js",
];

export const checkDependencies = createServerFn({ method: "GET" }).handler(async () => {
  const results: Check[] = [];
  for (const name of CRITICAS) {
    try {
      const mod: any = await import(/* @vite-ignore */ name);
      results.push({
        name,
        ok: true,
        version: mod?.version ?? mod?.default?.version ?? undefined,
      });
    } catch (e: any) {
      results.push({ name, ok: false, error: String(e?.message ?? e) });
    }
  }

  const env = {
    node: typeof process !== "undefined" ? process.version : "n/a",
    lovableKey: !!process.env.LOVABLE_API_KEY,
    supabaseUrl: !!process.env.SUPABASE_URL || !!process.env.VITE_SUPABASE_URL,
  };

  return {
    timestamp: new Date().toISOString(),
    checks: results,
    env,
    missing: results.filter((r) => !r.ok).map((r) => r.name),
  };
});
