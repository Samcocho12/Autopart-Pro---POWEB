import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Boxes, PackageX, Receipt, TrendingUp, Wallet } from "lucide-react";
import { Encabezado } from "./AdminLayout";
import { Cargando, ErrorBox, EstadoBadge } from "../components/ui";
import { api } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { compactMoney, fecha, money, number } from "../lib/format";
import type { Dashboard as D } from "../lib/types";

const tooltip = {
  contentStyle: { background: "#13171c", border: "1px solid #262d36", borderRadius: 12, fontSize: 12 },
  labelStyle: { color: "#8b95a3" },
  itemStyle: { color: "#e6eaef" },
};

function Kpi({ icon: Icon, label, valor, sub, tono = "text-signal" }: { icon: typeof Wallet; label: string; valor: string; sub?: string; tono?: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-wider text-ink-400 uppercase">{label}</p>
        <Icon className={`size-4 ${tono}`} />
      </div>
      <p className="mono mt-3 text-2xl font-semibold">{valor}</p>
      {sub && <p className="mt-1 text-xs text-ink-400">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { data: d, error, loading } = useFetch(() => api<D>("/admin/dashboard", { auth: true }), []);
  if (loading) return <Cargando />;
  if (error || !d) return <ErrorBox mensaje={error ?? "Sin datos"} />;

  // Completa los 30 días para que la gráfica no tenga huecos
  const serie = Array.from({ length: 30 }, (_, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - 29 + i);
    const key = dt.toLocaleDateString("en-CA");
    const v = d.ventasDia.find((x) => x.dia === key);
    return { dia: dt.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }), total: Number(v?.total ?? 0) };
  });

  return (
    <>
      <Encabezado titulo="Dashboard" sub="Resumen de ventas e inventario de los últimos 30 días" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <Kpi icon={Wallet} label="Ventas 30 días" valor={compactMoney(d.kpi.ventas_30d)} sub={money(d.kpi.ventas_30d)} />
        <Kpi icon={Receipt} label="Pedidos pagados" valor={number(d.kpi.pedidos_30d)} sub={`${d.kpi.pendientes} pendientes`} />
        <Kpi icon={TrendingUp} label="Ticket promedio" valor={compactMoney(d.kpi.ticket_promedio)} />
        <Kpi icon={Boxes} label="Referencias" valor={number(d.inventario.referencias)} sub={`${number(d.inventario.unidades)} unidades`} tono="text-info" />
        <Kpi icon={AlertTriangle} label="Stock bajo" valor={number(d.inventario.bajos)} tono="text-warn" sub="≤ stock mínimo" />
        <Kpi icon={PackageX} label="Agotados" valor={number(d.inventario.agotados)} tono="text-danger" sub={`Inventario: ${compactMoney(d.inventario.valor_costo)}`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card p-5">
          <p className="font-display font-bold">Ventas diarias</p>
          <p className="text-xs text-ink-400">Pedidos con pago aprobado</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff6a1a" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#ff6a1a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1b2027" vertical={false} />
                <XAxis dataKey="dia" tick={{ fill: "#5d6876", fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tickFormatter={(v) => compactMoney(v)} tick={{ fill: "#5d6876", fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
                <Tooltip {...tooltip} formatter={(v) => [money(Number(v)), "Ventas"]} />
                <Area type="monotone" dataKey="total" stroke="#ff6a1a" strokeWidth={2} fill="url(#gv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <p className="font-display font-bold">Ventas por categoría</p>
          <p className="text-xs text-ink-400">Histórico acumulado</p>
          <div className="mt-5 space-y-3.5">
            {d.porCategoria.map((c) => {
              const max = Math.max(...d.porCategoria.map((x) => Number(x.total)));
              return (
                <div key={c.categoria}>
                  <div className="mb-1 flex justify-between text-xs"><span className="text-ink-200">{c.categoria}</span><span className="mono text-ink-400">{compactMoney(c.total)}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-700">
                    <div className="h-full rounded-full bg-gradient-to-r from-signal-deep to-signal" style={{ width: `${(Number(c.total) / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <p className="font-display font-bold">Más vendidos</p>
          </div>
          <table className="table-base">
            <thead><tr><th>Producto</th><th className="text-right">Unid.</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {d.topProductos.map((p) => (
                <tr key={p.id}>
                  <td><Link to={`/admin/inventario/${p.id}`} className="hover:text-signal">{p.nombre.split(" — ")[0]}</Link><p className="mono text-xs text-ink-400">{p.sku}</p></td>
                  <td className="mono text-right">{p.unidades}</td>
                  <td className="mono text-right">{money(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <p className="font-display font-bold">Pedidos recientes</p>
            <Link to="/admin/pedidos" className="text-xs text-ink-400 hover:text-signal">Ver todos</Link>
          </div>
          <table className="table-base">
            <thead><tr><th>Referencia</th><th>Cliente</th><th>Estado</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {d.recientes.map((p) => (
                <tr key={p.id}>
                  <td><span className="mono text-xs">{p.referencia}</span><p className="text-xs text-ink-400">{fecha(p.creado_en)}</p></td>
                  <td>{p.cliente}</td>
                  <td><EstadoBadge estado={p.estado} /></td>
                  <td className="mono text-right">{money(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
