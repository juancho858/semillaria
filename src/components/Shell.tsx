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
  Sprout,
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
          "hidden md:flex flex-col bg-sidebar text-sidebar-foreground sticky top-0 h-screen transition-[width] duration-300 ease-out",
          "shadow-elev-lg",
          collapsed ? "w-[76px]" : "w-[256px]",
        )}
      >
        <div className="flex items-center gap-3 px-4 h-20 border-b border-sidebar-border/60">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shrink-0 grid place-items-center shadow-elev-sm ring-1 ring-white/20">
            <img src={logo.url} alt="Semillaria" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display text-2xl text-white">Semillaria</div>
              <div className="text-[9.5px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
                Observatorio Agrícola
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-white",
                )}
              >
                {active && (
                  <>
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full bg-sidebar-primary shadow-[0_0_12px_var(--sidebar-primary)]" />
                    <span className="absolute inset-0 rounded-lg bg-sidebar-primary/5 pointer-events-none" />
                  </>
                )}
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors relative",
                    active ? "text-sidebar-primary" : "group-hover:text-sidebar-primary/80",
                  )}
                />
                {!collapsed && <span className="truncate relative">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="px-4 py-3 mx-3 mb-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
              <Sprout className="h-3 w-3 text-sidebar-primary" />
              Periodo
            </div>
            <div className="mt-0.5 font-display text-lg text-white">2018 – 2023</div>
          </div>
        )}

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center h-11 border-t border-sidebar-border/60 text-sidebar-foreground/60 hover:text-white hover:bg-white/5 transition-colors"
          aria-label={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* ── Contenido principal ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-4 md:px-10">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-white shadow-elev-sm">
              <img src={logo.url} alt="Semillaria" className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-xl">Semillaria</span>
          </div>
          <div className="hidden md:block">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Observatorio Agrícola · Antioquia
            </div>
            <h1 className="font-display text-2xl text-foreground leading-tight">
              Panorama {año}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Año
            </span>
            <div className="flex bg-surface rounded-full border border-border p-1 shadow-elev-sm">
              {AÑOS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAño(a)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full num transition-all duration-200",
                    año === a
                      ? "bg-gradient-primary text-primary-foreground shadow-elev-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-10 py-8 pb-24 md:pb-10 animate-fade-up">
          {children ?? <Outlet />}
        </main>

        {/* ── Bottom nav (mobile) ───────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-sidebar border-t border-sidebar-border grid grid-cols-5 shadow-elev-lg">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] relative",
                  active ? "text-sidebar-primary" : "text-sidebar-foreground/60",
                )}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-sidebar-primary" />
                )}
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
