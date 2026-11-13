import { query } from "../config/db.js";
import { HttpError } from "../utils/http.js";

/**
 * Inventario: kardex de movimientos y alertas de stock mínimo.
 * Todos los cambios de stock pasan por `registrarMovimiento` para que
 * quede trazabilidad y se evalúen las alertas automáticamente.
 */
export class InventarioModel {
  /**
   * Aplica un movimiento de stock dentro de una transacción.
   * tipo: entrada (+), salida (-), venta (-), ajuste (deja el stock en `cantidad`).
   */
  static async registrarMovimiento(conn, { productoId, tipo, cantidad, motivo, usuarioId = null, pedidoId = null }) {
    const [[prod]] = await conn.query("SELECT id, stock, stock_minimo FROM productos WHERE id = ? FOR UPDATE", [productoId]);
    if (!prod) throw new HttpError(404, "Producto no encontrado");

    let delta;
    if (tipo === "entrada") delta = Math.abs(cantidad);
    else if (tipo === "salida" || tipo === "venta") delta = -Math.abs(cantidad);
    else if (tipo === "ajuste") delta = cantidad - prod.stock;
    else throw new HttpError(400, "Tipo de movimiento inválido");

    const nuevo = prod.stock + delta;
    if (nuevo < 0) throw new HttpError(409, `Stock insuficiente (disponible: ${prod.stock})`);

    await conn.query("UPDATE productos SET stock = ? WHERE id = ?", [nuevo, productoId]);
    await conn.query(
      `INSERT INTO movimientos_inventario (producto_id, usuario_id, pedido_id, tipo, cantidad, stock_anterior, stock_resultante, motivo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [productoId, usuarioId, pedidoId, tipo, delta, prod.stock, nuevo, motivo ?? null]);
    await this.evaluarAlerta(conn, productoId, nuevo, prod.stock_minimo);
    return { stock_anterior: prod.stock, stock_resultante: nuevo };
  }

  /** Crea, actualiza o cierra la alerta de stock mínimo del producto. */
  static async evaluarAlerta(conn, productoId, stock, minimo) {
    const [[activa]] = await conn.query("SELECT id, nivel FROM alertas_stock WHERE producto_id = ? AND estado = 'activa' LIMIT 1", [productoId]);
    if (stock <= minimo) {
      const nivel = stock === 0 ? "agotado" : "bajo";
      if (!activa) {
        await conn.query("INSERT INTO alertas_stock (producto_id, stock_actual, stock_minimo, nivel) VALUES (?, ?, ?, ?)", [productoId, stock, minimo, nivel]);
      } else {
        await conn.query("UPDATE alertas_stock SET stock_actual = ?, stock_minimo = ?, nivel = ? WHERE id = ?", [stock, minimo, nivel, activa.id]);
      }
    } else if (activa) {
      await conn.query("UPDATE alertas_stock SET estado = 'atendida', stock_actual = ?, atendida_en = NOW() WHERE id = ?", [stock, activa.id]);
    }
  }

  static movimientos({ productoId, limit = 50 } = {}) {
    const where = productoId ? "WHERE m.producto_id = ?" : "";
    const params = productoId ? [productoId, limit] : [limit];
    return query(
      `SELECT m.id, m.tipo, m.cantidad, m.stock_anterior, m.stock_resultante, m.motivo, m.creado_en,
              p.id AS producto_id, p.sku, p.nombre AS producto, u.nombre AS usuario, pe.referencia AS pedido
       FROM movimientos_inventario m
       JOIN productos p ON p.id = m.producto_id
       LEFT JOIN usuarios u ON u.id = m.usuario_id
       LEFT JOIN pedidos pe ON pe.id = m.pedido_id
       ${where} ORDER BY m.creado_en DESC, m.id DESC LIMIT ?`, params);
  }

  static alertas({ estado = "activa", nivel } = {}) {
    const where = ["a.estado = ?"];
    const params = [estado];
    if (nivel) { where.push("a.nivel = ?"); params.push(nivel); }
    return query(
      `SELECT a.id, a.nivel, a.estado, a.creado_en, a.atendida_en, p.id AS producto_id, p.sku, p.nombre, p.stock,
              p.stock_minimo, p.ubicacion, c.nombre AS categoria, pr.nombre AS proveedor,
              GREATEST(p.stock_minimo * 2 - p.stock, 1) AS sugerido_reponer
       FROM alertas_stock a
       JOIN productos p ON p.id = a.producto_id
       JOIN categorias c ON c.id = p.categoria_id
       LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
       WHERE ${where.join(" AND ")}
       ORDER BY FIELD(a.nivel, 'agotado', 'bajo'), p.stock ASC`, params);
  }

  static async marcarAtendida(id) {
    const r = await query("UPDATE alertas_stock SET estado = 'atendida', atendida_en = NOW() WHERE id = ? AND estado = 'activa'", [id]);
    return r.affectedRows;
  }
}
