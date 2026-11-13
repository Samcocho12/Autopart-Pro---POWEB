/**
 * Ilustración por tipo de repuesto (public/img/repuestos/*.svg).
 * Si el producto tiene `imagen_url` (foto real cargada desde el panel), se usa esa.
 */
const REGLAS: [RegExp, string][] = [
  [/pastillas de freno/i, "pastillas-freno"],
  [/disco de freno/i, "disco-freno"],
  [/bandas de freno/i, "bandas-freno"],
  [/bomba de freno/i, "bomba-freno"],
  [/l[ií]quido de frenos/i, "liquido-frenos"],
  [/filtro de aceite/i, "filtro-aceite"],
  [/filtro de cabina/i, "filtro-cabina"],
  [/filtro de aire/i, "filtro-aire"],
  [/filtro de combustible/i, "filtro-combustible"],
  [/cables de buj/i, "cables-bujia"],
  [/buj[ií]as/i, "bujias"],
  [/bobina/i, "bobina"],
  [/amortiguador/i, "amortiguador"],
  [/terminal de direcci/i, "terminal-direccion"],
  [/r[oó]tula/i, "rotula"],
  [/bujes/i, "bujes"],
  [/kit de distribuci/i, "kit-distribucion"],
  [/correa/i, "correa"],
  [/bomba de agua/i, "bomba-agua"],
  [/empaque de culata/i, "empaque-culata"],
  [/termostato/i, "termostato"],
  [/sensor de ox/i, "sensor-oxigeno"],
  [/alternador/i, "alternador"],
  [/motor de arranque/i, "motor-arranque"],
  [/sensor de posici|ckp/i, "sensor-ckp"],
  [/embrague/i, "embrague"],
  [/rodamiento/i, "rodamiento"],
  [/homocin/i, "homocinetica"],
  [/farola/i, "farola"],
  [/stop trasero/i, "stop"],
  [/espejo/i, "espejo"],
  [/plumillas/i, "plumillas"],
  [/led/i, "led"],
  [/bombillo/i, "bombillo"],
  [/bater[ií]a/i, "bateria"],
  [/refrigerante/i, "refrigerante"],
  [/aceite/i, "aceite"],
];

export function imagenProducto(nombre: string, imagenUrl?: string | null) {
  if (imagenUrl) return imagenUrl;
  const regla = REGLAS.find(([re]) => re.test(nombre));
  return `/img/repuestos/${regla ? regla[1] : "generico"}.svg`;
}
