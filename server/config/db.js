import mysql from "mysql2/promise";
import { env } from "./env.js";

/**
 * Pool de conexiones MySQL. En Vercel (serverless) cada instancia reutiliza
 * el pool mientras está "caliente", por eso se guarda en globalThis.
 */
function createPool() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL no está configurada (ej: mysql://usuario:clave@host:3306/autopart)");
  }
  const ssl = env.dbSsl
    ? env.dbSslCa
      ? { ca: env.dbSslCa.replace(/\\n/g, "\n"), rejectUnauthorized: true, minVersion: "TLSv1.2" }
      : { rejectUnauthorized: true, minVersion: "TLSv1.2" }
    : undefined;

  return mysql.createPool({
    // Se quitan parámetros como ?ssl-mode=REQUIRED (Aiven) que mysql2 no reconoce
    uri: env.databaseUrl.split("?")[0],
    ssl,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60000,
    enableKeepAlive: true,
    decimalNumbers: true,
    dateStrings: false,
    timezone: "-05:00",
  });
}

export function getPool() {
  if (!globalThis.__autopartPool) globalThis.__autopartPool = createPool();
  return globalThis.__autopartPool;
}

export async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

/** Ejecuta `fn(conn)` dentro de una transacción. */
export async function withTransaction(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
