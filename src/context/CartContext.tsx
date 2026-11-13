import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ProductoResumen } from "../lib/types";

export interface CartItem {
  id: number;
  sku: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria_slug: string;
  fabricante: string;
  cantidad: number;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  total: number;
  add: (p: ProductoResumen, cantidad?: number) => void;
  setQty: (id: number, cantidad: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "autopart.cart";

function load(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* sin almacenamiento */ }
  }, [items]);

  const value = useMemo<CartCtx>(() => ({
    items,
    count: items.reduce((s, i) => s + i.cantidad, 0),
    total: items.reduce((s, i) => s + i.precio * i.cantidad, 0),
    add: (p, cantidad = 1) => {
      setItems((prev) => {
        const ex = prev.find((i) => i.id === p.id);
        if (ex) return prev.map((i) => (i.id === p.id ? { ...i, cantidad: Math.min(i.stock, i.cantidad + cantidad) } : i));
        return [...prev, { id: p.id, sku: p.sku, nombre: p.nombre, precio: Number(p.precio_venta), stock: p.stock, categoria_slug: p.categoria_slug, fabricante: p.fabricante, cantidad: Math.min(p.stock, cantidad) }];
      });
      setOpen(true);
    },
    setQty: (id, cantidad) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, cantidad: Math.max(1, Math.min(i.stock, cantidad)) } : i))),
    remove: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
    clear: () => setItems([]),
    open,
    setOpen,
  }), [items, open]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart fuera de CartProvider");
  return c;
}
