// Helpers de agregación sobre el dataset.
import { REGISTROS } from "@/data/dataset";
import type { Año, Metrica, Registro, Subregion } from "@/data/types";
import { AÑOS, SUBREGIONES } from "@/data/types";

export type Filtros = {
  año?: number | "todos";
  tipo?: Registro["tipo"] | "todos";
  subregion?: Subregion | "todos";
  rubro?: string | "todos";
};

export function aplicarFiltros(filtros: Filtros, data: Registro[] = REGISTROS): Registro[] {
  return data.filter((r) => {
    if (filtros.año && filtros.año !== "todos" && r.año !== filtros.año) return false;
    if (filtros.tipo && filtros.tipo !== "todos" && r.tipo !== filtros.tipo) return false;
    if (filtros.subregion && filtros.subregion !== "todos" && r.subregion !== filtros.subregion) return false;
    if (filtros.rubro && filtros.rubro !== "todos" && r.rubro !== filtros.rubro) return false;
    return true;
  });
}

export function sumar(data: Registro[], metrica: Metrica): number {
  let s = 0;
  for (const r of data) s += r[metrica];
  return s;
}

export function agregadoPor<K extends keyof Registro>(
  data: Registro[],
  campo: K,
  metrica: Metrica,
): { clave: string; valor: number }[] {
  const m = new Map<string, number>();
  for (const r of data) {
    const k = String(r[campo]);
    m.set(k, (m.get(k) ?? 0) + r[metrica]);
  }
  return [...m.entries()].map(([clave, valor]) => ({ clave, valor }));
}

export function topN(
  data: Registro[],
  campo: keyof Registro,
  metrica: Metrica,
  n = 10,
): { clave: string; valor: number }[] {
  return agregadoPor(data, campo, metrica)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, n);
}

export function porSubregion(data: Registro[], metrica: Metrica): Record<Subregion, number> {
  const out = Object.fromEntries(SUBREGIONES.map((s) => [s, 0])) as Record<Subregion, number>;
  for (const r of data) out[r.subregion] += r[metrica];
  return out;
}

/**
 * Serie temporal 2018–2023 agregada por la métrica indicada, opcionalmente
 * filtrada antes. Devuelve un punto por año en orden cronológico.
 */
export function serieAnual(
  data: Registro[],
  metrica: Metrica,
): { año: number; valor: number }[] {
  const m = new Map<number, number>();
  for (const a of AÑOS) m.set(a, 0);
  for (const r of data) m.set(r.año, (m.get(r.año) ?? 0) + r[metrica]);
  return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([año, valor]) => ({ año, valor }));
}

export function listaCultivos(): string[] {
  return [...new Set(REGISTROS.map((r) => r.rubro))].sort((a, b) => a.localeCompare(b, "es"));
}

export function tipoDeCultivo(rubro: string): Registro["tipo"] | undefined {
  return REGISTROS.find((r) => r.rubro === rubro)?.tipo;
}

export function lider(data: Registro[], campo: keyof Registro, metrica: Metrica): string {
  const agg = topN(data, campo, metrica, 1);
  return agg[0]?.clave ?? "—";
}

export function topCultivosDeSubregion(
  subregion: Subregion,
  año: Año | number,
  metrica: Metrica,
  n = 3,
): { clave: string; valor: number }[] {
  const data = REGISTROS.filter((r) => r.subregion === subregion && r.año === año);
  return topN(data, "rubro", metrica, n);
}
