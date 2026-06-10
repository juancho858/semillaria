// Lógica de predicción con medias móviles (SMA y WMA).
// Trabaja sobre series anuales unidimensionales.

export type MetodoMA = "SMA" | "WMA";

export type ResultadoPrediccion = {
  serie: { año: number; valor: number }[];
  ma: { año: number; valor: number | null }[]; // MA "in-sample" (alineada al año t)
  prediccion: { año: number; valor: number };
  metricas: { mae: number; rmse: number; mape: number };
};

/**
 * SMA(t) = promedio de los k valores anteriores (no incluye t).
 */
function smaAt(serie: number[], t: number, k: number): number | null {
  if (t < k) return null;
  let s = 0;
  for (let i = t - k; i < t; i++) s += serie[i];
  return s / k;
}

/**
 * WMA(t) = promedio ponderado con pesos lineales [1..k] normalizados sobre los
 * k valores anteriores. El más reciente pesa más.
 */
function wmaAt(serie: number[], t: number, k: number): number | null {
  if (t < k) return null;
  let s = 0;
  let pesoTotal = 0;
  for (let i = 0; i < k; i++) {
    const peso = i + 1; // 1..k
    const valor = serie[t - k + i]; // del más viejo al más reciente
    s += peso * valor;
    pesoTotal += peso;
  }
  return s / pesoTotal;
}

export function calcularPrediccion(
  puntos: { año: number; valor: number }[],
  k: 2 | 3,
  metodo: MetodoMA,
): ResultadoPrediccion {
  const valores = puntos.map((p) => p.valor);
  const años = puntos.map((p) => p.año);
  const fn = metodo === "SMA" ? smaAt : wmaAt;

  // MA in-sample alineada al año t (usa valores estrictamente anteriores).
  const ma = puntos.map((p, t) => ({
    año: p.año,
    valor: fn(valores, t, k),
  }));

  // Predicción para el año siguiente al último (típicamente 2024).
  const tNuevo = valores.length;
  const valorPred = fn(valores, tNuevo, k) ?? valores[valores.length - 1];
  const añoNuevo = años[años.length - 1] + 1;

  // Métricas in-sample con shift de 1 período: comparar MA(t) vs valor real en t.
  let sumAbs = 0;
  let sumCuad = 0;
  let sumPct = 0;
  let n = 0;
  for (let t = 0; t < valores.length; t++) {
    const pred = ma[t].valor;
    if (pred == null) continue;
    const real = valores[t];
    const err = pred - real;
    sumAbs += Math.abs(err);
    sumCuad += err * err;
    if (real !== 0) sumPct += Math.abs(err / real);
    n++;
  }
  const mae = n ? sumAbs / n : 0;
  const rmse = n ? Math.sqrt(sumCuad / n) : 0;
  const mape = n ? sumPct / n : 0;

  return {
    serie: puntos,
    ma,
    prediccion: { año: añoNuevo, valor: valorPred },
    metricas: { mae, rmse, mape },
  };
}
