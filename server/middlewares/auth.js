import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

export function signToken(usuario) {
  return jwt.sign({ sub: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }, env.jwtSecret, { expiresIn: "8h" });
}

/** Exige un token Bearer válido. */
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, "Debes iniciar sesión"));
  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    next(new HttpError(401, "Sesión expirada o inválida"));
  }
}

/** Restringe por rol: requireRole('admin') */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) return next(new HttpError(403, "No tienes permisos para esta acción"));
  next();
};
