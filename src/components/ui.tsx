import { useEffect, type ReactNode } from "react";
import {
  BatteryCharging, Car, CircleDot, Cog, Droplets, Filter, Loader2, Package, Settings2, Waves, X, Zap,
  type LucideIcon,
} from "lucide-react";
import type { EstadoPedido } from "../lib/types";
import { imagenProducto } from "../lib/imagenes";

export const CATEGORIA_UI: Record<string, { icon: LucideIcon; tono: string; color: string }> = {
  frenos: { icon: CircleDot, tono: "from-red-500/30 to-transparent", color: "text-red-600" },
  filtros: { icon: Filter, tono: "from-sky-500/25 to-transparent", color: "text-sky-600" },
  encendido: { icon: Zap, tono: "from-yellow-400/25 to-transparent", color: "text-amber-500" },
  suspension: { icon: Waves, tono: "from-violet-500/25 to-transparent", color: "text-violet-600" },
  motor: { icon: Cog, tono: "from-orange-500/30 to-transparent", color: "text-orange-600" },
  electrico: { icon: BatteryCharging, tono: "from-emerald-500/25 to-transparent", color: "text-emerald-600" },
  transmision: { icon: Settings2, tono: "from-slate-400/25 to-transparent", color: "text-slate-600" },
  lubricantes: { icon: Droplets, tono: "from-amber-400/30 to-transparent", color: "text-amber-600" },
  carroceria: { icon: Car, tono: "from-blue-500/25 to-transparent", color: "text-blue-600" },
};

export function CategoriaIcono({ slug, className = "size-5" }: { slug: string; className?: string }) {
  const Icon = CATEGORIA_UI[slug]?.icon ?? Package;
  return <Icon className={className} strokeWidth={1.75} />;
}

/** Imagen del producto: foto propia (imagen_url) o ilustración según el tipo de repuesto. */
export function ProductoVisual({ slug, sku, nombre, imagen, size = "md" }: { slug: string; sku?: string; nombre?: string; imagen?: string | null; size?: "sm" | "md" | "lg" }) {
  const ui = CATEGORIA_UI[slug];
  const dims = { sm: "h-14 w-14 rounded-xl", md: "aspect-[4/3] w-full rounded-xl", lg: "aspect-square w-full rounded-2xl" }[size];
  const icon = { sm: "size-6", md: "size-12", lg: "size-24" }[size];
  const src = nombre || imagen ? imagenProducto(nombre ?? "", imagen) : null;
  const esFoto = Boolean(imagen);
  return (
    <div className={`relative grid shrink-0 place-items-center overflow-hidden bg-tile bg-gradient-to-br text-white ${ui?.tono ?? "from-white/10 to-transparent"} ${dims}`}>
      <div className="grid-bg-dark absolute inset-0 opacity-70" />
      <div className="absolute -right-6 -bottom-6 size-24 rounded-full border border-white/5" />
      {src ? (
        <img
          src={src}
          alt={nombre ?? "Repuesto"}
          loading="lazy"
          className={esFoto ? "absolute inset-0 h-full w-full object-cover" : `relative object-contain transition duration-500 group-hover:scale-105 ${size === "sm" ? "h-11 w-11" : "h-[82%] w-[82%]"}`}
        />
      ) : (
        <CategoriaIcono slug={slug} className={`${icon} relative drop-shadow-[0_6px_20px_rgba(0,0,0,0.5)]`} />
      )}
      {sku && size !== "sm" && <span className="mono absolute bottom-2 left-2.5 rounded bg-black/30 px-1.5 text-[10px] text-white/60">{sku}</span>}
    </div>
  );
}

export function StockBadge({ stock, minimo }: { stock: number; minimo?: number }) {
  if (stock <= 0) return <span className="chip border-danger/30 bg-danger/10 text-danger">Agotado</span>;
  if (minimo !== undefined && stock <= minimo) return <span className="chip border-warn/30 bg-warn/10 text-warn">Bajo · {stock}</span>;
  return <span className="chip border-ok/25 bg-ok/10 text-ok">{stock} disp.</span>;
}

const ESTADOS: Record<EstadoPedido, string> = {
  pagado: "border-ok/30 bg-ok/10 text-ok",
  pendiente: "border-warn/30 bg-warn/10 text-warn",
  rechazado: "border-danger/30 bg-danger/10 text-danger",
  anulado: "border-ink-500 bg-ink-700 text-ink-300",
  error: "border-danger/30 bg-danger/10 text-danger",
};
export const EstadoBadge = ({ estado }: { estado: EstadoPedido }) => (
  <span className={`chip capitalize ${ESTADOS[estado]}`}>{estado}</span>
);

export const Spinner = ({ className = "" }: { className?: string }) => <Loader2 className={`size-5 animate-spin text-signal ${className}`} />;

export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return <div className="flex items-center justify-center gap-3 py-20 text-sm text-ink-300"><Spinner />{texto}</div>;
}

export function Vacio({ titulo, children, icono }: { titulo: string; children?: ReactNode; icono?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-600 px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-ink-800 text-ink-300">{icono ?? <Package className="size-6" />}</div>
      <p className="font-display text-lg font-bold">{titulo}</p>
      {children && <div className="max-w-sm text-sm text-ink-300">{children}</div>}
    </div>
  );
}

export function ErrorBox({ mensaje }: { mensaje: string }) {
  return <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{mensaje}</div>;
}

export function Modal({ abierto, onClose, titulo, children, ancho = "max-w-lg" }: { abierto: boolean; onClose: () => void; titulo: string; children: ReactNode; ancho?: string }) {
  useEffect(() => {
    if (!abierto) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [abierto, onClose]);
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 pt-[8vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div className={`card animate-rise w-full ${ancho} bg-ink-850 p-6 shadow-2xl`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{titulo}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-300 hover:bg-ink-700 hover:text-ink-100" aria-label="Cerrar"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Paginacion({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  const nums = Array.from(new Set([1, page - 1, page, page + 1, pages])).filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return (
    <nav className="flex items-center justify-center gap-1.5 pt-6">
      <button className="btn-ghost px-3 py-2" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-ink-400">…</span>}
          <button onClick={() => onChange(n)} className={`mono size-9 rounded-lg text-sm transition ${n === page ? "bg-signal font-semibold text-ink-950" : "text-ink-200 hover:bg-ink-700"}`}>{n}</button>
        </span>
      ))}
      <button className="btn-ghost px-3 py-2" disabled={page >= pages} onClick={() => onChange(page + 1)}>Siguiente</button>
    </nav>
  );
}

export function Logo({ compacto = false, claro = false }: { compacto?: boolean; claro?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="size-9 shrink-0">
        <path d="M32 6l22.5 13v26L32 58 9.5 45V19z" fill="#e5322b" />
        <path d="M32 18l12 7v14l-12 7-12-7V25z" fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
        <circle cx="32" cy="32" r="4.5" fill="#fff" />
      </svg>
      {!compacto && (
        <span className="leading-none whitespace-nowrap">
          <span className={`block font-display text-[22px] font-black tracking-tight italic ${claro ? "text-white" : "text-ink-100"}`}>
            AUTOPART<span className="text-signal"> PRO</span>
          </span>
          <span className={`mt-1 block font-display text-[8px] font-bold tracking-[0.32em] ${claro ? "text-white/60" : "text-ink-400"}`}>REPUESTOS · INVENTARIO · VENTAS</span>
        </span>
      )}
    </span>
  );
}
