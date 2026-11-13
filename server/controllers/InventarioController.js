import { InventarioModel } from "../models/InventarioModel.js";
import { withTransaction } from "../config/db.js";
import { HttpError, requireFields, toInt } from "../utils/http.js";

export const InventarioController = {
  /** POST /api/admin/inventario/movimientos */
  async registrar(req, res) {
    const d = req.body;
    requireFields(d, ["producto_id", "tipo", "cantidad"]);
    if (!["entrada", "salida", "ajuste"].includes(d.tipo)) throw new HttpError(400, "Tipo debe ser entrada, salida o ajuste");
    const cantidad = toInt(d.cantidad);
    if (cantidad === undefined || cantidad < 0 || (d.tipo !== "ajuste" && cantidad === 0)) throw new HttpError(400, "Cantidad inválida");
    const r = await withTransaction((conn) =>
      InventarioModel.registrarMovimiento(conn, { productoId: toInt(d.producto_id), tipo: d.tipo, cantidad, motivo: d.motivo, usuarioId: req.user.sub }));
    res.status(201).json(r);
  },

  /** GET /api/admin/inventario/movimientos?producto_id= */
  async movimientos(req, res) {
    res.json(await InventarioModel.movimientos({ productoId: toInt(req.query.producto_id), limit: Math.min(200, toInt(req.query.limit, 50)) }));
  },

  /** GET /api/admin/alertas?estado=activa&nivel= */
  async alertas(req, res) {
    res.json(await InventarioModel.alertas({ estado: req.query.estado === "atendida" ? "atendida" : "activa", nivel: req.query.nivel }));
  },

  /** PATCH /api/admin/alertas/:id/atender */
  async atender(req, res) {
    const n = await InventarioModel.marcarAtendida(toInt(req.params.id));
    if (!n) throw new HttpError(404, "Alerta no encontrada o ya atendida");
    res.json({ ok: true });
  },
};
