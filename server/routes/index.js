import { Router } from "express";
import { asyncHandler as h } from "../utils/http.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { ProductoController } from "../controllers/ProductoController.js";
import { CatalogoController } from "../controllers/CatalogoController.js";
import { InventarioController } from "../controllers/InventarioController.js";
import { PedidoController } from "../controllers/PedidoController.js";
import { PagoController } from "../controllers/PagoController.js";
import { AuthController, DashboardController } from "../controllers/AuthController.js";

const r = Router();

// ---------- Públicas ----------
r.get("/health", (_req, res) => res.json({ ok: true, servicio: "AutoPart Pro API", hora: new Date().toISOString() }));
r.get("/categorias", h(CatalogoController.categorias));
r.get("/fabricantes", h(CatalogoController.fabricantes));
r.get("/vehiculos/marcas", h(CatalogoController.marcas));
r.get("/vehiculos/marcas/:marcaId/modelos", h(CatalogoController.modelos));
r.get("/productos", h(ProductoController.buscar));
r.get("/productos/:id", h(ProductoController.detalle));
r.post("/pedidos", h(PedidoController.crear));
r.get("/pedidos/:referencia", h(PedidoController.estado));
r.get("/pagos/config", PagoController.config);
r.get("/pagos/wompi/verificar", h(PagoController.verificar));
r.post("/pagos/wompi/webhook", h(PagoController.webhook));

// ---------- Autenticación ----------
r.post("/auth/login", h(AuthController.login));
r.get("/auth/me", requireAuth, h(AuthController.me));

// ---------- Administración (JWT) ----------
const admin = Router();
admin.use(requireAuth);
admin.get("/dashboard", h(DashboardController.resumen));
admin.get("/proveedores", h(CatalogoController.proveedores));
admin.get("/modelos", h(CatalogoController.todosLosModelos));
admin.get("/productos", h(ProductoController.buscarAdmin));
admin.get("/productos/:id", h(ProductoController.detalleAdmin));
admin.post("/productos", requireRole("admin"), h(ProductoController.crear));
admin.put("/productos/:id", requireRole("admin"), h(ProductoController.actualizar));
admin.delete("/productos/:id", requireRole("admin"), h(ProductoController.eliminar));
admin.post("/productos/:id/compatibilidades", requireRole("admin"), h(ProductoController.agregarCompatibilidad));
admin.delete("/compatibilidades/:id", requireRole("admin"), h(ProductoController.eliminarCompatibilidad));
admin.get("/inventario/movimientos", h(InventarioController.movimientos));
admin.post("/inventario/movimientos", h(InventarioController.registrar));
admin.get("/alertas", h(InventarioController.alertas));
admin.patch("/alertas/:id/atender", h(InventarioController.atender));
admin.get("/pedidos", h(PedidoController.listar));
admin.get("/pedidos/:id", h(PedidoController.detalle));
r.use("/admin", admin);

export default r;
