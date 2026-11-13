import bcrypt from "bcryptjs";
import { query } from "../config/db.js";

export class UsuarioModel {
  static async porEmail(email) {
    const rows = await query("SELECT * FROM usuarios WHERE email = ? AND activo = 1", [String(email).toLowerCase().trim()]);
    return rows[0] ?? null;
  }

  static async porId(id) {
    const rows = await query("SELECT id, nombre, email, rol, activo, creado_en FROM usuarios WHERE id = ?", [id]);
    return rows[0] ?? null;
  }

  static verificarPassword(plano, hash) {
    return bcrypt.compare(plano, hash);
  }
}
