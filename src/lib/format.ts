const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("es-CO");
const compact = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });

export const money = (n: number | string) => cop.format(Number(n) || 0);
export const number = (n: number | string) => num.format(Number(n) || 0);
export const compactMoney = (n: number | string) => `$${compact.format(Number(n) || 0)}`;

export const fecha = (d: string | null | undefined, conHora = true) =>
  d
    ? new Date(d).toLocaleString("es-CO", {
        day: "2-digit", month: "short", year: "numeric",
        ...(conHora ? { hour: "2-digit", minute: "2-digit" } : {}),
      })
    : "—";

/** Separa "Nombre — Marca Modelo años" en título y vehículo. */
export function partirNombre(nombre: string) {
  const [titulo, vehiculo] = nombre.split(" — ");
  return { titulo, vehiculo: vehiculo ?? null };
}
