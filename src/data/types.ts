// Tipos del dataset agrícola de Antioquia.

export type TipoCultivo = "Transitorio" | "Permanente" | "Anual";

export const SUBREGIONES = [
  "Oriente",
  "Urabá",
  "Norte",
  "Occidente",
  "Valle de Aburrá",
  "Suroeste",
  "Magdalena Medio",
  "Bajo Cauca",
  "Nordeste",
] as const;

export type Subregion = (typeof SUBREGIONES)[number];

export type Registro = {
  tipo: TipoCultivo;
  rubro: string;
  subregion: Subregion;
  año: number;
  municipio: string;
  areaTotalHa: number;
  areaProduccionHa: number;
  volumenProduccionTon: number;
};

export type Metrica = "areaTotalHa" | "areaProduccionHa" | "volumenProduccionTon";

export const METRICA_LABEL: Record<Metrica, string> = {
  areaTotalHa: "Área Total (ha)",
  areaProduccionHa: "Área en Producción (ha)",
  volumenProduccionTon: "Volumen Producido (t)",
};

export const AÑOS = [2018, 2019, 2020, 2021, 2022, 2023] as const;
export type Año = (typeof AÑOS)[number];
