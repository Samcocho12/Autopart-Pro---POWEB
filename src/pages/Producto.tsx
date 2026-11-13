import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, CarFront, ChevronLeft, MapPin, Minus, Plus, ShoppingCart, Truck } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { Cargando, ErrorBox, ProductoVisual, StockBadge } from "../components/ui";
import { useCart } from "../context/CartContext";
import { etiquetaVehiculo, useVehiculo } from "../context/VehicleContext";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { money, partirNombre } from "../lib/format";
import type { ProductoDetalle } from "../lib/types";

export default function Producto() {
  const { id } = useParams();
  const nav = useNavigate();
  const { add } = useCart();
  const { vehiculo } = useVehiculo();
  const [cant, setCant] = useState(1);
  const { data: p, error, loading } = useFetch(() => api<ProductoDetalle>(`/productos/${id}`), [id]);

  if (loading) return <Cargando />;
  if (error || !p) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorBox mensaje={error ?? "Producto no encontrado"} /></div>;

  const { titulo } = partirNombre(p.nombre);
  const encaja = vehiculo?.modeloId
    ? p.compatibilidades.some((c) => c.modelo_id === vehiculo.modeloId && (!vehiculo.anio || (vehiculo.anio >= c.anio_desde && vehiculo.anio <= c.anio_hasta)))
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <button onClick={() => nav(-1)} className="mb-6 inline-flex items-center gap-1 text-sm text-ink-300 hover:text-signal"><ChevronLeft className="size-4" />Volver</button>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="animate-rise">
          <ProductoVisual slug={p.categoria_slug} sku={p.sku} size="lg" />
        </div>
        <div className="animate-rise" style={{ animationDelay: "80ms" }}>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="chip border-signal/30 bg-signal/10 text-signal-soft">{p.fabricante}{p.fabricante_pais ? ` · ${p.fabricante_pais}` : ""}</span>
            <Link to={`/catalogo?categoria=${p.categoria_slug}`} className="chip border-ink-600 text-ink-300 hover:text-ink-100">{p.categoria}</Link>
            <span className="mono text-ink-400">SKU {p.sku}</span>
          </div>
          <h1 className="mt-4 font-display text-3xl leading-tight font-extrabold sm:text-4xl">{titulo}</h1>
          <p className="mt-4 leading-relaxed text-ink-300">{p.descripcion}</p>

          {encaja !== null && (
            <div className={`mt-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${encaja ? "border-ok/30 bg-ok/10 text-ok" : "border-warn/30 bg-warn/10 text-warn"}`}>
              <CarFront className="size-5" />
              {encaja ? `Compatible con tu ${etiquetaVehiculo(vehiculo)}` : `No figura como compatible con tu ${etiquetaVehiculo(vehiculo)}`}
            </div>
          )}

          <div className="card mt-6 p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-ink-400">Precio IVA incluido</p>
                <p className="mono text-4xl font-semibold">{money(p.precio_venta)}</p>
              </div>
              <StockBadge stock={p.stock} />
            </div>
            <div className="mt-5 flex gap-3">
              <div className="flex items-center rounded-xl border border-ink-600 bg-ink-800">
                <button className="p-3 hover:text-signal" onClick={() => setCant((c) => Math.max(1, c - 1))} aria-label="Restar"><Minus className="size-4" /></button>
                <span className="mono w-8 text-center">{cant}</span>
                <button className="p-3 hover:text-signal" onClick={() => setCant((c) => Math.min(p.stock, c + 1))} aria-label="Sumar"><Plus className="size-4" /></button>
              </div>
              <button className="btn-primary flex-1 py-3" disabled={p.stock <= 0} onClick={() => add(p, cant)}>
                <ShoppingCart className="size-4" />{p.stock > 0 ? "Agregar al carrito" : "Sin existencias"}
              </button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-ink-700 pt-4 text-xs text-ink-300">
              <span className="flex items-center gap-2"><BadgeCheck className="size-4 text-signal" />Garantía de fábrica</span>
              <span className="flex items-center gap-2"><Truck className="size-4 text-signal" />Envío nacional</span>
              <span className="flex items-center gap-2"><MapPin className="size-4 text-signal" />Bodega {p.ubicacion}</span>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg font-bold">Compatibilidad verificada</h2>
            <div className="card overflow-hidden">
              <table className="table-base">
                <thead><tr><th>Marca</th><th>Modelo</th><th>Años</th><th>Motor</th></tr></thead>
                <tbody>
                  {p.compatibilidades.map((c) => (
                    <tr key={c.id} className={vehiculo?.modeloId === c.modelo_id ? "bg-signal/5" : ""}>
                      <td>{c.marca}</td><td className="font-medium">{c.modelo}</td>
                      <td className="mono">{c.anio_desde}–{c.anio_hasta}</td><td className="mono text-ink-300">{c.motor ?? "—"}</td>
                    </tr>
                  ))}
                  {!p.compatibilidades.length && <tr><td colSpan={4} className="text-ink-300">Producto universal: aplica a múltiples vehículos según especificación.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {!!p.relacionados?.length && (
        <section className="mt-16">
          <h2 className="mb-5 font-display text-2xl font-bold">También en {p.categoria}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {p.relacionados.map((r, i) => <ProductCard key={r.id} p={r} i={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
