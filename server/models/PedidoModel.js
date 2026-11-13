import { query, withTransaction } from "../config/db.js";
import { HttpError } from "../utils/http.js";
import { InventarioModel } from "./InventarioModel.js";

const IVA = 0.19;

/** Pedidos de la tienda y su ciclo de vida de pago. */
export class PedidoModel {
  static generarReferencia() {
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `AP-${Date.now().toString(36).toUpperCase()}-${rand}`;
  }

  /**
   * Crea cliente + pedido en estado "pendiente" validando stock y precios
   * desde la base de datos (nunca se confía en el precio enviado por el navegador).
   */
  static async crear({ cliente, items }) {
    return withTransaction(async (conn) => {
      const ids = items.map((i) => i.producto_id);
      const [productos] = await conn.query("SELECT id, nombre, precio_venta, stock, activo FROM productos WHERE id IN (?)", [ids]);
      const mapa = new Map(productos.map((p) => [p.id, p]));

      const lineas = items.map(({ producto_id, cantidad }) => {
        const p = mapa.get(producto_id);
        if (!p || !p.activo) throw new HttpError(400, `El producto ${producto_id} no está disponible`);
        if (p.stock < cantidad) throw new HttpError(409, `Stock insuficiente para "${p.nombre}" (disponible: ${p.stock})`);
        return { producto_id, cantidad, precio_unitario: Number(p.precio_venta), subtotal: Number(p.precio_venta) * cantidad };
      });

      const total = lineas.reduce((s, l) => s + l.subtotal, 0);
      const subtotal = Math.round((total / (1 + IVA)) * 100) / 100;
      const iva = Math.round((total - subtotal) * 100) / 100;

      const [rc] = await conn.query(
        "INSERT INTO clientes (nombre, documento, email, telefono, direccion, ciudad) VALUES (?, ?, ?, ?, ?, ?)",
        [cliente.nombre, cliente.documento, cliente.email, cliente.telefono, cliente.direccion, cliente.ciudad]);

      const referencia = this.generarReferencia();
      const [rp] = await conn.query(
        "INSERT INTO pedidos (referencia, cliente_id, subtotal, iva, total, estado) VALUES (?, ?, ?, ?, ?, 'pendiente')",
        [referencia, rc.insertId, subtotal, iva, total]);

      await conn.query(
        "INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ?",
        [lineas.map((l) => [rp.insertId, l.producto_id, l.cantidad, l.precio_unitario, l.subtotal])]);

      return { id: rp.insertId, referencia, subtotal, iva, total, email: cliente.email };
    });
  }

  static async porReferencia(referencia) {
    const rows = await query(
      `SELECT pe.*, cl.nombre AS cliente, cl.email, cl.telefono, cl.documento, cl.direccion, cl.ciudad
       FROM pedidos pe JOIN clientes cl ON cl.id = pe.cliente_id WHERE pe.referencia = ?`, [referencia]);
    if (!rows[0]) return null;
    rows[0].items = await this.items(rows[0].id);
    return rows[0];
  }

  static async porId(id) {
    const rows = await query(
      `SELECT pe.*, cl.nombre AS cliente, cl.email, cl.telefono, cl.documento, cl.direccion, cl.ciudad
       FROM pedidos pe JOIN clientes cl ON cl.id = pe.cliente_id WHERE pe.id = ?`, [id]);
    if (!rows[0]) return null;
    rows[0].items = await this.items(id);
    return rows[0];
  }

  static items(pedidoId) {
    return query(
      `SELECT d.producto_id, d.cantidad, d.precio_unitario, d.subtotal, p.sku, p.nombre
       FROM detalle_pedido d JOIN productos p ON p.id = d.producto_id WHERE d.pedido_id = ?`, [pedidoId]);
  }

  static listar({ estado, q, page = 1, limit = 20 } = {}) {
    const where = [], params = [];
    if (estado) { where.push("pe.estado = ?"); params.push(estado); }
    if (q) { where.push("(pe.referencia LIKE ? OR cl.nombre LIKE ? OR cl.email LIKE ?)"); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    return Promise.all([
      query(`SELECT pe.id, pe.referencia, pe.total, pe.estado, pe.metodo_pago, pe.creado_en, pe.pagado_en,
                    cl.nombre AS cliente, cl.ciudad,
                    (SELECT SUM(cantidad) FROM detalle_pedido d WHERE d.pedido_id = pe.id) AS unidades
             FROM pedidos pe JOIN clientes cl ON cl.id = pe.cliente_id ${w}
             ORDER BY pe.creado_en DESC LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]),
      query(`SELECT COUNT(*) AS total FROM pedidos pe JOIN clientes cl ON cl.id = pe.cliente_id ${w}`, params),
    ]).then(([items, [{ total }]]) => ({ items, total, page, limit, pages: Math.ceil(total / limit) }));
  }

  /**
   * Aplica el resultado de una transacción Wompi al pedido. Es idempotente:
   * solo un pedido "pendiente" cambia de estado y descuenta inventario.
   */
  static async aplicarResultadoPago({ referencia, estadoWompi, transaccionId, metodoPago, montoCentavos }) {
    return withTransaction(async (conn) => {
      const [[pedido]] = await conn.query("SELECT * FROM pedidos WHERE referencia = ? FOR UPDATE", [referencia]);
      if (!pedido) throw new HttpError(404, "Pedido no encontrado");
      if (pedido.estado !== "pendiente") return { pedido, cambiado: false };

      if (montoCentavos !== undefined && Math.round(Number(pedido.total) * 100) !== Number(montoCentavos)) {
        await conn.query("UPDATE pedidos SET estado = 'error', wompi_transaction_id = ? WHERE id = ?", [transaccionId, pedido.id]);
        return { pedido: { ...pedido, estado: "error" }, cambiado: true };
      }

      const nuevoEstado = { APPROVED: "pagado", DECLINED: "rechazado", VOIDED: "anulado", ERROR: "error" }[estadoWompi];
      if (!nuevoEstado) return { pedido, cambiado: false }; // PENDING: seguir esperando

      if (nuevoEstado === "pagado") {
        const [items] = await conn.query("SELECT producto_id, cantidad FROM detalle_pedido WHERE pedido_id = ?", [pedido.id]);
        for (const it of items) {
          await InventarioModel.registrarMovimiento(conn, {
            productoId: it.producto_id, tipo: "venta", cantidad: it.cantidad, pedidoId: pedido.id, motivo: `Venta pedido ${referencia}`,
          });
        }
      }
      await conn.query(
        `UPDATE pedidos SET estado = ?, metodo_pago = ?, wompi_transaction_id = ?, pagado_en = ${nuevoEstado === "pagado" ? "NOW()" : "NULL"} WHERE id = ?`,
        [nuevoEstado, metodoPago ?? null, transaccionId ?? null, pedido.id]);
      return { pedido: { ...pedido, estado: nuevoEstado }, cambiado: true };
    });
  }
}
