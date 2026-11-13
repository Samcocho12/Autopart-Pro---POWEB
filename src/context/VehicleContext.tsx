import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/** "Mi vehículo": selección persistente de marca / modelo / año. */
export interface Vehiculo {
  marcaId: number;
  marca: string;
  modeloId?: number;
  modelo?: string;
  anio?: number;
}

interface VehCtx {
  vehiculo: Vehiculo | null;
  setVehiculo: (v: Vehiculo | null) => void;
}

const Ctx = createContext<VehCtx | null>(null);
const KEY = "autopart.vehiculo";

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
  });
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(vehiculo)); } catch { /* sin almacenamiento */ }
  }, [vehiculo]);
  return <Ctx.Provider value={{ vehiculo, setVehiculo }}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useVehiculo() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useVehiculo fuera de VehicleProvider");
  return c;
}

/** "Mazda" + "Mazda 3" → "Mazda 3" (evita repetir la marca). */
export const nombreVehiculo = (marca?: string, modelo?: string) =>
  modelo ? (modelo.startsWith(marca ?? "\u0000") ? modelo : `${marca} ${modelo}`) : (marca ?? "");

export const etiquetaVehiculo = (v: Vehiculo | null) =>
  v ? [nombreVehiculo(v.marca, v.modelo), v.anio].filter(Boolean).join(" ") : "";

export const vehiculoParams = (v: Vehiculo | null) => {
  const p = new URLSearchParams();
  if (v?.marcaId) p.set("marca", String(v.marcaId));
  if (v?.modeloId) p.set("modelo", String(v.modeloId));
  if (v?.anio) p.set("anio", String(v.anio));
  return p;
};
