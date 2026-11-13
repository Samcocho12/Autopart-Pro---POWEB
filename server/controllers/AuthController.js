import { UsuarioModel } from "../models/UsuarioModel.js";
import { DashboardModel } from "../models/DashboardModel.js";
import { signToken } from "../middlewares/auth.js";
import { HttpError, requireFields } from "../utils/http.js";

export const AuthController = {
  /** POST /api/auth/login */
  async login(req, res) {
    requireFields(req.body, ["email", "password"]);
    const u = await UsuarioModel.porEmail(req.body.email);
    if (!u || !(await UsuarioModel.verificarPassword(req.body.password, u.password_hash))) {
      throw new HttpError(401, "Correo o contraseña incorrectos");
    }
    res.json({ token: signToken(u), usuario: { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol } });
  },

  /** GET /api/auth/me */
  async me(req, res) {
    const u = await UsuarioModel.porId(req.user.sub);
    if (!u) throw new HttpError(401, "Usuario no encontrado");
    res.json(u);
  },
};

export const DashboardController = {
  /** GET /api/admin/dashboard */
  async resumen(_req, res) { res.json(await DashboardModel.resumen()); },
};
