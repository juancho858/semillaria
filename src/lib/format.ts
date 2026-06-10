// Formatos numéricos institucionales (es-CO, separador de miles con punto).
const nf0 = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
const nfPct = new Intl.NumberFormat("es-CO", {
  style: "percent",
  maximumFractionDigits: 1,
});

export const fmtInt = (n: number) => nf0.format(Math.round(n));
export const fmtNum = (n: number) => nf1.format(n);
export const fmtPct = (n: number) => nfPct.format(n);

export const fmtCompact = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `${nf1.format(n / 1_000_000)} M`;
  if (Math.abs(n) >= 1_000) return `${nf1.format(n / 1_000)} k`;
  return nf0.format(n);
};
