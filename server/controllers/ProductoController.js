import { ProductoModel } from "../models/ProductoModel.js";
import { InventarioModel } from "../models/InventarioModel.js";
import { withTransaction } from "../config/db.js";
import { HttpError, requireFields, toInt, toNumber } from "../utils/http.js";

const leerFiltros = (q) => ({
  q: q.q?.toString().slice(0, 80),
  categoria: q.categoria?.toString(),
  fabricante: toInt(q.fabricante),
  marca: toInt(q.marca),
  modelo: toInt(q.modelo),
  anio: toInt(q.anio),
  min: toNumber(q.min),
  max: toNumber(q.max),
  enStock: q.enStock === "1" || q.enStock === "true",
  stockBajo: q.stockBajo === "1" || q.stockBajo === "true",
  activo: q.activo === undefined ? undefined : q.activo === "1",
  orden: q.orden?.toString(),
  page: toInt(q.page, 1),
  limit: toInt(q.limit, 24),
});

export const ProductoController = {
  /** GET /api/productos — búsqueda avanzada pública */
  async buscar(req, res) {
    res.json(await ProductoModel.buscar(leerFiltros(req.query)));
  },

  /** GET /api/productos/:id */
  async detalle(req, res) {
    const p = await ProductoModel.obtener(toInt(req.params.id));
    if (!p) throw new HttpError(404, "Producto no encontrado");
    const relacionados = await ProductoModel.relacionados(p.id, p.categoria_id);
    res.json({ ...p, relacionados });
  },

  /** GET /api/admin/productos */
  async buscarAdmin(req, res) {
    res.json(await ProductoModel.buscar(leerFiltros(req.query), { admin: true }));
  },

  /** GET /api/admin/productos/:id */
  async detalleAdmin(req, res) {
    const p = await ProductoModel.obtener(toInt(req.params.id), { admin: true });
    if (!p) throw new HttpError(404, "Producto no encontrado");
    p.movimientos = await InventarioModel.movimientos({ productoId: p.id, limit: 20 });
    res.json(p);
  },

  /** POST /api/admin/productos */
  async crear(req, res) {
    const d = req.body;
    requireFields(d, ["sku", "nombre", "categoria_id", "fabricante_id", "precio_venta"]);
    if (Number(d.precio_venta) < 0) throw new HttpError(400, "El precio no puede ser negativo");
    const id = await withTransaction(async (conn) => {
      const nuevoId = await ProductoModel.crear(conn, d);
      const stockInicial = toInt(d.stock, 0);
      if (stockInicial > 0) {
        await InventarioModel.registrarMovimiento(conn, { productoId: nuevoId, tipo: "entrada", cantidad: stockInicial, motivo: "Stock inicial", usuarioId: req.user.sub });
      } else {
        await InventarioModel.evaluarAlerta(conn, nuevoId, 0, toInt(d.stock_minimo, 5));
      }
      return nuevoId;
    });
    res.status(201).json(await ProductoModel.obtener(id, { admin: true }));
  },

  /** PUT /api/admin/productos/:id — el stock solo cambia vía movimientos */
  async actualizar(req, res) {
    const id = toInt(req.params.id);
    const { stock: _ignorado, ...datos } = req.body ?? {};
    const n = await ProductoModel.actualizar(id, datos);
    if (!n) throw new HttpError(404, "Producto no encontrado o sin cambios");
    if (datos.stock_minimo !== undefined) {
      await withTransaction(async (conn) => {
        const [[p]] = await conn.query("SELECT stock, stock_minimo FROM productos WHERE id = ?", [id]);
        await InventarioModel.evaluarAlerta(conn, id, p.stock, p.stock_minimo);
      });
    }
    res.json(await ProductoModel.obtener(id, { admin: true }));
  },

  /** DELETE /api/admin/productos/:id — borrado lógico */
  async eliminar(req, res) {
    const n = await ProductoModel.desactivar(toInt(req.params.id));
    if (!n) throw new HttpError(404, "Producto no encontrado");
    res.status(204).end();
  },

  /** POST /api/admin/productos/:id/compatibilidades */
  async agregarCompatibilidad(req, res) {
    const d = req.body;
    requireFields(d, ["modelo_id", "anio_desde", "anio_hasta"]);
    if (toInt(d.anio_hasta) < toInt(d.anio_desde)) throw new HttpError(400, "El año final debe ser mayor o igual al inicial");
    const id = await ProductoModel.agregarCompatibilidad(toInt(req.params.id), d);
    res.status(201).json({ id });
  },

  /** DELETE /api/admin/compatibilidades/:id */
  async eliminarCompatibilidad(req, res) {
    const n = await ProductoModel.eliminarCompatibilidad(toInt(req.params.id));
    if (!n) throw new HttpError(404, "Compatibilidad no encontrada");
    res.status(204).end();
  },
};
