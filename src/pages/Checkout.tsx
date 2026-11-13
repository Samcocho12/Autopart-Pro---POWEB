import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Lock, ShieldCheck } from "lucide-react";
import { ErrorBox, ProductoVisual, Spinner, Vacio } from "../components/ui";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import { money, partirNombre } from "../lib/format";

interface RespuestaPedido {
  pedido: { referencia: string; total: number };
  checkout: { checkoutUrl: string; sandbox: boolean };
}

const CAMPOS = [
  ["nombre", "Nombre completo", "text", "sm:col-span-2"],
  ["documento", "Cédula / NIT", "text", ""],
  ["telefono", "Celular", "tel", ""],
  ["email", "Correo electrónico", "email", "sm:col-span-2"],
  ["direccion", "Dirección de envío", "text", "sm:col-span-2"],
  ["ciudad", "Ciudad", "text", "sm:col-span-2"],
] as const;

export default function Checkout() {
  const { items, total } = useCart();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sandbox, setSandbox] = useState<boolean | null>(null);
  const subtotal = total / 1.19;

  useEffect(() => { api<{ wompi: boolean; sandbox: boolean }>("/pagos/config").then((c) => setSandbox(c.wompi ? c.sandbox : null)).catch(() => null); }, []);

  if (!items.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <Vacio titulo="Tu carrito está vacío"><Link to="/catalogo" className="text-signal hover:underline">Ir al catálogo</Link></Vacio>
      </div>
    );
  }

  const pagar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const cliente = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      const r = await api<RespuestaPedido>("/pedidos", {
        method: "POST",
        body: { cliente, items: items.map((i) => ({ producto_id: i.id, cantidad: i.cantidad })) },
      });
      try { sessionStorage.setItem("autopart.ultimoPedido", r.pedido.referencia); } catch { /* opcional */ }
      window.location.href = r.checkout.checkoutUrl; // Redirección al Web Checkout de Wompi
    } catch (err) {
      setError((err as Error).message);
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.2em] text-signal uppercase">Checkout</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Finalizar compra</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <form onSubmit={pagar} className="card space-y-6 p-6">
          <div>
            <h2 className="font-display text-lg font-bold">Datos de facturación y envío</h2>
            <p className="text-sm text-ink-400">Usaremos estos datos para tu factura electrónica y el despacho.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {CAMPOS.map(([name, label, type, span]) => (
              <div key={name} className={span}>
                <label className="label" htmlFor={name}>{label}</label>
                <input id={name} name={name} type={type} required className="input" autoComplete={name === "nombre" ? "name" : name === "telefono" ? "tel" : name === "email" ? "email" : name === "direccion" ? "street-address" : name === "ciudad" ? "address-level2" : "off"} />
              </div>
            ))}
          </div>
          {error && <ErrorBox mensaje={error} />}
          <button className="btn-primary w-full py-3.5 text-base" disabled={enviando}>
            {enviando ? <Spinner className="text-ink-950" /> : <Lock className="size-4" />}
            {enviando ? "Conectando con Wompi…" : `Pagar ${money(total)}`}
          </button>
          <p className="flex items-center justify-center gap-2 text-xs text-ink-400">
            <ShieldCheck className="size-4 text-ok" />Serás redirigido al checkout seguro de Wompi (Bancolombia)
          </p>
        </form>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-4 font-display text-lg font-bold">Resumen</h2>
            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-3">
                  <ProductoVisual slug={i.categoria_slug} nombre={i.nombre} imagen={i.imagen_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{partirNombre(i.nombre).titulo}</p>
                    <p className="mono text-xs text-ink-400">{i.cantidad} × {money(i.precio)}</p>
                  </div>
                  <span className="mono text-sm">{money(i.precio * i.cantidad)}</span>
                </div>
              ))}
            </div>
            <dl className="mt-5 space-y-2 border-t border-ink-700 pt-4 text-sm">
              <div className="flex justify-between text-ink-300"><dt>Subtotal</dt><dd className="mono">{money(subtotal)}</dd></div>
              <div className="flex justify-between text-ink-300"><dt>IVA (19%)</dt><dd className="mono">{money(total - subtotal)}</dd></div>
              <div className="flex justify-between text-ink-300"><dt>Envío</dt><dd>Contraentrega</dd></div>
              <div className="flex justify-between pt-2 text-base font-semibold"><dt>Total</dt><dd className="mono text-xl">{money(total)}</dd></div>
            </dl>
          </div>
          {sandbox && (
            <div className="rounded-2xl border border-info/30 bg-info/10 p-4 text-xs leading-relaxed text-info">
              <p className="mb-1 font-semibold">Modo de pruebas (Sandbox)</p>
              Tarjeta aprobada: <span className="mono">4242 4242 4242 4242</span> · cualquier fecha futura y CVC.
              Tarjeta rechazada: <span className="mono">4111 1111 1111 1111</span>. Nequi aprobado: <span className="mono">3991111111</span>.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
