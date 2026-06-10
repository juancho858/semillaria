// Canvas SVG del mapa (aislado para permitir carga perezosa + fallback).
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import topo from "@/data/antioquia-topo.json";
import { MUNICIPIO_A_SUBREGION } from "@/data/municipios-subregion";
import type { Subregion } from "@/data/types";

type Props = {
  porSub: Record<string, number>;
  color: (v: number) => string;
  hover: Subregion | null;
  onHover: (sub: Subregion | null, x: number, y: number) => void;
  onSelect: (sub: Subregion) => void;
};

export default function MapaCanvas({ porSub, color, hover, onHover, onSelect }: Props) {
  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{ scale: 9500, center: [-75.6, 6.7] }}
      width={800}
      height={640}
      style={{ width: "100%", height: "100%" }}
    >
      <Geographies geography={topo as any}>
        {({ geographies }: { geographies: any[] }) =>
          geographies.map((geo: any) => {
            const name = geo.properties.name as string;
            const sub = MUNICIPIO_A_SUBREGION[name] as Subregion | undefined;
            const v = sub ? porSub[sub] : 0;
            const fill = sub ? color(v) : "var(--color-muted)";
            const isHover = !!hover && hover === sub;
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onMouseEnter={(e: any) => sub && onHover(sub, e.clientX, e.clientY)}
                onMouseMove={(e: any) => sub && onHover(sub, e.clientX, e.clientY)}
                onClick={() => sub && onSelect(sub)}
                style={{
                  default: {
                    fill: fill as string,
                    stroke: "var(--color-background)",
                    strokeWidth: 0.4,
                    outline: "none",
                    cursor: sub ? "pointer" : "default",
                  },
                  hover: {
                    fill: fill as string,
                    stroke: "var(--color-primary)",
                    strokeWidth: isHover ? 1.5 : 0.6,
                    outline: "none",
                    cursor: "pointer",
                  },
                  pressed: {
                    fill: fill as string,
                    stroke: "var(--color-primary)",
                    strokeWidth: 1.5,
                    outline: "none",
                  },
                }}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
}
