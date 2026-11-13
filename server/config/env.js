import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: process.env.DATABASE_URL ?? "",
  dbSsl: (process.env.DB_SSL ?? "false").toLowerCase() === "true",
  dbSslCa: process.env.DB_SSL_CA ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-cambiar-en-produccion",
  publicSiteUrl: process.env.PUBLIC_SITE_URL ?? "",
  wompi: {
    publicKey: process.env.WOMPI_PUBLIC_KEY ?? "",
    privateKey: process.env.WOMPI_PRIVATE_KEY ?? "",
    eventsSecret: process.env.WOMPI_EVENTS_SECRET ?? "",
    integritySecret: process.env.WOMPI_INTEGRITY_SECRET ?? "",
  },
};

if (env.nodeEnv === "production" && env.jwtSecret.startsWith("dev-")) {
  console.warn("[AutoPart] JWT_SECRET no está configurado. Define uno seguro en Vercel.");
}
