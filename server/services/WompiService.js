import crypto from "node:crypto";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

/**
 * Integración con Wompi (Bancolombia) — Web Checkout.
 * Con llaves `pub_test_` / `prv_test_` todo opera en el entorno Sandbox.
 * Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/
 */
export class WompiService {
  static get configurado() {
    return Boolean(env.wompi.publicKey && env.wompi.integritySecret);
  }

  static get esSandbox() {
    return env.wompi.publicKey.startsWith("pub_test_");
  }

  static get apiBase() {
    return this.esSandbox ? "https://sandbox.wompi.co/v1" : "https://production.wompi.co/v1";
  }

  /** Firma de integridad: SHA256(referencia + montoEnCentavos + moneda + secretoIntegridad) */
  static firmaIntegridad(referencia, montoCentavos, moneda = "COP") {
    return sha256(`${referencia}${montoCentavos}${moneda}${env.wompi.integritySecret}`);
  }

  /** Datos que el frontend necesita para abrir el Web Checkout. */
  static datosCheckout({ referencia, total, email, redirectUrl }) {
    if (!this.configurado) throw new HttpError(503, "La pasarela Wompi no está configurada (WOMPI_PUBLIC_KEY / WOMPI_INTEGRITY_SECRET)");
    const amountInCents = Math.round(Number(total) * 100);
    const params = {
      "public-key": env.wompi.publicKey,
      currency: "COP",
      "amount-in-cents": String(amountInCents),
      reference: referencia,
      "signature:integrity": this.firmaIntegridad(referencia, amountInCents),
      "redirect-url": redirectUrl,
    };
    if (email) params["customer-data:email"] = email;
    return {
      sandbox: this.esSandbox,
      checkoutUrl: `https://checkout.wompi.co/p/?${new URLSearchParams(params).toString()}`,
      amountInCents,
      reference: referencia,
    };
  }

  /** Consulta una transacción en la API de Wompi (no requiere llave privada). */
  static async consultarTransaccion(id) {
    const res = await fetch(`${this.apiBase}/transactions/${encodeURIComponent(id)}`);
    if (!res.ok) throw new HttpError(502, `Wompi respondió ${res.status} al consultar la transacción`);
    const { data } = await res.json();
    return data;
  }

  /**
   * Verifica la firma de un evento (webhook). Wompi envía:
   * signature.properties (rutas dentro de `data`), signature.checksum y timestamp.
   * checksum = SHA256(valores_concatenados + timestamp + secretoEventos)
   */
  static verificarEvento(evento) {
    if (!env.wompi.eventsSecret) return false;
    const { signature, timestamp, data } = evento ?? {};
    if (!signature?.properties || !signature?.checksum) return false;
    const valores = signature.properties.map((ruta) => ruta.split(".").reduce((o, k) => o?.[k], data)).join("");
    const calculado = sha256(`${valores}${timestamp}${env.wompi.eventsSecret}`);
    const a = Buffer.from(calculado), b = Buffer.from(String(signature.checksum).toLowerCase());
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
}
