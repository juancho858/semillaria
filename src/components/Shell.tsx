// Layout principal: sidebar colapsable + header con selector de año.
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Brain,
  ChevronLeft,
  ChevronRight,
  LineChart,
  Map as MapIcon,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { AÑOS } from "@/data/types";
import { useAño } from "@/context/AñoContext";
import logo from "@/assets/semillaria-logo.asset.json";
import { cn } from "@/lib/utils";

type Nav = { to: string; label: string; icon: LucideIcon };

const NAV: Nav[] = [
  { to: "/", label: "Resumen General", icon: BarChart3 },
  { to: "/mapa", label: "Mapa de Calor", icon: MapIcon },
  { to: "/predicciones", label: "Predicciones", icon: LineChart },
  { to: "/analizador", label: "Analizador IA", icon: Brain },
  { to: "/diagnostico", label: "Diagnóstico", icon: Activity },
];

export function Shell({ children }: { children?: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { año, setAño } = useAño();

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex">
      {/* ── Sidebar (desktop) ────────────────────────────────── */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar border-r border-sidebar-border sticky top-0 h-screen transition-[width] duration-150 ease-out",
          collapsed ? "w-[68px]" : "w-[244px]",
        )}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-md overflow-hidden bg-white shrink-0 grid place-items-center">
            <img src={logo.url} alt="Semillaria" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">Semillaria</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Observatorio Agrícola
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center h-10 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
          aria-label={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* ── Contenido principal ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-md overflow-hidden bg-white">
              <img src={logo.url} alt="Semillaria" className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold">Semillaria</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-sm font-medium text-muted-foreground">
              Observatorio Agrícola de Antioquia
              <span className="ml-2 text-foreground/60">· {año}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs uppercase tracking-wider text-muted-foreground">
              Año
            </span>
            <div className="flex bg-surface rounded-md border border-border p-0.5">
              {AÑOS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAño(a)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-[5px] font-mono transition-colors",
                    año === a
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 pb-24 md:pb-8">{children ?? <Outlet />}</main>

        {/* ── Bottom nav (mobile) ───────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-sidebar border-t border-sidebar-border grid grid-cols-4">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[10px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate max-w-[80px]">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
