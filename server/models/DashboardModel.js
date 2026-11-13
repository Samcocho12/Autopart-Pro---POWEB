import { query } from "../config/db.js";

/** Indicadores para el panel administrativo. */
export class DashboardModel {
  static async resumen() {
    const [[kpi], [inv], ventasDia, topProductos, porCategoria, recientes] = await Promise.all([
      query(`SELECT
               COALESCE(SUM(CASE WHEN estado='pagado' AND pagado_en >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN total END),0) AS ventas_30d,
               COUNT(CASE WHEN estado='pagado' AND pagado_en >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) AS pedidos_30d,
               COUNT(CASE WHEN estado='pendiente' THEN 1 END) AS pendientes,
               ROUND(COALESCE(AVG(CASE WHEN estado='pagado' THEN total END),0)) AS ticket_promedio
             FROM pedidos`),
      query(`SELECT COUNT(*) AS referencias, COALESCE(SUM(stock),0) AS unidades,
                    COALESCE(SUM(stock * precio_costo),0) AS valor_costo,
                    SUM(stock = 0) AS agotados, SUM(stock > 0 AND stock <= stock_minimo) AS bajos
             FROM productos WHERE activo = 1`),
      query(`SELECT DATE_FORMAT(pagado_en, '%Y-%m-%d') AS dia, SUM(total) AS total, COUNT(*) AS pedidos
             FROM pedidos WHERE estado='pagado' AND pagado_en >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
             GROUP BY dia ORDER BY dia`),
      query(`SELECT p.id, p.sku, p.nombre, SUM(d.cantidad) AS unidades, SUM(d.subtotal) AS total
             FROM detalle_pedido d JOIN pedidos pe ON pe.id = d.pedido_id JOIN productos p ON p.id = d.producto_id
             WHERE pe.estado = 'pagado' GROUP BY p.id ORDER BY unidades DESC, total DESC LIMIT 5`),
      query(`SELECT c.nombre AS categoria, SUM(d.subtotal) AS total
             FROM detalle_pedido d JOIN pedidos pe ON pe.id = d.pedido_id JOIN productos p ON p.id = d.producto_id
             JOIN categorias c ON c.id = p.categoria_id
             WHERE pe.estado = 'pagado' GROUP BY c.id ORDER BY total DESC`),
      query(`SELECT pe.id, pe.referencia, pe.total, pe.estado, pe.creado_en, cl.nombre AS cliente
             FROM pedidos pe JOIN clientes cl ON cl.id = pe.cliente_id ORDER BY pe.creado_en DESC LIMIT 6`),
    ]);
    return { kpi, inventario: inv, ventasDia, topProductos, porCategoria, recientes };
  }
}
