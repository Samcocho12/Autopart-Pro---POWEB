import { PedidoModel } from "../models/PedidoModel.js";
import { WompiService } from "../services/WompiService.js";
import { env } from "../config/env.js";
import { HttpError, requireFields, toInt } from "../utils/http.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function urlRetorno(req) {
  const base = env.publicSiteUrl || req.headers.origin || `${req.protocol}://${req.get("host")}`;
  return `${base.replace(/\/$/, "")}/pago/resultado`;
}

export const PedidoController = {
  /** POST /api/pedidos — crea el pedido y devuelve los datos del checkout Wompi */
  async crear(req, res) {
    const { cliente, items } = req.body ?? {};
    requireFields(cliente, ["nombre", "documento", "email", "telefono", "direccion", "ciudad"]);
    if (!EMAIL.test(cliente.email)) throw new HttpError(400, "Correo electrónico inválido");
    if (!Array.isArray(items) || !items.length) throw new HttpError(400, "El carrito está vacío");
    if (items.length > 50) throw new HttpError(400, "Máximo 50 productos distintos por pedido");

    const limpios = items.map((i) => ({ producto_id: toInt(i.producto_id), cantidad: toInt(i.cantidad) }));
    if (limpios.some((i) => !i.producto_id || !i.cantidad || i.cantidad < 1 || i.cantidad > 99)) throw new HttpError(400, "Cantidades inválidas");

    const pedido = await PedidoModel.crear({ cliente, items: limpios });
    const checkout = WompiService.datosCheckout({ referencia: pedido.referencia, total: pedido.total, email: pedido.email, redirectUrl: urlRetorno(req) });
    res.status(201).json({ pedido, checkout });
  },

  /** GET /api/pedidos/:referencia — estado público del pedido */
  async estado(req, res) {
    const p = await PedidoModel.porReferencia(req.params.referencia);
    if (!p) throw new HttpError(404, "Pedido no encontrado");
    res.json({
      referencia: p.referencia, estado: p.estado, total: p.total, subtotal: p.subtotal, iva: p.iva,
      metodo_pago: p.metodo_pago, creado_en: p.creado_en, pagado_en: p.pagado_en, cliente: p.cliente, items: p.items,
    });
  },

  /** GET /api/admin/pedidos */
  async listar(req, res) {
    const estado = ["pendiente", "pagado", "rechazado", "anulado", "error"].includes(req.query.estado) ? req.query.estado : undefined;
    res.json(await PedidoModel.listar({ estado, q: req.query.q?.toString(), page: toInt(req.query.page, 1), limit: Math.min(100, toInt(req.query.limit, 20)) }));
  },

  /** GET /api/admin/pedidos/:id */
  async detalle(req, res) {
    const p = await PedidoModel.porId(toInt(req.params.id));
    if (!p) throw new HttpError(404, "Pedido no encontrado");
    res.json(p);
  },
};
