// Crea el esquema y carga los datos de demostración en la base indicada por DATABASE_URL.
// Uso: npm run db:setup        (esquema + datos)
//      npm run db:setup -- --solo-esquema
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mysql from "mysql2/promise";

const here = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;
if (!url) { console.error("Define DATABASE_URL en el archivo .env"); process.exit(1); }

const ssl = (process.env.DB_SSL ?? "false").toLowerCase() === "true"
  ? (process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n") } : { rejectUnauthorized: true, minVersion: "TLSv1.2" })
  : undefined;

const conn = await mysql.createConnection({ uri: url.split("?")[0], ssl, multipleStatements: true });
const archivos = process.argv.includes("--solo-esquema") ? ["schema.sql"] : ["schema.sql", "seed.sql"];
for (const f of archivos) {
  process.stdout.write(`Ejecutando ${f}… `);
  await conn.query(readFileSync(join(here, f), "utf8"));
  console.log("listo");
}
const [[r]] = await conn.query("SELECT (SELECT COUNT(*) FROM productos) AS productos, (SELECT COUNT(*) FROM compatibilidades) AS compatibilidades, (SELECT COUNT(*) FROM alertas_stock WHERE estado='activa') AS alertas");
console.log(`Base lista: ${r.productos} productos, ${r.compatibilidades} compatibilidades, ${r.alertas} alertas activas.`);
await conn.end();
