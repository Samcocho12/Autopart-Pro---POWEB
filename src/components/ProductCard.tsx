import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import type { ProductoResumen } from "../lib/types";
import { money, partirNombre } from "../lib/format";
import { ProductoVisual, StockBadge } from "./ui";
import { useCart } from "../context/CartContext";

export default function ProductCard({ p, i = 0 }: { p: ProductoResumen; i?: number }) {
  const { add } = useCart();
  const { titulo, vehiculo: vehiculoNombre } = partirNombre(p.nombre);
  const vehiculo = p.vehiculo_compatible ?? vehiculoNombre;
  return (
    <article
      className="card group animate-rise flex flex-col overflow-hidden p-3 transition hover:-translate-y-0.5 hover:border-ink-500 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]"
      style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
    >
      <Link to={`/producto/${p.id}`} className="block">
        <ProductoVisual slug={p.categoria_slug} sku={p.sku} nombre={p.nombre} imagen={p.imagen_url} />
      </Link>
      <div className="flex flex-1 flex-col px-1 pt-3">
        <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] uppercase tracking-wider">
          <span className="font-semibold text-signal">{p.fabricante}</span>
          <span className="text-ink-400">{p.categoria}</span>
        </div>
        <Link to={`/producto/${p.id}`} className="font-semibold leading-snug text-ink-100 transition group-hover:text-signal">{titulo}</Link>
        {vehiculo && <p className="mt-1 text-xs text-ink-300">{vehiculo}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="mono text-lg font-semibold">{money(p.precio_venta)}</p>
            <div className="mt-1"><StockBadge stock={p.stock} /></div>
          </div>
          <button
            onClick={() => add(p)}
            disabled={p.stock <= 0}
            className="grid size-10 place-items-center rounded-xl bg-signal text-ink-950 transition hover:bg-signal-soft disabled:bg-ink-700 disabled:text-ink-400"
            aria-label={`Agregar ${titulo} al carrito`}
          >
            <Plus className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </article>
  );
}
