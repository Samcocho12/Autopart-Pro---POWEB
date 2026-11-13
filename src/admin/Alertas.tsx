import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, PackagePlus, PartyPopper } from "lucide-react";
import { Encabezado } from "./AdminLayout";
import { MovimientoModal } from "./forms";
import { Cargando, ErrorBox, Vacio } from "../components/ui";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { fecha, partirNombre } from "../lib/format";
import type { Alerta } from "../lib/types";

export default function Alertas() {
  const [estado, setEstado] = useState<"activa" | "atendida">("activa");
  const [nivel, setNivel] = useState("");
  const [reponer, setReponer] = useState<Alerta | null>(null);
  const { data, error, loading, reload } = useFetch(() => api<Alerta[]>(`/admin/alertas?estado=${estado}${nivel ? `&nivel=${nivel}` : ""}`, { auth: true }), [estado, nivel]);

  const agotados = data?.filter((a) => a.nivel === "agotado").length ?? 0;
  const atender = async (id: number) => { await api(`/admin/alertas/${id}/atender`, { method: "PATCH", auth: true }); reload(); };

  return (
    <>
      <Encabezado titulo="Alertas de stock mínimo" sub="Se generan automáticamente cuando el stock llega al mínimo configurado y se cierran solas al reponer.">
        <div className="flex rounded-xl border border-ink-600 p-1">
          {(["activa", "atendida"] as const).map((e) => (
            <button key={e} onClick={() => setEstado(e)} className={`rounded-lg px-3 py-1.5 text-sm capitalize transition ${estado === e ? "bg-ink-700 text-ink-100" : "text-ink-400"}`}>{e}s</button>
          ))}
        </div>
        <select className="input w-auto" value={nivel} onChange={(e) => setNivel(e.target.value)}>
          <option value="">Todos los niveles</option><option value="agotado">Agotados</option><option value="bajo">Stock bajo</option>
        </select>
      </Encabezado>

      {estado === "activa" && data && data.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="card border-danger/30 bg-danger/5 p-5"><p className="text-xs tracking-wider text-danger uppercase">Agotados</p><p className="mono mt-2 text-3xl font-semibold">{agotados}</p></div>
          <div className="card border-warn/30 bg-warn/5 p-5"><p className="text-xs tracking-wider text-warn uppercase">Stock bajo</p><p className="mono mt-2 text-3xl font-semibold">{data.length - agotados}</p></div>
          <div className="card p-5"><p className="text-xs tracking-wider text-ink-400 uppercase">Unidades sugeridas a pedir</p><p className="mono mt-2 text-3xl font-semibold">{data.reduce((s, a) => s + Number(a.sugerido_reponer), 0)}</p></div>
        </div>
      )}

      {error && <ErrorBox mensaje={error} />}
      {loading && !data ? <Cargando /> : data?.length === 0 ? (
        <Vacio titulo="Todo en orden" icono={<PartyPopper className="size-6" />}>No hay alertas {estado === "activa" ? "activas" : "atendidas"}.</Vacio>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base min-w-[860px]">
            <thead><tr><th>Nivel</th><th>Producto</th><th>Categoría</th><th className="text-right">Stock / Mín.</th><th>Proveedor</th><th>{estado === "activa" ? "Desde" : "Atendida"}</th><th /></tr></thead>
            <tbody>
              {data?.map((a) => (
                <tr key={a.id}>
                  <td>{a.nivel === "agotado" ? <span className="chip border-danger/30 bg-danger/10 text-danger">Agotado</span> : <span className="chip border-warn/30 bg-warn/10 text-warn">Bajo</span>}</td>
                  <td><Link to={`/admin/inventario/${a.producto_id}`} className="font-medium hover:text-signal">{partirNombre(a.nombre).titulo}</Link><p className="mono text-xs text-ink-400">{a.sku} · {a.ubicacion}</p></td>
                  <td className="text-ink-300">{a.categoria}</td>
                  <td className="mono text-right"><span className={a.stock === 0 ? "text-danger" : "text-warn"}>{a.stock}</span> <span className="text-ink-400">/ {a.stock_minimo}</span></td>
                  <td className="text-xs text-ink-300">{a.proveedor ?? "—"}</td>
                  <td className="text-xs text-ink-300">{fecha(estado === "activa" ? a.creado_en : a.atendida_en)}</td>
                  <td>
                    {estado === "activa" && (
                      <div className="flex justify-end gap-1">
                        <button className="btn-primary px-3 py-1.5 text-xs whitespace-nowrap" onClick={() => setReponer(a)}><PackagePlus className="size-3.5" />Reponer {a.sugerido_reponer}</button>
                        <button className="rounded-lg p-2 text-ink-400 hover:bg-ink-700 hover:text-ok" title="Marcar atendida" onClick={() => atender(a.id)}><Check className="size-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MovimientoModal
        producto={reponer ? { id: reponer.producto_id, nombre: reponer.nombre, sku: reponer.sku, stock: reponer.stock } : null}
        tipoInicial="entrada"
        cantidadInicial={reponer?.sugerido_reponer}
        onClose={() => setReponer(null)}
        onHecho={reload}
      />
    </>
  );
}
