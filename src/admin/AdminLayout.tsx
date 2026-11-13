import type { ReactNode } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { ArrowLeftRight, BellRing, Boxes, ExternalLink, LayoutDashboard, LogOut, Receipt } from "lucide-react";
import { Cargando, Logo } from "../components/ui";
import { useAuth } from "../context/AuthContext";

const NAV = [
  ["/admin", "Dashboard", LayoutDashboard],
  ["/admin/inventario", "Inventario", Boxes],
  ["/admin/alertas", "Alertas de stock", BellRing],
  ["/admin/movimientos", "Kardex", ArrowLeftRight],
  ["/admin/pedidos", "Pedidos", Receipt],
] as const;

export default function AdminLayout() {
  const { usuario, cargando, logout } = useAuth();
  const loc = useLocation();
  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 z-20 flex flex-col border-b border-ink-700 bg-ink-950 lg:h-screen lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:flex-col lg:items-start lg:py-6">
          <Logo />
          <span className="chip border-ink-600 text-[10px] tracking-wider text-ink-300 uppercase">Admin</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
          {NAV.map(([to, t, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin"}
              className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-signal/15 text-signal-soft" : "text-ink-300 hover:bg-ink-800 hover:text-ink-100"}`}
            >
              <Icon className="size-4" />{t}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto hidden space-y-1 border-t border-ink-800 p-3 lg:block">
          <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-300 hover:bg-ink-800"><ExternalLink className="size-4" />Ver tienda</a>
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-signal to-signal-deep font-display font-bold text-ink-950">{usuario.nombre[0]}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{usuario.nombre}</p>
              <p className="text-xs capitalize text-ink-400">{usuario.rol}</p>
            </div>
            <button onClick={logout} className="rounded-lg p-2 text-ink-400 hover:bg-ink-700 hover:text-danger" title="Cerrar sesión"><LogOut className="size-4" /></button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8"><Outlet /></main>
    </div>
  );
}

export function Encabezado({ titulo, sub, children }: { titulo: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold">{titulo}</h1>
        {sub && <p className="mt-1 text-sm text-ink-300">{sub}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
