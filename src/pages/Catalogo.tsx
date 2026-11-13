import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CarFront, SearchX, SlidersHorizontal, X } from "lucide-react";
import VehicleSelector from "../components/VehicleSelector";
import ProductCard from "../components/ProductCard";
import { CategoriaIcono, Cargando, ErrorBox, Paginacion, Vacio } from "../components/ui";
import { etiquetaVehiculo, useVehiculo, type Vehiculo } from "../context/VehicleContext";
import { api, qs } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { number } from "../lib/format";
import type { Fabricante, Marca, Modelo, Pagina, ProductoResumen } from "../lib/types";

const CLAVES = ["q", "categoria", "fabricante", "marca", "modelo", "anio", "min", "max", "enStock", "orden", "page"] as const;

export default function Catalogo() {
  const [params, setParams] = useSearchParams();
  const { setVehiculo } = useVehiculo();
  const [filtrosMovil, setFiltrosMovil] = useState(false);
  const f = useMemo(() => Object.fromEntries(CLAVES.map((k) => [k, params.get(k) ?? ""])) as Record<(typeof CLAVES)[number], string>, [params]);

  const set = (cambios: Partial<Record<(typeof CLAVES)[number], string | number | undefined>>, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(cambios)) {
      if (v === undefined || v === "" || v === null) next.delete(k); else next.set(k, String(v));
    }
    if (resetPage) next.delete("page");
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const datos = useFetch(() => api<Pagina<ProductoResumen>>(`/productos${qs({ ...f, limit: 24 })}`), [params.toString()]);
  const fabricantes = useFetch(() => api<Fabricante[]>("/fabricantes"), []);

  // Reconstruye el vehículo (con nombres) a partir de la URL
  const [vehUrl, setVehUrl] = useState<Vehiculo | null>(null);
  useEffect(() => {
    if (!f.marca) { setVehUrl(null); return; }
    Promise.all([api<Marca[]>("/vehiculos/marcas"), api<Modelo[]>(`/vehiculos/marcas/${f.marca}/modelos`)]).then(([ms, mods]) => {
      const m = ms.find((x) => String(x.id) === f.marca);
      const mo = mods.find((x) => String(x.id) === f.modelo);
      if (m) setVehUrl({ marcaId: m.id, marca: m.nombre, modeloId: mo?.id, modelo: mo?.nombre, anio: f.anio ? Number(f.anio) : undefined });
    }).catch(() => setVehUrl(null));
  }, [f.marca, f.modelo, f.anio]);

  const aplicarVehiculo = (v: Vehiculo | null) => {
    setVehiculo(v);
    set({ marca: v?.marcaId, modelo: v?.modeloId, anio: v?.anio });
    setFiltrosMovil(false);
  };

  const filtrosActivos = [
    f.q && { k: "q", t: `“${f.q}”` },
    vehUrl && { k: "veh", t: etiquetaVehiculo(vehUrl) },
    f.categoria && { k: "categoria", t: datos.data?.facetas?.categorias.find((c) => c.slug === f.categoria)?.nombre ?? f.categoria },
    f.fabricante && { k: "fabricante", t: fabricantes.data?.find((x) => String(x.id) === f.fabricante)?.nombre ?? "Fabricante" },
    (f.min || f.max) && { k: "precio", t: `Precio ${f.min || 0} – ${f.max || "∞"}` },
    f.enStock && { k: "enStock", t: "Solo con stock" },
  ].filter(Boolean) as { k: string; t: string }[];

  const quitar = (k: string) => {
    if (k === "veh") return set({ marca: undefined, modelo: undefined, anio: undefined });
    if (k === "precio") return set({ min: undefined, max: undefined });
    set({ [k]: undefined } as never);
  };

  const sidebar = (
    <div className="space-y-6">
      <div className="card p-4">
        <p className="mb-3 flex items-center gap-2 font-display font-bold"><CarFront className="size-4 text-signal" />Mi vehículo</p>
        <VehicleSelector valor={vehUrl} onBuscar={aplicarVehiculo} />
      </div>
      <div>
        <p className="label">Categoría</p>
        <div className="space-y-1">
          <button onClick={() => set({ categoria: undefined })} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${!f.categoria ? "bg-ink-700 text-ink-100" : "text-ink-300 hover:bg-ink-800"}`}>
            Todas <span className="mono text-xs text-ink-400">{number(datos.data?.facetas?.categorias.reduce((s, c) => s + Number(c.total), 0) ?? 0)}</span>
          </button>
          {datos.data?.facetas?.categorias.map((c) => (
            <button key={c.slug} onClick={() => set({ categoria: c.slug })} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${f.categoria === c.slug ? "bg-signal/15 text-signal-soft" : "text-ink-300 hover:bg-ink-800"}`}>
              <span className="flex items-center gap-2.5"><CategoriaIcono slug={c.slug} className="size-4" />{c.nombre}</span>
              <span className="mono text-xs text-ink-400">{number(c.total)}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Fabricante</label>
        <select className="input" value={f.fabricante} onChange={(e) => set({ fabricante: e.target.value })}>
          <option value="">Todos</option>
          {fabricantes.data?.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
        </select>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); set({ min: String(d.get("min") ?? ""), max: String(d.get("max") ?? "") }); }}
        key={`${f.min}-${f.max}`}
      >
        <label className="label">Precio (COP)</label>
        <div className="flex gap-2">
          <input name="min" type="number" min={0} step={1000} defaultValue={f.min} className="input mono" placeholder="Mín" />
          <input name="max" type="number" min={0} step={1000} defaultValue={f.max} className="input mono" placeholder="Máx" />
        </div>
        <button className="btn-ghost mt-2 w-full py-2">Aplicar precio</button>
      </form>
      <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-200">
        <input type="checkbox" className="size-4 accent-[#ff6a1a]" checked={!!f.enStock} onChange={(e) => set({ enStock: e.target.checked ? "1" : undefined })} />
        Solo productos con stock
      </label>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-signal uppercase">Catálogo</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
            {vehUrl ? `Repuestos para ${etiquetaVehiculo(vehUrl)}` : "Todos los repuestos"}
          </h1>
          <p className="mt-2 text-sm text-ink-300">{datos.data ? `${number(datos.data.total)} resultados` : "Buscando…"}</p>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={(e) => { e.preventDefault(); set({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() }); }} key={f.q}>
            <input name="q" defaultValue={f.q} className="input w-56" placeholder="Buscar en resultados…" />
          </form>
          <select className="input w-auto" value={f.orden} onChange={(e) => set({ orden: e.target.value })}>
            <option value="">Nombre A–Z</option>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
            <option value="recientes">Más recientes</option>
          </select>
          <button className="btn-ghost lg:hidden" onClick={() => setFiltrosMovil(true)}><SlidersHorizontal className="size-4" /></button>
        </div>
      </div>

      {filtrosActivos.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {filtrosActivos.map((x) => (
            <button key={x.k} onClick={() => quitar(x.k)} className="chip border-ink-600 bg-ink-800 py-1 text-ink-200 hover:border-signal/50">
              {x.t}<X className="size-3" />
            </button>
          ))}
          <button onClick={() => setParams(new URLSearchParams())} className="text-xs text-ink-400 underline-offset-2 hover:text-signal hover:underline">Limpiar todo</button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">{sidebar}</aside>
        <section>
          {datos.error && <ErrorBox mensaje={datos.error} />}
          {datos.loading && !datos.data && <Cargando texto="Buscando repuestos…" />}
          {datos.data && datos.data.items.length === 0 && (
            <Vacio titulo="Sin coincidencias" icono={<SearchX className="size-6" />}>
              No encontramos repuestos con esos filtros. Prueba otro año o quita algún filtro.
            </Vacio>
          )}
          <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 ${datos.loading ? "opacity-60" : ""}`}>
            {datos.data?.items.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
          </div>
          {datos.data && <Paginacion page={datos.data.page} pages={datos.data.pages} onChange={(p) => set({ page: p }, false)} />}
        </section>
      </div>

      {filtrosMovil && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-900 p-5 lg:hidden">
          <div className="mb-5 flex items-center justify-between">
            <p className="font-display text-xl font-bold">Filtros</p>
            <button onClick={() => setFiltrosMovil(false)} className="rounded-lg p-2 hover:bg-ink-700"><X className="size-5" /></button>
          </div>
          {sidebar}
          <button className="btn-primary mt-6 w-full" onClick={() => setFiltrosMovil(false)}>Ver {number(datos.data?.total ?? 0)} resultados</button>
        </div>
      )}
    </div>
  );
}
