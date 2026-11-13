import { Link } from "react-router-dom";
import { Encabezado } from "./AdminLayout";
import { Cargando, ErrorBox } from "../components/ui";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { fecha, partirNombre } from "../lib/format";
import type { Movimiento } from "../lib/types";

const COLOR = { entrada: "border-ok/30 bg-ok/10 text-ok", venta: "border-signal/30 bg-signal/10 text-signal-soft", salida: "border-danger/30 bg-danger/10 text-danger", ajuste: "border-info/30 bg-info/10 text-info" } as const;

export default function Movimientos() {
  const { data, error, loading } = useFetch(() => api<Movimiento[]>("/admin/inventario/movimientos?limit=150", { auth: true }), []);
  return (
    <>
      <Encabezado titulo="Kardex de inventario" sub="Trazabilidad de todas las entradas, salidas, ajustes y ventas" />
      {error && <ErrorBox mensaje={error} />}
      {loading ? <Cargando /> : (
        <div className="card overflow-x-auto">
          <table className="table-base min-w-[860px]">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th className="text-right">Cantidad</th><th className="text-right">Anterior → Nuevo</th><th>Motivo / Usuario</th></tr></thead>
            <tbody>
              {data?.map((m) => (
                <tr key={m.id}>
                  <td className="text-xs whitespace-nowrap text-ink-300">{fecha(m.creado_en)}</td>
                  <td><span className={`chip capitalize ${COLOR[m.tipo]}`}>{m.tipo}</span></td>
                  <td><Link to={`/admin/inventario/${m.producto_id}`} className="hover:text-signal">{partirNombre(m.producto).titulo}</Link><p className="mono text-xs text-ink-400">{m.sku}</p></td>
                  <td className={`mono text-right font-semibold ${m.cantidad > 0 ? "text-ok" : "text-danger"}`}>{m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}</td>
                  <td className="mono text-right text-ink-300">{m.stock_anterior} → <span className="text-ink-100">{m.stock_resultante}</span></td>
                  <td className="text-xs text-ink-300">{m.motivo ?? "—"}{m.usuario && <span className="text-ink-400"> · {m.usuario}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
