import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftRight, ChevronLeft, ExternalLink, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Encabezado } from "./AdminLayout";
import { CompatibilidadModal, MovimientoModal, ProductoFormModal } from "./forms";
import { Cargando, ErrorBox, ProductoVisual, StockBadge } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { fecha, money, partirNombre } from "../lib/format";
import type { ProductoDetalle } from "../lib/types";

const TIPO_COLOR = { entrada: "text-ok", venta: "text-signal", salida: "text-danger", ajuste: "text-info" } as const;

export default function ProductoAdmin() {
  const { id } = useParams();
  const nav = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "admin";
  const { data: p, error, loading, reload } = useFetch(() => api<ProductoDetalle>(`/admin/productos/${id}`, { auth: true }), [id]);
  const [editar, setEditar] = useState(false);
  const [mov, setMov] = useState(false);
  const [compat, setCompat] = useState(false);

  if (loading && !p) return <Cargando />;
  if (error || !p) return <ErrorBox mensaje={error ?? "No encontrado"} />;
  const { titulo, vehiculo } = partirNombre(p.nombre);

  const quitarCompat = async (cid: number) => { await api(`/admin/compatibilidades/${cid}`, { method: "DELETE", auth: true }); reload(); };
  const toggleActivo = async () => {
    if (p.activo) {
      if (!confirm("¿Desactivar este producto? Dejará de aparecer en la tienda.")) return;
      await api(`/admin/productos/${p.id}`, { method: "DELETE", auth: true });
    } else {
      await api(`/admin/productos/${p.id}`, { method: "PUT", auth: true, body: { activo: true } });
    }
    reload();
  };

  return (
    <>
      <button onClick={() => nav(-1)} className="mb-4 inline-flex items-center gap-1 text-sm text-ink-300 hover:text-signal"><ChevronLeft className="size-4" />Volver</button>
      <Encabezado titulo={titulo} sub={`${p.sku}${vehiculo ? ` · ${vehiculo}` : ""}`}>
        <Link to={`/producto/${p.id}`} target="_blank" className="btn-ghost"><ExternalLink className="size-4" />Ver en tienda</Link>
        <button className="btn-ghost" onClick={() => setMov(true)}><ArrowLeftRight className="size-4" />Movimiento</button>
        {esAdmin && <button className="btn-ghost" onClick={toggleActivo}><Power className="size-4" />{p.activo ? "Desactivar" : "Activar"}</button>}
        {esAdmin && <button className="btn-primary" onClick={() => setEditar(true)}><Pencil className="size-4" />Editar</button>}
      </Encabezado>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <ProductoVisual slug={p.categoria_slug} sku={p.sku} size="lg" />
          <div className="card divide-y divide-ink-800 text-sm">
            {[
              ["Estado", p.activo ? <span className="chip border-ok/30 bg-ok/10 text-ok">Activo</span> : <span className="chip border-ink-500 text-ink-300">Inactivo</span>],
              ["Stock", <StockBadge stock={p.stock} minimo={p.stock_minimo} />],
              ["Stock mínimo", <span className="mono">{p.stock_minimo}</span>],
              ["Precio venta", <span className="mono">{money(p.precio_venta)}</span>],
              ["Precio costo", <span className="mono">{money(p.precio_costo ?? 0)}</span>],
              ["Categoría", p.categoria],
              ["Fabricante", p.fabricante],
              ["Proveedor", p.proveedor ?? "—"],
              ["Ubicación", <span className="mono">{p.ubicacion ?? "—"}</span>],
            ].map(([k, v]) => (
              <div key={k as string} className="flex items-center justify-between gap-4 px-4 py-3"><span className="text-ink-400">{k}</span><span className="text-right">{v}</span></div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-3">
              <p className="font-display font-bold">Compatibilidad vehicular</p>
              {esAdmin && <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setCompat(true)}><Plus className="size-3.5" />Agregar</button>}
            </div>
            <table className="table-base">
              <thead><tr><th>Vehículo</th><th>Años</th><th>Motor</th><th /></tr></thead>
              <tbody>
                {p.compatibilidades.map((c) => (
                  <tr key={c.id}>
                    <td>{c.marca} <span className="font-medium">{c.modelo}</span></td>
                    <td className="mono">{c.anio_desde}–{c.anio_hasta}</td>
                    <td className="mono text-ink-300">{c.motor ?? "—"}</td>
                    <td className="text-right">{esAdmin && <button onClick={() => quitarCompat(c.id)} className="rounded-lg p-1.5 text-ink-400 hover:text-danger"><Trash2 className="size-4" /></button>}</td>
                  </tr>
                ))}
                {!p.compatibilidades.length && <tr><td colSpan={4} className="text-ink-400">Producto universal (sin compatibilidad específica).</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="card overflow-hidden">
            <p className="p-5 pb-3 font-display font-bold">Kardex — últimos movimientos</p>
            <table className="table-base">
              <thead><tr><th>Fecha</th><th>Tipo</th><th className="text-right">Cant.</th><th className="text-right">Saldo</th><th>Detalle</th></tr></thead>
              <tbody>
                {p.movimientos?.map((m) => (
                  <tr key={m.id}>
                    <td className="text-xs text-ink-300">{fecha(m.creado_en)}</td>
                    <td className={`font-medium capitalize ${TIPO_COLOR[m.tipo]}`}>{m.tipo}</td>
                    <td className="mono text-right">{m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}</td>
                    <td className="mono text-right">{m.stock_resultante}</td>
                    <td className="text-xs text-ink-300">{m.motivo}{m.usuario ? ` · ${m.usuario}` : ""}</td>
                  </tr>
                ))}
                {!p.movimientos?.length && <tr><td colSpan={5} className="text-ink-400">Sin movimientos registrados.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ProductoFormModal abierto={editar} producto={p} onClose={() => setEditar(false)} onGuardado={() => reload()} />
      <MovimientoModal producto={mov ? p : null} onClose={() => setMov(false)} onHecho={reload} />
      <CompatibilidadModal productoId={p.id} abierto={compat} onClose={() => setCompat(false)} onHecho={reload} />
    </>
  );
}
