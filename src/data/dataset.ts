// ──────────────────────────────────────────────────────────────
// Dataset PLACEHOLDER del Observatorio Agrícola de Antioquia.
//
// Estos registros son sintéticos pero respetan la estructura del
// CSV oficial. Reemplaza este archivo con los datos reales cuando
// estén disponibles manteniendo la misma forma `Registro[]`.
//
// Mientras tanto los valores son deterministas (semilla = clave)
// para que las gráficas no cambien entre recargas.
// ──────────────────────────────────────────────────────────────
import type { Registro, Subregion, TipoCultivo } from "./types";
import { AÑOS } from "./types";

// Catálogo de cultivos representativos por tipo.
const CULTIVOS: { rubro: string; tipo: TipoCultivo; subregionesFuertes: Subregion[]; escala: number }[] = [
  { rubro: "Café", tipo: "Permanente", subregionesFuertes: ["Suroeste", "Oriente", "Norte"], escala: 5200 },
  { rubro: "Aguacate Hass", tipo: "Permanente", subregionesFuertes: ["Suroeste", "Oriente"], escala: 3800 },
  { rubro: "Plátano", tipo: "Permanente", subregionesFuertes: ["Urabá", "Suroeste", "Magdalena Medio"], escala: 4200 },
  { rubro: "Banano", tipo: "Permanente", subregionesFuertes: ["Urabá"], escala: 9800 },
  { rubro: "Caña panelera", tipo: "Permanente", subregionesFuertes: ["Oriente", "Suroeste", "Occidente"], escala: 2600 },
  { rubro: "Cacao", tipo: "Permanente", subregionesFuertes: ["Bajo Cauca", "Magdalena Medio", "Nordeste"], escala: 1100 },
  { rubro: "Cítricos", tipo: "Permanente", subregionesFuertes: ["Oriente", "Suroeste"], escala: 1700 },
  { rubro: "Mora", tipo: "Permanente", subregionesFuertes: ["Oriente", "Norte"], escala: 600 },
  { rubro: "Tomate de árbol", tipo: "Permanente", subregionesFuertes: ["Oriente", "Norte"], escala: 500 },
  { rubro: "Lulo", tipo: "Permanente", subregionesFuertes: ["Oriente", "Suroeste"], escala: 380 },
  { rubro: "Piña", tipo: "Permanente", subregionesFuertes: ["Suroeste", "Urabá"], escala: 1200 },
  { rubro: "Fríjol", tipo: "Transitorio", subregionesFuertes: ["Oriente", "Norte", "Occidente"], escala: 2400 },
  { rubro: "Maíz tradicional", tipo: "Transitorio", subregionesFuertes: ["Norte", "Bajo Cauca", "Magdalena Medio"], escala: 3100 },
  { rubro: "Maíz tecnificado", tipo: "Transitorio", subregionesFuertes: ["Bajo Cauca", "Magdalena Medio"], escala: 1900 },
  { rubro: "Papa", tipo: "Transitorio", subregionesFuertes: ["Norte", "Oriente"], escala: 1500 },
  { rubro: "Hortalizas", tipo: "Transitorio", subregionesFuertes: ["Oriente", "Valle de Aburrá"], escala: 700 },
  { rubro: "Arroz secano", tipo: "Transitorio", subregionesFuertes: ["Bajo Cauca", "Magdalena Medio"], escala: 1400 },
  { rubro: "Yuca", tipo: "Anual", subregionesFuertes: ["Urabá", "Bajo Cauca", "Nordeste"], escala: 2200 },
  { rubro: "Ñame", tipo: "Anual", subregionesFuertes: ["Bajo Cauca", "Urabá"], escala: 350 },
];

// Hash determinista simple para semilla pseudoaleatoria.
function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

// Rendimiento aproximado (t/ha) por cultivo para volumen coherente.
const RENDIMIENTO: Record<string, number> = {
  "Café": 1.2,
  "Aguacate Hass": 12,
  "Plátano": 9,
  "Banano": 35,
  "Caña panelera": 6,
  "Cacao": 0.6,
  "Cítricos": 14,
  "Mora": 8,
  "Tomate de árbol": 14,
  "Lulo": 10,
  "Piña": 38,
  "Fríjol": 1.1,
  "Maíz tradicional": 1.6,
  "Maíz tecnificado": 4.8,
  "Papa": 18,
  "Hortalizas": 12,
  "Arroz secano": 3.4,
  "Yuca": 12,
  "Ñame": 11,
};

// Tendencia anual leve para hacer las series interesantes.
const TENDENCIA_ANUAL: Record<string, number> = {
  "Aguacate Hass": 0.12,
  "Cacao": 0.06,
  "Café": -0.01,
  "Papa": -0.02,
  "Banano": 0.01,
};

function generar(): Registro[] {
  const out: Registro[] = [];
  for (const cultivo of CULTIVOS) {
    for (const subregion of cultivo.subregionesFuertes) {
      // 2-4 municipios por (cultivo, subregión)
      const nMun = 2 + Math.floor(hash(`${cultivo.rubro}|${subregion}|n`) * 3);
      for (let m = 0; m < nMun; m++) {
        const municipio = `Mun. ${subregion} ${m + 1}`;
        const base = cultivo.escala * (0.4 + hash(`${cultivo.rubro}|${subregion}|${m}|b`) * 0.9);
        const tendencia = TENDENCIA_ANUAL[cultivo.rubro] ?? 0;
        for (const año of AÑOS) {
          const ruido = 0.85 + hash(`${cultivo.rubro}|${subregion}|${m}|${año}`) * 0.3;
          const factorAño = Math.pow(1 + tendencia, año - 2018);
          const areaTotal = base * ruido * factorAño;
          const areaProd = areaTotal * (0.78 + hash(`p|${cultivo.rubro}|${año}`) * 0.18);
          const volumen = areaProd * (RENDIMIENTO[cultivo.rubro] ?? 5) * (0.9 + hash(`v|${cultivo.rubro}|${año}`) * 0.2);
          out.push({
            tipo: cultivo.tipo,
            rubro: cultivo.rubro,
            subregion,
            año,
            municipio,
            areaTotalHa: Math.round(areaTotal * 10) / 10,
            areaProduccionHa: Math.round(areaProd * 10) / 10,
            volumenProduccionTon: Math.round(volumen * 10) / 10,
          });
        }
      }
    }
  }
  return out;
}

export const REGISTROS: Registro[] = generar();
