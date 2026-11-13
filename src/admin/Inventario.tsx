import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeftRight, Pencil, Plus, Search } from "lucide-react";
import { Encabezado } from "./AdminLayout";
import { MovimientoModal, ProductoFormModal } from "./forms";
import { Cargando, ErrorBox, Paginacion, StockBadge } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { api, qs } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { money, number, partirNombre } from "../lib/format";
import { imagenProducto } from "../lib/imagenes";
import type { Categoria, Pagina, ProductoDetalle, ProductoResumen } from "../lib/types";

export default function Inventario() {
  const { usuario } = useAuth();
  const [params, setParams] = useSearchParams();
  const [nuevo, setNuevo] = useState(false);
  const [editar, setEditar] = useState<ProductoDetalle | null>(null);
  const [mov, setMov] = useState<ProductoResumen | null>(null);
  const f = { q: params.get("q") ?? "", categoria: params.get("categoria") ?? "", stockBajo: params.get("stockBajo") ?? "", activo: params.get("activo") ?? "1", page: Number(params.get("page") ?? 1), orden: params.get("orden") ?? "" };
  const set = (k: string, v: string) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); if (k !== "page") n.delete("page"); setParams(n); };

  const datos = useFetch(() => api<Pagina<ProductoResumen>>(`/admin/productos${qs({ ...f, limit: 25 })}`, { auth: true }), [params.toString()]);
  const cats = useFetch(() => api<Categoria[]>("/categorias"), []);
  const esAdmin = usuario?.rol === "admin";

  const abrirEdicion = async (id: number) => setEditar(await api<ProductoDetalle>(`/admin/productos/${id}`, { auth: true }));

  return (
    <>
      <Encabezado titulo="Inventario" sub={datos.data ? `${number(datos.data.total)} referencias` : undefined}>
        {esAdmin && <button className="btn-primary" onClick={() => setNuevo(true)}><Plus className="size-4" />Nuevo producto</button>}
      </Encabezado>

      <div className="mb-4 flex flex-wrap gap-2">
        <form className="relative min-w-60 flex-1" onSubmit={(e) => { e.preventDefault(); set("q", String(new FormData(e.currentTarget).get("q") ?? "")); }} key={f.q}>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" />
          <input name="q" defaultValue={f.q} className="input pl-10" placeholder="SKU, nombre o fabricante…" />
        </form>
        <select className="input w-auto" value={f.categoria} onChange={(e) => set("categoria", e.target.value)}>
          <option value="">Todas las categorías</option>
          {cats.data?.map((c) => <option key={c.id} value={c.slug}>{c.nombre}</option>)}
        </select>
        <select className="input w-auto" value={f.stockBajo} onChange={(e) => set("stockBajo", e.target.value)}>
          <option value="">Todo el stock</option>
          <option value="1">Solo stock bajo / agotado</option>
        </select>
        <select className="input w-auto" value={f.activo} onChange={(e) => set("activo", e.target.value)}>
          <option value="1">Activos</option>
          <option value="0">Inactivos</option>
        </select>
        <select className="input w-auto" value={f.orden} onChange={(e) => set("orden", e.target.value)}>
          <option value="">Nombre</option>
          <option value="stock">Menor stock</option>
          <option value="precio_desc">Mayor precio</option>
          <option value="recientes">Recientes</option>
        </select>
      </div>

      {datos.error && <ErrorBox mensaje={datos.error} />}
      {datos.loading && !datos.data ? <Cargando /> : (
        <div className={`card overflow-x-auto ${datos.loading ? "opacity-60" : ""}`}>
          <table className="table-base min-w-[900px]">
            <thead><tr><th>Producto</th><th>Fabricante</th><th className="text-right">Costo</th><th className="text-right">Venta</th><th className="text-right">Margen</th><th>Stock</th><th>Ubic.</th><th /></tr></thead>
            <tbody>
              {datos.data?.items.map((p) => {
                const { titulo, vehiculo } = partirNombre(p.nombre);
                const margen = p.precio_costo ? ((p.precio_venta - p.precio_costo) / p.precio_venta) * 100 : 0;
                return (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/admin/inventario/${p.id}`} className="flex items-center gap-3 hover:text-signal">
                        <img src={imagenProducto(p.nombre, p.imagen_url)} alt="" className="size-10 shrink-0 rounded-lg bg-ink-700 object-contain p-1" />
                        <span className="min-w-0">
                          <span className="block font-medium">{titulo}</span>
                          <span className="mono block text-xs text-ink-400">{p.sku}{vehiculo ? ` · ${vehiculo}` : ""}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="text-ink-300">{p.fabricante}</td>
                    <td className="mono text-right text-ink-300">{money(p.precio_costo ?? 0)}</td>
                    <td className="mono text-right">{money(p.precio_venta)}</td>
                    <td className="mono text-right text-ink-300">{margen.toFixed(0)}%</td>
                    <td><StockBadge stock={p.stock} minimo={p.stock_minimo} /><p className="mono mt-1 text-[11px] text-ink-400">mín {p.stock_minimo}</p></td>
                    <td className="mono text-xs text-ink-300">{p.ubicacion}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setMov(p)} className="rounded-lg p-2 text-ink-300 hover:bg-ink-700 hover:text-signal" title="Movimiento"><ArrowLeftRight className="size-4" /></button>
                        {esAdmin && <button onClick={() => abrirEdicion(p.id)} className="rounded-lg p-2 text-ink-300 hover:bg-ink-700 hover:text-signal" title="Editar"><Pencil className="size-4" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {datos.data && <Paginacion page={datos.data.page} pages={datos.data.pages} onChange={(p) => set("page", String(p))} />}

      <ProductoFormModal abierto={nuevo || !!editar} producto={editar} onClose={() => { setNuevo(false); setEditar(null); }} onGuardado={() => datos.reload()} />
      <MovimientoModal producto={mov} onClose={() => setMov(null)} onHecho={() => datos.reload()} />
    </>
  );
}
