export function notFound(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Ya existe un registro con ese valor único (SKU, email o NIT)." });
  if (err.code === "ER_ROW_IS_REFERENCED_2") return res.status(409).json({ error: "No se puede eliminar: el registro está en uso." });
  if (err.code === "ER_NO_REFERENCED_ROW_2") return res.status(400).json({ error: "Referencia inválida a otro registro." });
  const status = err.status ?? 500;
  if (status >= 500) console.error("[AutoPart API]", err);
  res.status(status).json({ error: status >= 500 ? "Error interno del servidor" : err.message, details: err.details });
}
