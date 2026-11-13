import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { VehicleProvider } from "./context/VehicleContext";
import StoreLayout from "./components/StoreLayout";
import Home from "./pages/Home";
import Catalogo from "./pages/Catalogo";
import Producto from "./pages/Producto";
import Checkout from "./pages/Checkout";
import PagoResultado from "./pages/PagoResultado";
import { Cargando, Vacio } from "./components/ui";

const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const Login = lazy(() => import("./admin/Login"));
const Dashboard = lazy(() => import("./admin/Dashboard"));
const Inventario = lazy(() => import("./admin/Inventario"));
const ProductoAdmin = lazy(() => import("./admin/ProductoAdmin"));
const Alertas = lazy(() => import("./admin/Alertas"));
const Movimientos = lazy(() => import("./admin/Movimientos"));
const Pedidos = lazy(() => import("./admin/Pedidos"));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VehicleProvider>
          <CartProvider>
            <Suspense fallback={<Cargando />}>
            <Routes>
              <Route element={<StoreLayout />}>
                <Route index element={<Home />} />
                <Route path="catalogo" element={<Catalogo />} />
                <Route path="producto/:id" element={<Producto />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="pago/resultado" element={<PagoResultado />} />
                <Route path="*" element={<div className="mx-auto max-w-xl px-4 py-20"><Vacio titulo="Página no encontrada" /></div>} />
              </Route>
              <Route path="admin/login" element={<Login />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="inventario" element={<Inventario />} />
                <Route path="inventario/:id" element={<ProductoAdmin />} />
                <Route path="alertas" element={<Alertas />} />
                <Route path="movimientos" element={<Movimientos />} />
                <Route path="pedidos" element={<Pedidos />} />
              </Route>
            </Routes>
            </Suspense>
          </CartProvider>
        </VehicleProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
