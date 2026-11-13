import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BellRing, CreditCard, Gauge, ShieldCheck } from "lucide-react";
import VehicleSelector from "../components/VehicleSelector";
import ProductCard from "../components/ProductCard";
import { CATEGORIA_UI, CategoriaIcono } from "../components/ui";
import { useVehiculo, vehiculoParams } from "../context/VehicleContext";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { number } from "../lib/format";
import type { Categoria, Pagina, ProductoResumen } from "../lib/types";

export default function Home() {
  const { vehiculo, setVehiculo } = useVehiculo();
  const nav = useNavigate();
  const cats = useFetch(() => api<Categoria[]>("/categorias"), []);
  const destacados = useFetch(() => api<Pagina<ProductoResumen>>("/productos?enStock=1&orden=precio_desc&limit=8&categoria=motor"), []);
  const totalRefs = cats.data?.reduce((s, c) => s + Number(c.productos), 0) ?? 0;

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-700/60">
        <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24">
          <div className="animate-rise max-w-3xl">
            <span className="chip border-signal/30 bg-signal/10 text-signal-soft">
              <span className="size-1.5 rounded-full bg-signal" /> {number(totalRefs || 1000)}+ referencias en bodega
            </span>
            <h1 className="mt-6 font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
              El repuesto exacto <br className="hidden sm:block" />
              para <span className="bg-gradient-to-r from-signal to-amber-300 bg-clip-text text-transparent">tu vehículo</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-300">
              Busca por marca, modelo y año. Compatibilidad verificada, stock en tiempo real y pago seguro en línea.
            </p>
          </div>
          <div className="card animate-rise mt-10 p-3 sm:p-4" style={{ animationDelay: "120ms" }}>
            <VehicleSelector
              variante="hero"
              valor={vehiculo}
              onBuscar={(v) => { setVehiculo(v); nav(`/catalogo?${vehiculoParams(v)}`); }}
            />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-ink-300 sm:grid-cols-4">
            {[
              [ShieldCheck, "Compatibilidad por año"],
              [Gauge, "Stock en tiempo real"],
              [BellRing, "Alertas de stock mínimo"],
              [CreditCard, "Pago seguro con Wompi"],
            ].map(([Icon, t], i) => {
              const I = Icon as typeof ShieldCheck;
              return <div key={i} className="flex items-center gap-2.5"><I className="size-4 text-signal" />{t as string}</div>;
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-signal uppercase">Categorías</p>
            <h2 className="mt-2 font-display text-3xl font-bold">Explora por sistema</h2>
          </div>
          <Link to="/catalogo" className="hidden items-center gap-1.5 text-sm text-ink-300 hover:text-signal sm:flex">Ver todo <ArrowRight className="size-4" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 [&>*:first-child]:lg:col-span-2">
          {cats.data?.map((c, i) => (
            <Link
              key={c.id}
              to={`/catalogo?categoria=${c.slug}`}
              className={`card group animate-rise relative overflow-hidden bg-gradient-to-br p-5 transition hover:border-ink-500 ${CATEGORIA_UI[c.slug]?.tono ?? ""}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <CategoriaIcono slug={c.slug} className="size-8 transition group-hover:scale-110" />
              <p className="mt-6 font-display text-lg font-bold text-ink-100">{c.nombre}</p>
              <p className="mt-1 text-xs text-ink-300">{c.descripcion}</p>
              <p className="mono mt-3 text-xs text-ink-400">{number(c.productos)} refs</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-signal uppercase">Destacados</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Motor y distribución</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {destacados.data?.items.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
        </div>
      </section>
    </>
  );
}
