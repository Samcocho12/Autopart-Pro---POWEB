import { useState } from "react";
import { Search } from "lucide-react";
import { Encabezado } from "./AdminLayout";
import { Cargando, ErrorBox, EstadoBadge, Modal, Paginacion } from "../components/ui";
import { api, qs } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { fecha, money } from "../lib/format";
import type { EstadoPedido, Pagina, PedidoDetalle, PedidoFila } from "../lib/types";

const ESTADOS: ("" | EstadoPedido)[] = ["", "pagado", "pendiente", "rechazado", "anulado", "error"];

export default function Pedidos() {
  const [estado, setEstado] = useState<"" | EstadoPedido>("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [detalle, setDetalle] = useState<PedidoDetalle | null>(null);
  const { data, error, loading } = useFetch(() => api<Pagina<PedidoFila>>(`/admin/pedidos${qs({ estado, q, page, limit: 20 })}`, { auth: true }), [estado, q, page]);

  const abrir = async (id: number) => setDetalle(await api<PedidoDetalle>(`/admin/pedidos/${id}`, { auth: true }));

  return (
    <>
      <Encabezado titulo="Pedidos" sub={data ? `${data.total} pedidos` : undefined}>
        <form className="relative" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(String(new FormData(e.currentTarget).get("q") ?? "")); }}>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" />
          <input name="q" className="input w-64 pl-10" placeholder="Referencia, cliente o correo" />
        </form>
      </Encabezado>
      <div className="mb-4 flex flex-wrap gap-2">
        {ESTADOS.map((e) => (
          <button key={e || "todos"} onClick={() => { setEstado(e); setPage(1); }} className={`rounded-full border px-3.5 py-1.5 text-sm capitalize transition ${estado === e ? "border-signal bg-signal/15 text-signal-soft" : "border-ink-600 text-ink-300 hover:border-ink-500"}`}>{e || "Todos"}</button>
        ))}
      </div>
      {error && <ErrorBox mensaje={error} />}
      {loading && !data ? <Cargando /> : (
        <div className="card overflow-x-auto">
          <table className="table-base min-w-[820px]">
            <thead><tr><th>Referencia</th><th>Fecha</th><th>Cliente</th><th className="text-right">Unid.</th><th>Método</th><th>Estado</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {data?.items.map((p) => (
                <tr key={p.id} className="cursor-pointer" onClick={() => abrir(p.id)}>
                  <td className="mono text-xs">{p.referencia}</td>
                  <td className="text-xs text-ink-300">{fecha(p.creado_en)}</td>
                  <td>{p.cliente}<p className="text-xs text-ink-400">{p.ciudad}</p></td>
                  <td className="mono text-right">{p.unidades}</td>
                  <td className="mono text-xs text-ink-300">{p.metodo_pago ?? "—"}</td>
                  <td><EstadoBadge estado={p.estado} /></td>
                  <td className="mono text-right font-medium">{money(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Paginacion page={data.page} pages={data.pages} onChange={setPage} />}

      <Modal abierto={!!detalle} onClose={() => setDetalle(null)} titulo={`Pedido ${detalle?.referencia ?? ""}`} ancho="max-w-2xl">
        {detalle && (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center gap-3"><EstadoBadge estado={detalle.estado} /><span className="text-ink-400">Creado {fecha(detalle.creado_en)}</span>{detalle.pagado_en && <span className="text-ink-400">· Pagado {fecha(detalle.pagado_en)}</span>}</div>
            <div className="grid gap-3 rounded-xl border border-ink-700 bg-ink-800/50 p-4 sm:grid-cols-2">
              <div><p className="label">Cliente</p><p>{detalle.cliente}</p><p className="text-ink-400">CC {detalle.documento}</p></div>
              <div><p className="label">Contacto</p><p>{detalle.email}</p><p className="text-ink-400">{detalle.telefono}</p></div>
              <div className="sm:col-span-2"><p className="label">Envío</p><p>{detalle.direccion}, {detalle.ciudad}</p></div>
              {detalle.wompi_transaction_id && <div className="sm:col-span-2"><p className="label">Transacción Wompi</p><p className="mono">{detalle.wompi_transaction_id} · {detalle.metodo_pago}</p></div>}
            </div>
            <table className="table-base">
              <thead><tr><th>Producto</th><th className="text-right">Cant.</th><th className="text-right">Precio</th><th className="text-right">Subtotal</th></tr></thead>
              <tbody>
                {detalle.items.map((i) => (
                  <tr key={i.producto_id}><td>{i.nombre.split(" — ")[0]}<p className="mono text-xs text-ink-400">{i.sku}</p></td><td className="mono text-right">{i.cantidad}</td><td className="mono text-right">{money(i.precio_unitario)}</td><td className="mono text-right">{money(i.subtotal)}</td></tr>
                ))}
              </tbody>
            </table>
            <dl className="ml-auto max-w-xs space-y-1">
              <div className="flex justify-between text-ink-300"><dt>Subtotal</dt><dd className="mono">{money(detalle.subtotal)}</dd></div>
              <div className="flex justify-between text-ink-300"><dt>IVA 19%</dt><dd className="mono">{money(detalle.iva)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="mono">{money(detalle.total)}</dd></div>
            </dl>
          </div>
        )}
      </Modal>
    </>
  );
}
