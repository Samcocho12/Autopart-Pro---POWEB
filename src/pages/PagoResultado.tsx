import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Cargando, ErrorBox } from "../components/ui";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import { fecha, money } from "../lib/format";
import type { EstadoPedido } from "../lib/types";

interface Estado {
  referencia: string;
  estado: EstadoPedido;
  total: number;
  subtotal: number;
  iva: number;
  metodo_pago: string | null;
  creado_en: string;
  cliente: string;
  items: { sku: string; nombre: string; cantidad: number; subtotal: number }[];
}

export default function PagoResultado() {
  const [params] = useSearchParams();
  const { clear } = useCart();
  const [pedido, setPedido] = useState<Estado | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const txId = params.get("id");
    let ref: string | null = null;
    try { ref = sessionStorage.getItem("autopart.ultimoPedido"); } catch { /* opcional */ }
    let intentos = 0;
    let timer: number;

    const consultar = async () => {
      try {
        if (txId) {
          const v = await api<{ referencia: string }>(`/pagos/wompi/verificar?id=${encodeURIComponent(txId)}`);
          ref = v.referencia;
        }
        if (!ref) throw new Error("No encontramos la referencia del pedido.");
        const p = await api<Estado>(`/pedidos/${ref}`);
        setPedido(p);
        if (p.estado === "pagado") clear();
        if (p.estado === "pendiente" && intentos++ < 6) timer = window.setTimeout(consultar, 3000);
      } catch (e) {
        setError((e as Error).message);
      }
    };
    consultar();
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <div className="mx-auto max-w-xl px-4 py-20"><ErrorBox mensaje={error} /></div>;
  if (!pedido) return <Cargando texto="Confirmando tu pago con Wompi…" />;

  const ui = {
    pagado: { Icon: CheckCircle2, color: "text-ok", titulo: "¡Pago aprobado!", texto: "Tu pedido fue confirmado y ya estamos alistando tus repuestos." },
    pendiente: { Icon: Clock, color: "text-warn", titulo: "Pago en proceso", texto: "Wompi aún está confirmando la transacción. Esta página se actualiza sola." },
    rechazado: { Icon: XCircle, color: "text-danger", titulo: "Pago rechazado", texto: "La transacción no fue aprobada. Tu carrito sigue guardado para intentarlo de nuevo." },
    anulado: { Icon: XCircle, color: "text-ink-300", titulo: "Pago anulado", texto: "La transacción fue anulada." },
    error: { Icon: XCircle, color: "text-danger", titulo: "Hubo un problema", texto: "No pudimos procesar el pago. Intenta nuevamente." },
  }[pedido.estado];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="card animate-rise p-8 text-center">
        <ui.Icon className={`mx-auto size-16 ${ui.color}`} strokeWidth={1.5} />
        <h1 className="mt-5 font-display text-3xl font-extrabold">{ui.titulo}</h1>
        <p className="mt-2 text-ink-300">{ui.texto}</p>
        <div className="mt-8 space-y-2 rounded-xl border border-ink-700 bg-ink-800/60 p-5 text-left text-sm">
          <div className="flex justify-between"><span className="text-ink-400">Referencia</span><span className="mono">{pedido.referencia}</span></div>
          <div className="flex justify-between"><span className="text-ink-400">Cliente</span><span>{pedido.cliente}</span></div>
          <div className="flex justify-between"><span className="text-ink-400">Fecha</span><span>{fecha(pedido.creado_en)}</span></div>
          {pedido.metodo_pago && <div className="flex justify-between"><span className="text-ink-400">Método</span><span className="mono">{pedido.metodo_pago}</span></div>}
          <div className="border-t border-ink-700 pt-3">
            {pedido.items.map((i) => (
              <div key={i.sku} className="flex justify-between gap-4 py-1 text-ink-300">
                <span className="truncate">{i.cantidad} × {i.nombre.split(" — ")[0]}</span><span className="mono">{money(i.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-ink-700 pt-3 text-base font-semibold"><span>Total</span><span className="mono">{money(pedido.total)}</span></div>
        </div>
        <div className="mt-8 flex justify-center gap-3">
          {pedido.estado === "pagado" ? <Link to="/catalogo" className="btn-primary">Seguir comprando</Link> : <Link to="/checkout" className="btn-primary">Reintentar pago</Link>}
          <Link to="/" className="btn-ghost">Inicio</Link>
        </div>
      </div>
    </div>
  );
}
