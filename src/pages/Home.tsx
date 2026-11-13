import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BellRing, CarFront, CreditCard, Plus, ShieldCheck, Truck } from "lucide-react";
import VehicleSelector from "../components/VehicleSelector";
import ProductCard from "../components/ProductCard";
import { CATEGORIA_UI, CategoriaIcono } from "../components/ui";
import { useVehiculo, vehiculoParams } from "../context/VehicleContext";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { number } from "../lib/format";
import type { Categoria, Pagina, ProductoResumen } from "../lib/types";

function Titulo({ kicker, children, accion }: { kicker: string; children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="kicker"><span className="size-2 rounded-full bg-signal" />{kicker}</p>
        <h2 className="mt-3 font-display text-4xl leading-none font-black uppercase sm:text-5xl">{children}</h2>
      </div>
      {accion}
    </div>
  );
}

export default function Home() {
  const { vehiculo, setVehiculo } = useVehiculo();
  const nav = useNavigate();
  const cats = useFetch(() => api<Categoria[]>("/categorias"), []);
  const destacados = useFetch(() => api<Pagina<ProductoResumen>>("/productos?enStock=1&orden=precio_desc&limit=8"), []);
  const totalRefs = cats.data?.reduce((s, c) => s + Number(c.productos), 0) ?? 0;

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="relative">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 pb-28 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div className="animate-rise">
            <p className="kicker"><span className="size-2 rounded-full bg-signal" />Autopartes. Compatibilidad. Confianza.</p>
            <h1 className="mt-6 font-display text-[clamp(2.9rem,5.6vw,5.4rem)] leading-[0.9] font-black tracking-[-0.035em] uppercase">
              <span className="whitespace-nowrap">El repuesto</span><br /><span className="whitespace-nowrap">exacto para</span><br /><span className="whitespace-nowrap text-signal">tu carro.</span>
            </h1>
            <p className="mt-8 max-w-md text-xl leading-relaxed text-ink-300">
              Buscas por marca, modelo y año, y te mostramos solo lo que le sirve a tu vehículo. Con stock real y pago seguro en línea.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/catalogo" className="group inline-flex items-center gap-10 rounded-md bg-signal px-7 py-4 font-display text-[15px] font-extrabold text-white shadow-[0_14px_34px_-14px_rgb(229_50_43/0.8)] transition hover:bg-signal-deep">
                Explora los repuestos <Plus className="size-5 transition group-hover:rotate-90" strokeWidth={3} />
              </Link>
              <a href="#mi-vehiculo" className="inline-flex items-center gap-2 rounded-md border-2 border-ink-100 px-6 py-[14px] font-display text-[15px] font-extrabold transition hover:bg-ink-100 hover:text-white">
                <CarFront className="size-5" />Buscar por vehículo
              </a>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-ink-700 pt-6">
              {[[number(totalRefs || 1145), "Referencias"], ["29", "Modelos"], ["9", "Sistemas"]].map(([v, t]) => (
                <div key={t}>
                  <dt className="font-display text-3xl font-black">{v}</dt>
                  <dd className="mt-1 font-display text-[10px] font-bold tracking-[0.22em] text-ink-400 uppercase">{t}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Tarjeta con la foto */}
          <div className="animate-rise relative" style={{ animationDelay: "120ms" }}>
            <div className="pointer-events-none absolute -top-10 -right-6 -z-0 hidden size-[30rem] rounded-full border border-signal/40 lg:block" />
            <div className="relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-950 p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between px-3 pt-2 pb-4 font-display text-[10px] font-bold tracking-[0.25em] uppercase">
                <span className="text-ink-400">AutoPart Pro</span>
                <span>01 — Hecho para rodar</span>
              </div>
              <div className="relative overflow-hidden rounded-xl">
                <img src="/img/hero-auto.jpg" alt="Deportivo negro tomando una curva en carretera de montaña" className="aspect-[6/5] w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute right-5 bottom-5 left-5 flex items-end justify-between text-white">
                  <div>
                    <p className="font-display text-[10px] font-bold tracking-[0.25em] text-white/70 uppercase">Cada kilómetro cuenta</p>
                    <p className="mt-1 font-display text-2xl leading-none font-black uppercase">Repuestos<br />con garantía</p>
                  </div>
                  <span className="rounded-md bg-signal px-3 py-2 font-display text-xs font-extrabold">+{number(totalRefs || 1145)} refs</span>
                </div>
              </div>
            </div>
            <span className="absolute top-1/2 -right-3 hidden origin-center translate-x-1/2 -translate-y-1/2 rotate-90 font-display text-[10px] font-bold tracking-[0.4em] whitespace-nowrap text-ink-400 uppercase xl:block">
              AutoPart Pro / Colombia
            </span>
          </div>
        </div>

        {/* Buscador flotante por vehículo */}
        <div id="mi-vehiculo" className="relative z-10 mx-auto -mt-16 max-w-7xl scroll-mt-28 px-4 sm:px-6">
          <div className="rounded-2xl border border-ink-700 bg-ink-950 p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.3)] sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="relative flex size-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok/60" /><span className="relative inline-flex size-2.5 rounded-full bg-ok" /></span>
              <p className="font-display text-lg font-extrabold">¿Qué carro tienes?</p>
              <p className="text-ink-400">Elige marca, modelo y año y te mostramos solo los repuestos compatibles.</p>
            </div>
            <VehicleSelector variante="hero" valor={vehiculo} onBuscar={(v) => { setVehiculo(v); nav(`/catalogo?${vehiculoParams(v)}`); }} />
          </div>
        </div>
      </section>

      {/* ---------- BENEFICIOS ---------- */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-ink-700 bg-ink-700 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [ShieldCheck, "Compatibilidad verificada", "Por modelo, rango de años y motor."],
            [BellRing, "Stock en tiempo real", "Lo que ves disponible, está en bodega."],
            [Truck, "Envíos nacionales", "Despachamos a toda Colombia."],
            [CreditCard, "Pago seguro", "Tarjeta, Nequi o PSE con Wompi."],
          ].map(([Icon, t, d], i) => {
            const I = Icon as typeof ShieldCheck;
            return (
              <div key={i} className="flex gap-4 bg-ink-950 p-6">
                <I className="size-6 shrink-0 text-signal" />
                <div><p className="font-display font-extrabold">{t as string}</p><p className="mt-1 text-ink-400">{d as string}</p></div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- CATEGORÍAS ---------- */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Titulo kicker="02 — Categorías" accion={<Link to="/catalogo" className="flex items-center gap-2 font-display text-sm font-bold hover:text-signal">Ver todo el catálogo <ArrowRight className="size-4" /></Link>}>
          Explora por<br />sistema
        </Titulo>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {cats.data?.map((c, i) => (
            <Link
              key={c.id}
              to={`/catalogo?categoria=${c.slug}`}
              className={`group animate-rise relative flex flex-col justify-between overflow-hidden rounded-xl border p-5 transition hover:-translate-y-0.5 ${i === 0 ? "border-carbon bg-carbon text-white hover:border-signal lg:col-span-2" : "border-ink-700 bg-ink-950 hover:border-ink-100"}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between">
                <span className={`grid size-11 place-items-center rounded-lg ${i === 0 ? "bg-signal text-white" : `bg-ink-900 ${CATEGORIA_UI[c.slug]?.color ?? ""}`}`}>
                  <CategoriaIcono slug={c.slug} className="size-5" />
                </span>
                <span className={`font-display text-[11px] font-bold ${i === 0 ? "text-white/50" : "text-ink-400"}`}>{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="mt-10">
                <p className="font-display text-lg leading-tight font-black uppercase">{c.nombre}</p>
                <p className={`mt-1 text-sm ${i === 0 ? "text-white/60" : "text-ink-400"}`}>{c.descripcion}</p>
                <p className="mt-3 flex items-center gap-1.5 font-display text-xs font-bold text-signal">{number(c.productos)} referencias <ArrowRight className="size-3.5 transition group-hover:translate-x-1" /></p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- DESTACADOS ---------- */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Titulo kicker="03 — Destacados">Repuestos<br />destacados</Titulo>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {destacados.data?.items.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
        </div>
      </section>

      {/* ---------- BANDA FINAL ---------- */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-signal px-8 py-14 text-white sm:px-14">
          <div className="pointer-events-none absolute -right-10 -bottom-16 font-display text-[11rem] leading-none font-black text-white/10 uppercase select-none">AUTO</div>
          <p className="kicker text-white/80"><span className="size-2 rounded-full bg-white" />¿No sabes qué referencia lleva tu carro?</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[0.95] font-black uppercase sm:text-5xl">Tu carro no<br />se detiene.</h2>
          <Link to="/catalogo" className="mt-8 inline-flex items-center gap-3 rounded-md bg-carbon px-7 py-4 font-display font-extrabold transition hover:bg-black">
            Ir al catálogo <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
