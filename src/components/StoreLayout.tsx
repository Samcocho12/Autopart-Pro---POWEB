import { useState, type FormEvent } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { CarFront, LayoutDashboard, Minus, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { Logo, ProductoVisual } from "./ui";
import { useCart } from "../context/CartContext";
import { etiquetaVehiculo, useVehiculo, vehiculoParams } from "../context/VehicleContext";
import { money, partirNombre } from "../lib/format";

function CartDrawer() {
  const { items, open, setOpen, total, setQty, remove, count } = useCart();
  const nav = useNavigate();
  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setOpen(false)} />
      <aside className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-ink-700 bg-ink-850 shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <h2 className="font-display text-lg font-bold">Tu carrito <span className="mono text-sm text-ink-400">({count})</span></h2>
          <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-ink-700" aria-label="Cerrar carrito"><X className="size-5" /></button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {items.length === 0 && <p className="py-16 text-center text-sm text-ink-300">Aún no has agregado repuestos.</p>}
          {items.map((i) => {
            const { titulo, vehiculo } = partirNombre(i.nombre);
            return (
              <div key={i.id} className="flex gap-3 rounded-xl border border-ink-700 bg-ink-800/60 p-3">
                <ProductoVisual slug={i.categoria_slug} nombre={i.nombre} imagen={i.imagen_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{titulo}</p>
                  <p className="truncate text-xs text-ink-400">{i.fabricante}{vehiculo ? ` · ${vehiculo}` : ""}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-ink-600">
                      <button className="p-1.5 hover:text-signal" onClick={() => setQty(i.id, i.cantidad - 1)} aria-label="Restar"><Minus className="size-3.5" /></button>
                      <span className="mono w-7 text-center text-sm">{i.cantidad}</span>
                      <button className="p-1.5 hover:text-signal disabled:opacity-30" disabled={i.cantidad >= i.stock} onClick={() => setQty(i.id, i.cantidad + 1)} aria-label="Sumar"><Plus className="size-3.5" /></button>
                    </div>
                    <span className="mono text-sm font-semibold">{money(i.precio * i.cantidad)}</span>
                  </div>
                </div>
                <button onClick={() => remove(i.id)} className="self-start p-1 text-ink-400 hover:text-danger" aria-label="Quitar"><Trash2 className="size-4" /></button>
              </div>
            );
          })}
        </div>
        <div className="space-y-3 border-t border-ink-700 p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink-300">Total (IVA incluido)</span>
            <span className="mono text-2xl font-semibold">{money(total)}</span>
          </div>
          <button className="btn-primary w-full py-3" disabled={!items.length} onClick={() => { setOpen(false); nav("/checkout"); }}>Finalizar compra</button>
        </div>
      </aside>
    </>
  );
}

export default function StoreLayout() {
  const { count, setOpen } = useCart();
  const { vehiculo } = useVehiculo();
  const [q, setQ] = useState("");
  const nav = useNavigate();

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    nav(`/catalogo${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-700/80 bg-ink-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="shrink-0"><Logo /></Link>
          <nav className="ml-4 hidden items-center gap-1 text-sm md:flex">
            {[["/", "Inicio"], ["/catalogo", "Catálogo"]].map(([to, t]) => (
              <NavLink key={to} to={to} end className={({ isActive }) => `rounded-lg px-3 py-2 transition ${isActive ? "text-ink-100" : "text-ink-300 hover:text-ink-100"}`}>{t}</NavLink>
            ))}
          </nav>
          <form onSubmit={buscar} className="relative ml-auto hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" />
            <input className="input pl-10" placeholder="Busca por nombre, SKU o marca…" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          {vehiculo && (
            <Link to={`/catalogo?${vehiculoParams(vehiculo)}`} className="hidden items-center gap-2 rounded-xl border border-signal/30 bg-signal/10 px-3 py-2 text-xs font-medium text-signal-soft lg:flex">
              <CarFront className="size-4" />{etiquetaVehiculo(vehiculo)}
            </Link>
          )}
          <Link to="/admin" className="btn-ghost hidden px-3 sm:inline-flex" title="Panel administrativo"><LayoutDashboard className="size-4" /></Link>
          <button onClick={() => setOpen(true)} className="btn-ghost relative ml-auto px-3 sm:ml-0" aria-label="Abrir carrito">
            <ShoppingCart className="size-4" />
            {count > 0 && <span className="mono absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-signal text-[10px] font-bold text-ink-950">{count}</span>}
          </button>
        </div>
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="mt-20 border-t border-ink-700/80">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-10 text-sm text-ink-400 sm:flex-row sm:items-center sm:px-6">
          <div className="space-y-2">
            <Logo />
            <p>Inventario inteligente y venta técnica de repuestos automotrices.</p>
          </div>
          <div className="space-y-1 sm:text-right">
            <p>Pagos procesados con <span className="font-semibold text-ink-200">Wompi</span> (entorno Sandbox)</p>
            <p>Proyecto final · Programación orientada a la Web · {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
      <CartDrawer />
    </div>
  );
}
