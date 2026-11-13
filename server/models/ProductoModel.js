import { query } from "../config/db.js";

const ORDENES = {
  relevancia: "p.nombre ASC",
  precio_asc: "p.precio_venta ASC",
  precio_desc: "p.precio_venta DESC",
  stock: "p.stock ASC",
  recientes: "p.creado_en DESC, p.id DESC",
  nombre: "p.nombre ASC",
};

/**
 * Modelo de Producto (repuesto). Encapsula todo el acceso SQL a la tabla
 * `productos` y sus relaciones (categoría, fabricante, compatibilidades).
 */
export class ProductoModel {
  /** Construye el WHERE común para búsqueda filtrada. */
  static #filtros(f, { admin = false, ignorarCategoria = false } = {}) {
    const where = [];
    const params = [];
    if (!admin) where.push("p.activo = 1");
    else if (f.activo !== undefined) { where.push("p.activo = ?"); params.push(f.activo ? 1 : 0); }

    if (f.q) {
      for (const term of String(f.q).trim().split(/\s+/).slice(0, 6)) {
        where.push("(p.nombre LIKE ? OR p.sku LIKE ? OR f.nombre LIKE ?)");
        const like = `%${term}%`;
        params.push(like, like, like);
      }
    }
    if (f.categoria && !ignorarCategoria) { where.push("c.slug = ?"); params.push(f.categoria); }
    if (f.fabricante) { where.push("p.fabricante_id = ?"); params.push(f.fabricante); }
    if (f.min !== undefined) { where.push("p.precio_venta >= ?"); params.push(f.min); }
    if (f.max !== undefined) { where.push("p.precio_venta <= ?"); params.push(f.max); }
    if (f.enStock) where.push("p.stock > 0");
    if (f.stockBajo) where.push("p.stock <= p.stock_minimo");

    if (f.marca || f.modelo || f.anio) {
      const sub = ["co.producto_id = p.id"];
      if (f.marca) { sub.push("mv.marca_id = ?"); params.push(f.marca); }
      if (f.modelo) { sub.push("co.modelo_id = ?"); params.push(f.modelo); }
      if (f.anio) { sub.push("? BETWEEN co.anio_desde AND co.anio_hasta"); params.push(f.anio); }
      where.push(`EXISTS (SELECT 1 FROM compatibilidades co JOIN modelos_vehiculo mv ON mv.id = co.modelo_id WHERE ${sub.join(" AND ")})`);
    }
    return { sql: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
  }

  static async buscar(f = {}, { admin = false } = {}) {
    const page = Math.max(1, f.page ?? 1);
    const limit = Math.min(100, Math.max(1, f.limit ?? 24));
    const orden = ORDENES[f.orden] ?? ORDENES.relevancia;
    const { sql, params } = this.#filtros(f, { admin });
    const base = `FROM productos p JOIN categorias c ON c.id = p.categoria_id JOIN fabricantes f ON f.id = p.fabricante_id ${sql}`;
    const campos = `p.id, p.sku, p.nombre, p.precio_venta, p.stock, p.stock_minimo, p.imagen_url, p.activo, p.ubicacion,
      c.id AS categoria_id, c.nombre AS categoria, c.slug AS categoria_slug, f.id AS fabricante_id, f.nombre AS fabricante
      ${admin ? ", p.precio_costo, p.proveedor_id" : ""}
      ${f.modelo ? `, (SELECT CONCAT(IF(mv2.nombre LIKE CONCAT(ma2.nombre, '%'), mv2.nombre, CONCAT(ma2.nombre, ' ', mv2.nombre)), ' ', co2.anio_desde, '-', co2.anio_hasta)
          FROM compatibilidades co2 JOIN modelos_vehiculo mv2 ON mv2.id = co2.modelo_id JOIN marcas_vehiculo ma2 ON ma2.id = mv2.marca_id
          WHERE co2.producto_id = p.id AND co2.modelo_id = ${Number(f.modelo)} ${f.anio ? `AND ${Number(f.anio)} BETWEEN co2.anio_desde AND co2.anio_hasta` : ""} LIMIT 1) AS vehiculo_compatible` : ""}`;

    const [items, [{ total }], facet] = await Promise.all([
      query(`SELECT ${campos} ${base} ORDER BY ${orden} LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]),
      query(`SELECT COUNT(*) AS total ${base}`, params),
      (() => {
        const fc = this.#filtros(f, { admin, ignorarCategoria: true });
        return query(
          `SELECT c.slug, c.nombre, COUNT(*) AS total
           FROM productos p JOIN categorias c ON c.id = p.categoria_id JOIN fabricantes f ON f.id = p.fabricante_id ${fc.sql}
           GROUP BY c.id ORDER BY c.nombre`, fc.params);
      })(),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit), facetas: { categorias: facet } };
  }

  static async obtener(id, { admin = false } = {}) {
    const rows = await query(
      `SELECT p.*, c.nombre AS categoria, c.slug AS categoria_slug, f.nombre AS fabricante, f.pais AS fabricante_pais,
              pr.nombre AS proveedor
       FROM productos p
       JOIN categorias c ON c.id = p.categoria_id
       JOIN fabricantes f ON f.id = p.fabricante_id
       LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
       WHERE p.id = ? ${admin ? "" : "AND p.activo = 1"}`, [id]);
    const p = rows[0];
    if (!p) return null;
    if (!admin) { delete p.precio_costo; delete p.proveedor_id; delete p.proveedor; }
    p.compatibilidades = await query(
      `SELECT co.id, co.anio_desde, co.anio_hasta, co.motor, mv.id AS modelo_id, mv.nombre AS modelo, ma.id AS marca_id, ma.nombre AS marca
       FROM compatibilidades co JOIN modelos_vehiculo mv ON mv.id = co.modelo_id JOIN marcas_vehiculo ma ON ma.id = mv.marca_id
       WHERE co.producto_id = ? ORDER BY ma.nombre, mv.nombre`, [id]);
    return p;
  }

  static async relacionados(id, categoriaId, limit = 4) {
    return query(
      `SELECT p.id, p.sku, p.nombre, p.precio_venta, p.stock, c.slug AS categoria_slug, c.nombre AS categoria, f.nombre AS fabricante
       FROM productos p JOIN categorias c ON c.id = p.categoria_id JOIN fabricantes f ON f.id = p.fabricante_id
       WHERE p.categoria_id = ? AND p.id <> ? AND p.activo = 1 AND p.stock > 0
       ORDER BY RAND() LIMIT ?`, [categoriaId, id, limit]);
  }

  static async crear(conn, d) {
    const [r] = await conn.query(
      `INSERT INTO productos (sku, nombre, descripcion, categoria_id, fabricante_id, proveedor_id, precio_costo, precio_venta, stock, stock_minimo, ubicacion, imagen_url, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [d.sku, d.nombre, d.descripcion ?? null, d.categoria_id, d.fabricante_id, d.proveedor_id ?? null, d.precio_costo ?? 0, d.precio_venta,
        d.stock_minimo ?? 5, d.ubicacion ?? null, d.imagen_url ?? null, d.activo === false ? 0 : 1]);
    return r.insertId;
  }

  static async actualizar(id, d) {
    const permitidos = ["sku", "nombre", "descripcion", "categoria_id", "fabricante_id", "proveedor_id", "precio_costo", "precio_venta", "stock_minimo", "ubicacion", "imagen_url", "activo"];
    const sets = [], params = [];
    for (const k of permitidos) if (d[k] !== undefined) { sets.push(`${k} = ?`); params.push(typeof d[k] === "boolean" ? Number(d[k]) : d[k]); }
    if (!sets.length) return 0;
    const r = await query(`UPDATE productos SET ${sets.join(", ")} WHERE id = ?`, [...params, id]);
    return r.affectedRows;
  }

  static async desactivar(id) {
    const r = await query("UPDATE productos SET activo = 0 WHERE id = ?", [id]);
    return r.affectedRows;
  }

  static async agregarCompatibilidad(productoId, { modelo_id, anio_desde, anio_hasta, motor }) {
    const r = await query("INSERT INTO compatibilidades (producto_id, modelo_id, anio_desde, anio_hasta, motor) VALUES (?, ?, ?, ?, ?)",
      [productoId, modelo_id, anio_desde, anio_hasta, motor ?? null]);
    return r.insertId;
  }

  static async eliminarCompatibilidad(id) {
    const r = await query("DELETE FROM compatibilidades WHERE id = ?", [id]);
    return r.affectedRows;
  }
}
