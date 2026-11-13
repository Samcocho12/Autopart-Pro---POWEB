import { useEffect, type ReactNode } from "react";
import {
  BatteryCharging, Car, CircleDot, Cog, Droplets, Filter, Loader2, Package, Settings2, Waves, X, Zap,
  type LucideIcon,
} from "lucide-react";
import type { EstadoPedido } from "../lib/types";

export const CATEGORIA_UI: Record<string, { icon: LucideIcon; tono: string }> = {
  frenos: { icon: CircleDot, tono: "from-red-500/25 to-orange-500/5 text-red-300" },
  filtros: { icon: Filter, tono: "from-sky-500/25 to-cyan-500/5 text-sky-300" },
  encendido: { icon: Zap, tono: "from-yellow-400/25 to-amber-500/5 text-yellow-300" },
  suspension: { icon: Waves, tono: "from-violet-500/25 to-indigo-500/5 text-violet-300" },
  motor: { icon: Cog, tono: "from-orange-500/30 to-amber-600/5 text-orange-300" },
  electrico: { icon: BatteryCharging, tono: "from-emerald-500/25 to-teal-500/5 text-emerald-300" },
  transmision: { icon: Settings2, tono: "from-slate-400/25 to-zinc-500/5 text-slate-200" },
  lubricantes: { icon: Droplets, tono: "from-amber-400/30 to-yellow-600/5 text-amber-200" },
  carroceria: { icon: Car, tono: "from-blue-500/25 to-sky-500/5 text-blue-300" },
};

export function CategoriaIcono({ slug, className = "size-5" }: { slug: string; className?: string }) {
  const Icon = CATEGORIA_UI[slug]?.icon ?? Package;
  return <Icon className={className} strokeWidth={1.75} />;
}

/** Imagen ilustrativa del producto basada en su categoría. */
export function ProductoVisual({ slug, sku, size = "md" }: { slug: string; sku?: string; size?: "sm" | "md" | "lg" }) {
  const ui = CATEGORIA_UI[slug];
  const dims = { sm: "h-14 w-14 rounded-xl", md: "aspect-[4/3] w-full rounded-xl", lg: "aspect-square w-full rounded-2xl" }[size];
  const icon = { sm: "size-6", md: "size-12", lg: "size-24" }[size];
  return (
    <div className={`relative grid shrink-0 place-items-center overflow-hidden bg-gradient-to-br ${ui?.tono ?? "from-ink-600 to-ink-800 text-ink-200"} ${dims}`}>
      <div className="grid-bg absolute inset-0 opacity-60" />
      <div className="absolute -right-6 -bottom-6 size-24 rounded-full border border-white/5" />
      <CategoriaIcono slug={slug} className={`${icon} relative drop-shadow-[0_6px_20px_rgba(0,0,0,0.5)]`} />
      {sku && size !== "sm" && <span className="mono absolute bottom-2 left-2.5 text-[10px] text-white/40">{sku}</span>}
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[8vh] backdrop-blur-sm" onMouseDown={onClose}>
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

export function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="size-8">
        <path d="M32 8l20.8 12v24L32 56 11.2 44V20z" fill="none" stroke="#ff6a1a" strokeWidth="5" strokeLinejoin="round" />
        <circle cx="32" cy="32" r="8" fill="#ff6a1a" />
      </svg>
      {!compacto && (
        <span className="font-display text-lg leading-none font-extrabold tracking-tight">
          AutoPart<span className="text-signal"> Pro</span>
        </span>
      )}
    </span>
  );
}
