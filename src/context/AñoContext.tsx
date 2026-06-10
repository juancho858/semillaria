// Contexto global del año seleccionado (header → todos los módulos).
import { createContext, useContext, useState, type ReactNode } from "react";
import { AÑOS } from "@/data/types";

type Ctx = {
  año: number;
  setAño: (a: number) => void;
};

const AñoContext = createContext<Ctx | null>(null);

export function AñoProvider({ children }: { children: ReactNode }) {
  const [año, setAño] = useState<number>(AÑOS[AÑOS.length - 1]);
  return <AñoContext.Provider value={{ año, setAño }}>{children}</AñoContext.Provider>;
}

export function useAño() {
  const ctx = useContext(AñoContext);
  if (!ctx) throw new Error("useAño debe usarse dentro de <AñoProvider>");
  return ctx;
}
