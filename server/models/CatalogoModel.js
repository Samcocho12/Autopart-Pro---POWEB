import { query } from "../config/db.js";

/** Catálogos maestros: categorías, fabricantes, proveedores y vehículos. */
export class CatalogoModel {
  static categorias() {
    return query(`SELECT c.id, c.nombre, c.slug, c.descripcion, COUNT(p.id) AS productos
                  FROM categorias c LEFT JOIN productos p ON p.categoria_id = c.id AND p.activo = 1
                  GROUP BY c.id ORDER BY c.nombre`);
  }

  static fabricantes() {
    return query("SELECT id, nombre, pais FROM fabricantes ORDER BY nombre");
  }

  static proveedores() {
    return query("SELECT id, nombre, nit, telefono, email, ciudad FROM proveedores ORDER BY nombre");
  }

  static marcasVehiculo() {
    return query(`SELECT ma.id, ma.nombre, COUNT(DISTINCT mv.id) AS modelos
                  FROM marcas_vehiculo ma LEFT JOIN modelos_vehiculo mv ON mv.marca_id = ma.id
                  GROUP BY ma.id ORDER BY ma.nombre`);
  }

  static modelosPorMarca(marcaId) {
    return query(`SELECT mv.id, mv.nombre, MIN(co.anio_desde) AS anio_desde, MAX(co.anio_hasta) AS anio_hasta
                  FROM modelos_vehiculo mv LEFT JOIN compatibilidades co ON co.modelo_id = mv.id
                  WHERE mv.marca_id = ? GROUP BY mv.id ORDER BY mv.nombre`, [marcaId]);
  }

  static todosLosModelos() {
    return query(`SELECT mv.id, mv.nombre, ma.id AS marca_id, ma.nombre AS marca
                  FROM modelos_vehiculo mv JOIN marcas_vehiculo ma ON ma.id = mv.marca_id ORDER BY ma.nombre, mv.nombre`);
  }
}
