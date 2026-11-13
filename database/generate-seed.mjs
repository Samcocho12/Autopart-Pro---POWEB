// Genera database/seed.sql con datos de demostración realistas.
// Uso: node database/generate-seed.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import bcrypt from "bcryptjs";

const here = dirname(fileURLToPath(import.meta.url));

// PRNG determinístico para que el seed sea reproducible
let seed = 20261113;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const q = (v) => (v === null || v === undefined ? "NULL" : typeof v === "number" ? String(v) : `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`);

const categorias = [
  ["Frenos", "frenos", "Pastillas, discos, bandas y componentes hidráulicos"],
  ["Filtros", "filtros", "Filtros de aceite, aire, combustible y cabina"],
  ["Encendido", "encendido", "Bujías, bobinas y cables de alta"],
  ["Suspensión y dirección", "suspension", "Amortiguadores, rótulas, terminales y bujes"],
  ["Motor", "motor", "Distribución, refrigeración, empaques y sensores"],
  ["Eléctrico", "electrico", "Baterías, alternadores, arranques e iluminación"],
  ["Transmisión", "transmision", "Embragues, rodamientos y homocinéticas"],
  ["Lubricantes", "lubricantes", "Aceites de motor, caja y refrigerantes"],
  ["Carrocería", "carroceria", "Farolas, stops, espejos y plumillas"],
];

const fabricantes = [
  ["Bosch", "Alemania"], ["NGK", "Japón"], ["Denso", "Japón"], ["Brembo", "Italia"], ["Monroe", "Estados Unidos"],
  ["Gabriel", "Estados Unidos"], ["Mann-Filter", "Alemania"], ["Fram", "Estados Unidos"], ["Valeo", "Francia"],
  ["LuK", "Alemania"], ["SKF", "Suecia"], ["Gates", "Estados Unidos"], ["Mobil", "Estados Unidos"],
  ["Castrol", "Reino Unido"], ["Hella", "Alemania"], ["MAC", "Colombia"], ["Champion", "Estados Unidos"],
  ["TRW", "Alemania"], ["Moog", "Estados Unidos"], ["Sachs", "Alemania"], ["Philips", "Países Bajos"], ["Dayco", "Italia"],
];
const F = Object.fromEntries(fabricantes.map(([n], i) => [n, i + 1]));

const proveedores = [
  ["Distribuidora Autopartes del Caribe S.A.S.", "900123456-1", "6053581200", "ventas@autocaribe.co", "Barranquilla"],
  ["Importadora Repuestos Andinos Ltda.", "830456789-3", "6014235566", "pedidos@repandinos.co", "Bogotá"],
  ["Lubricantes y Filtros de Antioquia S.A.S.", "901234567-8", "6044448899", "comercial@lufiant.co", "Medellín"],
  ["Eléctricos Automotrices del Valle", "805987654-2", "6023336677", "info@electrovalle.co", "Cali"],
];

// marca -> [ [modelo, desde, hasta, motor] ]
const vehiculos = {
  Chevrolet: [["Spark GT", 2011, 2022, "1.2L"], ["Aveo", 2006, 2017, "1.6L"], ["Sail", 2011, 2020, "1.4L"], ["Onix", 2019, 2025, "1.0T"], ["Captiva", 2008, 2018, "2.4L"]],
  Renault: [["Logan", 2008, 2024, "1.6L"], ["Sandero", 2009, 2024, "1.6L"], ["Duster", 2012, 2025, "2.0L"], ["Kwid", 2018, 2025, "1.0L"]],
  Mazda: [["Mazda 2", 2010, 2025, "1.5L"], ["Mazda 3", 2010, 2025, "2.0L"], ["CX-5", 2013, 2025, "2.0L"]],
  Kia: [["Picanto", 2011, 2025, "1.25L"], ["Rio", 2012, 2023, "1.4L"], ["Sportage", 2011, 2025, "2.0L"]],
  Toyota: [["Corolla", 2009, 2025, "1.8L"], ["Hilux", 2006, 2025, "2.4L D"], ["Fortuner", 2008, 2025, "2.7L"], ["Yaris", 2008, 2022, "1.5L"]],
  Nissan: [["March", 2012, 2023, "1.6L"], ["Versa", 2012, 2025, "1.6L"], ["Frontier", 2010, 2025, "2.5L D"]],
  Hyundai: [["i10", 2009, 2024, "1.1L"], ["Accent", 2006, 2023, "1.4L"], ["Tucson", 2010, 2025, "2.0L"]],
  Volkswagen: [["Gol", 2009, 2023, "1.6L"], ["Jetta", 2008, 2018, "2.0L"]],
  Suzuki: [["Swift", 2011, 2025, "1.2L"], ["Vitara", 2016, 2025, "1.6L"]],
};
const marcasVeh = Object.keys(vehiculos);
const modelos = []; // {id, marca, nombre, desde, hasta, motor}
marcasVeh.forEach((m, i) => vehiculos[m].forEach(([n, d, h, mot]) => modelos.push({ id: modelos.length + 1, marcaId: i + 1, marca: m, nombre: n, desde: d, hasta: h, motor: mot, full: n.startsWith(m) ? n : `${m} ${n}` })));

// Plantillas de repuestos específicos por vehículo: [categoriaIdx, nombre, precioBase, fabricantes, descripcion]
const plantillas = [
  [0, "Pastillas de freno delanteras", 115000, ["Brembo", "Bosch", "TRW"], "Juego x4 de pastillas cerámicas de bajo polvo y baja emisión de ruido."],
  [0, "Disco de freno delantero", 165000, ["Brembo", "TRW"], "Disco ventilado en fundición gris de alta resistencia térmica. Precio por unidad."],
  [0, "Bandas de freno traseras", 98000, ["Bosch", "TRW"], "Juego de bandas con remaches y material libre de asbesto."],
  [0, "Bomba de freno principal", 285000, ["TRW", "Bosch"], "Cilindro maestro con depósito, probado a presión en fábrica."],
  [1, "Filtro de aceite", 28000, ["Mann-Filter", "Fram", "Bosch"], "Filtro con válvula antidrenaje y papel de celulosa de alta retención."],
  [1, "Filtro de aire de motor", 42000, ["Mann-Filter", "Fram", "Bosch"], "Elemento filtrante de papel plisado, retiene el 99,5% de partículas."],
  [1, "Filtro de combustible", 38000, ["Mann-Filter", "Bosch"], "Filtro en línea para sistemas de inyección electrónica."],
  [1, "Filtro de cabina (aire acondicionado)", 45000, ["Mann-Filter", "Bosch", "Valeo"], "Filtro con carbón activado que elimina olores y alérgenos."],
  [2, "Juego de bujías x4", 96000, ["NGK", "Denso", "Bosch", "Champion"], "Bujías de iridio con electrodo fino, mayor vida útil y arranque en frío."],
  [2, "Bobina de encendido", 210000, ["Bosch", "Denso", "NGK"], "Bobina tipo lápiz con conector original."],
  [2, "Juego de cables de bujía", 89000, ["NGK", "Bosch"], "Cables de silicona con núcleo supresor de interferencias."],
  [3, "Amortiguador delantero", 235000, ["Monroe", "Gabriel", "Sachs"], "Amortiguador a gas bitubo. Precio por unidad."],
  [3, "Amortiguador trasero", 195000, ["Monroe", "Gabriel", "Sachs"], "Amortiguador hidráulico de doble efecto. Precio por unidad."],
  [3, "Terminal de dirección", 68000, ["Moog", "TRW"], "Terminal con rótula engrasable y guardapolvo de neopreno."],
  [3, "Rótula inferior de suspensión", 82000, ["Moog", "TRW"], "Rótula forjada con tratamiento anticorrosión."],
  [3, "Kit de bujes de tijera", 74000, ["Moog"], "Juego de bujes de caucho-metal para tijera delantera."],
  [4, "Kit de distribución", 420000, ["Gates", "Dayco", "SKF"], "Correa, tensor y polea guía. Reemplazar cada 60.000 km."],
  [4, "Correa de accesorios", 62000, ["Gates", "Dayco"], "Correa poli-V EPDM resistente al calor."],
  [4, "Bomba de agua", 185000, ["Gates", "SKF", "Valeo"], "Bomba con impulsor metálico y empaque incluido."],
  [4, "Empaque de culata", 145000, ["Valeo", "Bosch"], "Empaque multicapa de acero (MLS)."],
  [4, "Termostato con carcasa", 98000, ["Gates", "Valeo"], "Termostato calibrado a temperatura de apertura original."],
  [4, "Sensor de oxígeno", 260000, ["Bosch", "Denso", "NGK"], "Sonda lambda calentada de 4 cables."],
  [5, "Alternador", 780000, ["Bosch", "Valeo", "Denso"], "Alternador remanufacturado con regulador incorporado."],
  [5, "Motor de arranque", 650000, ["Bosch", "Valeo", "Denso"], "Arranque con solenoide y piñón nuevos."],
  [5, "Sensor de posición del cigüeñal (CKP)", 120000, ["Bosch", "Denso"], "Sensor inductivo con cable y conector original."],
  [6, "Kit de embrague", 590000, ["LuK", "Sachs", "Valeo"], "Disco, prensa y balinera de empuje."],
  [6, "Rodamiento de rueda delantera", 135000, ["SKF", "Bosch"], "Rodamiento sellado de doble hilera de bolas."],
  [6, "Junta homocinética lado rueda", 210000, ["SKF", "TRW"], "Homocinética con guardapolvo, abrazaderas y grasa."],
  [8, "Farola delantera", 420000, ["Hella", "Valeo"], "Conjunto óptico con regulador de altura. Precio por unidad."],
  [8, "Stop trasero", 260000, ["Hella", "Valeo"], "Lámpara trasera con portabombillos. Precio por unidad."],
  [8, "Espejo retrovisor exterior", 190000, ["Hella", "Valeo"], "Espejo con ajuste manual y carcasa en negro."],
  [8, "Juego de plumillas", 58000, ["Bosch", "Valeo"], "Plumillas aerodinámicas de caucho natural x2."],
];

// Productos universales (sin compatibilidad específica)
const universales = [
  [7, "Aceite de motor sintético 5W-30 (1 cuarto)", 52000, ["Mobil", "Castrol"]],
  [7, "Aceite de motor semisintético 10W-40 (1 cuarto)", 38000, ["Mobil", "Castrol"]],
  [7, "Aceite de motor mineral 20W-50 (1 cuarto)", 29000, ["Mobil", "Castrol"]],
  [7, "Aceite de motor sintético 0W-20 (1 cuarto)", 58000, ["Mobil", "Castrol"]],
  [7, "Aceite de caja ATF Dexron VI (1 cuarto)", 46000, ["Mobil", "Castrol"]],
  [7, "Aceite de transmisión 75W-90 (1 cuarto)", 54000, ["Mobil", "Castrol"]],
  [7, "Refrigerante orgánico listo para usar (1 galón)", 48000, ["Mobil", "Castrol", "Bosch"]],
  [0, "Líquido de frenos DOT 4 (500 ml)", 26000, ["Bosch", "Castrol", "TRW"]],
  [5, "Batería 42ISD 950 (12V 55Ah)", 420000, ["MAC", "Bosch"]],
  [5, "Batería 24BD 1100 (12V 65Ah)", 495000, ["MAC", "Bosch"]],
  [5, "Batería 34ST 1150 (12V 70Ah)", 545000, ["MAC", "Bosch"]],
  [5, "Bombillo H4 halógeno 60/55W", 32000, ["Philips", "Hella", "Bosch"]],
  [5, "Bombillo H7 halógeno 55W", 34000, ["Philips", "Hella", "Bosch"]],
  [5, "Kit de bombillos LED H4 6000K", 165000, ["Philips", "Hella"]],
  [5, "Bombillo 1157 de stop (par)", 12000, ["Philips", "Hella"]],
];

const round100 = (n) => Math.round(n / 100) * 100;
const productos = [];
const compat = [];
const catPrefix = ["FRN", "FIL", "ENC", "SUS", "MOT", "ELE", "TRA", "LUB", "CAR"];

let seq = 0;
for (const [ci, nombre, base, fabs, desc] of plantillas) {
  for (const mod of modelos) {
    // 1 o 2 fabricantes por (plantilla, modelo)
    const nFab = rnd() < 0.35 ? 2 : 1;
    const usados = new Set();
    for (let k = 0; k < nFab; k++) {
      const fab = pick(fabs);
      if (usados.has(fab)) continue;
      usados.add(fab);
      seq++;
      const id = productos.length + 1;
      const premium = ["Brembo", "Bosch", "Denso", "Sachs", "SKF", "LuK", "Valeo"].includes(fab) ? 1.12 : 1;
      const precio = round100(base * premium * (0.85 + rnd() * 0.4));
      const stockMin = int(3, 10);
      const r = rnd();
      const stock = r < 0.05 ? 0 : r < 0.12 ? int(1, stockMin) : int(stockMin + 1, 70);
      // Rango de años: subrango del modelo
      const span = mod.hasta - mod.desde;
      const d = mod.desde + (rnd() < 0.5 ? 0 : int(0, Math.floor(span / 2)));
      const h = rnd() < 0.6 ? mod.hasta : Math.min(mod.hasta, d + int(4, 10));
      productos.push({
        id,
        sku: `${catPrefix[ci]}-${fab.slice(0, 3).toUpperCase()}-${String(seq).padStart(5, "0")}`,
        nombre: `${nombre} ${fab} — ${mod.full} ${d}-${h}`,
        descripcion: `${desc} Compatible con ${mod.full} ${mod.motor} (${d}-${h}). Referencia equivalente a original.`,
        categoria_id: ci + 1,
        fabricante_id: F[fab],
        proveedor_id: int(1, proveedores.length),
        precio_costo: round100(precio * (0.58 + rnd() * 0.12)),
        precio_venta: precio,
        stock,
        stock_minimo: stockMin,
        ubicacion: `P${int(1, 12)}-E${int(1, 8)}-N${int(1, 4)}`,
      });
      compat.push([id, mod.id, d, h, mod.motor]);
      // Algunos repuestos comparten plataforma con otro modelo de la misma marca
      if (rnd() < 0.25) {
        const hermanos = modelos.filter((m) => m.marcaId === mod.marcaId && m.id !== mod.id);
        if (hermanos.length) {
          const s = pick(hermanos);
          const sd = Math.max(s.desde, d - 2), sh = Math.min(s.hasta, h + 2);
          if (sh >= sd) {
            compat.push([id, s.id, sd, sh, s.motor]);
            productos[productos.length - 1].descripcion += ` También sirve para ${s.full} (${sd}-${sh}).`;
          }
        }
      }
    }
  }
}
for (const [ci, nombre, base, fabs] of universales) {
  for (const fab of fabs) {
    seq++;
    const precio = round100(base * (0.92 + rnd() * 0.2));
    const stockMin = int(6, 15);
    productos.push({
      id: productos.length + 1,
      sku: `${catPrefix[ci]}-${fab.slice(0, 3).toUpperCase()}-${String(seq).padStart(5, "0")}`,
      nombre: `${nombre} ${fab}`,
      descripcion: `${nombre}. Producto de uso general para múltiples marcas y modelos. Verifica la especificación en el manual de tu vehículo.`,
      categoria_id: ci + 1,
      fabricante_id: F[fab],
      proveedor_id: ci === 7 ? 3 : ci === 5 ? 4 : int(1, 4),
      precio_costo: round100(precio * 0.65),
      precio_venta: precio,
      stock: rnd() < 0.1 ? int(0, stockMin) : int(stockMin + 5, 120),
      stock_minimo: stockMin,
      ubicacion: `P${int(1, 12)}-E${int(1, 8)}-N${int(1, 4)}`,
    });
  }
}

// Usuarios de prueba
const adminHash = bcrypt.hashSync("Admin123*", 10);
const vendHash = bcrypt.hashSync("Vendedor123*", 10);

// Clientes y pedidos históricos (últimos 45 días) para el dashboard
const nombres = ["Andrés Gómez", "Laura Martínez", "Carlos Pérez", "Valentina Ríos", "Juan Esteban Díaz", "Mariana López", "Santiago Herrera", "Daniela Castro", "Felipe Moreno", "Camila Vargas", "Sebastián Rojas", "Natalia Suárez", "Diego Ramírez", "Paula Jiménez", "Alejandro Torres", "Isabella Cárdenas"];
const ciudades = ["Santa Marta", "Barranquilla", "Cartagena", "Bogotá", "Medellín", "Cali", "Bucaramanga"];
const clientes = nombres.map((n, i) => {
  const user = n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, ".");
  return [i + 1, n, String(int(10000000, 1199999999)), `${user}@correo.com`, `3${int(0, 2)}${int(10000000, 99999999)}`, `Calle ${int(1, 120)} # ${int(1, 90)}-${int(1, 99)}`, pick(ciudades)];
});

const pedidos = [], detalles = [], movs = [];
const now = new Date("2026-11-13T12:00:00-05:00");
const fmt = (d) => d.toISOString().slice(0, 19).replace("T", " ");
for (let i = 1; i <= 90; i++) {
  const d = new Date(now.getTime() - int(0, 45) * 86400000 - int(0, 50000) * 1000);
  const items = [];
  const n = int(1, 4);
  for (let k = 0; k < n; k++) {
    const p = pick(productos);
    if (items.find((x) => x.p.id === p.id)) continue;
    items.push({ p, c: int(1, 3) });
  }
  const total = items.reduce((s, x) => s + x.p.precio_venta * x.c, 0);
  const subtotal = Math.round((total / 1.19) * 100) / 100;
  const iva = Math.round((total - subtotal) * 100) / 100;
  const r = rnd();
  const estado = r < 0.82 ? "pagado" : r < 0.92 ? "rechazado" : "pendiente";
  const ref = `AP-${d.getTime().toString(36).toUpperCase()}-${String(i).padStart(3, "0")}`;
  pedidos.push([i, ref, int(1, clientes.length), subtotal, iva, total, estado, estado === "pendiente" ? null : pick(["CARD", "NEQUI", "PSE", "BANCOLOMBIA_TRANSFER"]), estado === "pendiente" ? null : `${int(10000, 99999)}-${int(1000000000, 1999999999)}-${int(10000, 99999)}`, fmt(d), estado === "pagado" ? fmt(new Date(d.getTime() + 60000)) : null]);
  for (const { p, c } of items) {
    detalles.push([i, p.id, c, p.precio_venta, p.precio_venta * c]);
    if (estado === "pagado") movs.push([p.id, null, i, "venta", -c, p.stock + c, p.stock, `Venta pedido ${ref}`, fmt(d)]);
  }
}

// Alertas activas iniciales coherentes con el stock
const alertas = productos.filter((p) => p.stock <= p.stock_minimo).map((p) => [p.id, p.stock, p.stock_minimo, p.stock === 0 ? "agotado" : "bajo"]);

// ---------- Construcción del SQL ----------
const out = [];
out.push("-- AutoPart Pro — datos de demostración (generado por database/generate-seed.mjs)");
out.push("SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;");
const insert = (table, cols, rows, chunk = 250) => {
  for (let i = 0; i < rows.length; i += chunk) {
    out.push(`INSERT INTO ${table} (${cols.join(", ")}) VALUES\n` + rows.slice(i, i + chunk).map((r) => "(" + r.map(q).join(", ") + ")").join(",\n") + ";");
  }
};
insert("usuarios", ["id", "nombre", "email", "password_hash", "rol"], [[1, "Administrador AutoPart", "admin@autopart.pro", adminHash, "admin"], [2, "Vendedor Mostrador", "vendedor@autopart.pro", vendHash, "vendedor"]]);
insert("categorias", ["id", "nombre", "slug", "descripcion"], categorias.map((c, i) => [i + 1, ...c]));
insert("fabricantes", ["id", "nombre", "pais"], fabricantes.map((f, i) => [i + 1, ...f]));
insert("proveedores", ["id", "nombre", "nit", "telefono", "email", "ciudad"], proveedores.map((p, i) => [i + 1, ...p]));
insert("marcas_vehiculo", ["id", "nombre"], marcasVeh.map((m, i) => [i + 1, m]));
insert("modelos_vehiculo", ["id", "marca_id", "nombre"], modelos.map((m) => [m.id, m.marcaId, m.nombre]));
insert("productos", ["id", "sku", "nombre", "descripcion", "categoria_id", "fabricante_id", "proveedor_id", "precio_costo", "precio_venta", "stock", "stock_minimo", "ubicacion"],
  productos.map((p) => [p.id, p.sku, p.nombre, p.descripcion, p.categoria_id, p.fabricante_id, p.proveedor_id, p.precio_costo, p.precio_venta, p.stock, p.stock_minimo, p.ubicacion]));
insert("compatibilidades", ["producto_id", "modelo_id", "anio_desde", "anio_hasta", "motor"], compat);
insert("clientes", ["id", "nombre", "documento", "email", "telefono", "direccion", "ciudad"], clientes);
insert("pedidos", ["id", "referencia", "cliente_id", "subtotal", "iva", "total", "estado", "metodo_pago", "wompi_transaction_id", "creado_en", "pagado_en"], pedidos);
insert("detalle_pedido", ["pedido_id", "producto_id", "cantidad", "precio_unitario", "subtotal"], detalles);
insert("movimientos_inventario", ["producto_id", "usuario_id", "pedido_id", "tipo", "cantidad", "stock_anterior", "stock_resultante", "motivo", "creado_en"], movs);
insert("alertas_stock", ["producto_id", "stock_actual", "stock_minimo", "nivel"], alertas);
out.push("SET FOREIGN_KEY_CHECKS = 1;");

writeFileSync(join(here, "seed.sql"), out.join("\n\n") + "\n");
console.log(`seed.sql generado: ${productos.length} productos, ${compat.length} compatibilidades, ${modelos.length} modelos, ${pedidos.length} pedidos, ${alertas.length} alertas.`);
