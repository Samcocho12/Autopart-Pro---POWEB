import { PedidoModel } from "../models/PedidoModel.js";
import { WompiService } from "../services/WompiService.js";
import { HttpError } from "../utils/http.js";

async function aplicarTransaccion(tx) {
  return PedidoModel.aplicarResultadoPago({
    referencia: tx.reference,
    estadoWompi: tx.status,
    transaccionId: tx.id,
    metodoPago: tx.payment_method_type,
    montoCentavos: tx.amount_in_cents,
  });
}

export const PagoController = {
  /**
   * GET /api/pagos/wompi/verificar?id=TRANSACCION
   * Wompi redirige al cliente con ?id=...; consultamos la transacción
   * directamente a Wompi (fuente de verdad) y actualizamos el pedido.
   */
  async verificar(req, res) {
    const id = req.query.id?.toString();
    if (!id) throw new HttpError(400, "Falta el id de la transacción");
    const tx = await WompiService.consultarTransaccion(id);
    const { pedido } = await aplicarTransaccion(tx);
    res.json({ referencia: pedido.referencia, estado: pedido.estado, estado_wompi: tx.status, metodo_pago: tx.payment_method_type });
  },

  /** POST /api/pagos/wompi/webhook — URL de eventos configurada en el panel de Wompi */
  async webhook(req, res) {
    const evento = req.body;
    if (!WompiService.verificarEvento(evento)) throw new HttpError(401, "Firma del evento inválida");
    if (evento.event === "transaction.updated" && evento.data?.transaction) {
      await aplicarTransaccion(evento.data.transaction);
    }
    res.json({ ok: true });
  },

  /** GET /api/pagos/config — informa al frontend si la pasarela está activa */
  config(_req, res) {
    res.json({ wompi: WompiService.configurado, sandbox: WompiService.esSandbox });
  },
};
