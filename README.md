# AutoPart Pro

**Sistema de Inventario Inteligente y Ventas de repuestos automotrices.**
Proyecto final — Programación orientada a la Web.

Tienda en línea con buscador por **marca, modelo y año**, panel administrativo con **alertas de stock mínimo**, kardex de inventario y pago en línea con **Wompi Sandbox**.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS 4 + React Router + Recharts |
| Backend | Node.js + Express 5 — API REST con arquitectura **MVC** |
| Base de datos | **MySQL 8** (relacional, 13 tablas + 2 vistas) vía `mysql2` |
| Pagos | Wompi Web Checkout — entorno Sandbox (firma de integridad + webhook firmado) |
| Despliegue | GitHub → Vercel (frontend + Vercel Functions) · MySQL en TiDB Cloud Starter |

## Funcionalidades

**Tienda**
- Buscador avanzado: marca → modelo → año, texto libre, categoría, fabricante, precio, solo con stock y ordenamiento.
- "Mi vehículo" persistente: la ficha de producto indica si el repuesto es compatible con tu carro.
- Carrito, checkout con cálculo de IVA y redirección al checkout de Wompi; página de resultado que confirma el pago con Wompi.

**Panel administrativo** (`/admin`)
- Dashboard: ventas 30 días, ticket promedio, stock bajo/agotado, gráfica de ventas diarias, ventas por categoría, más vendidos.
- Inventario: CRUD de productos, márgenes, filtros, compatibilidades vehiculares.
- Alertas de stock mínimo automáticas: se crean al bajar del mínimo y se cierran solas al reponer; botón "Reponer" con cantidad sugerida.
- Kardex: trazabilidad de entradas, salidas, ajustes y ventas.
- Pedidos: filtros por estado, detalle con transacción Wompi.
- Roles `admin` y `vendedor` con JWT.

## Inicio rápido

```bash
npm install
cp .env.example .env        # configura DATABASE_URL y JWT_SECRET
npm run db:setup            # crea tablas y carga 1.145 repuestos de demostración
npm run dev                 # tienda en :5173, API en :3001
```

Usuarios de prueba: `admin@autopart.pro` / `Admin123*` · `vendedor@autopart.pro` / `Vendedor123*`

## Documentación

| Documento | Contenido |
|---|---|
| [Diccionario de datos](docs/01-diccionario-de-datos.md) | Modelo E-R, tablas, campos, tipos, restricciones y reglas de negocio |
| [Diagrama de clases](docs/02-diagrama-de-clases.md) | Clases MVC, entidades del dominio y secuencia de pago |
| [Manual de despliegue](docs/03-manual-de-despliegue.md) | Local, MySQL en la nube (TiDB), Wompi Sandbox y Vercel paso a paso |
| [API REST](docs/04-api-rest.md) | Endpoints, parámetros y ejemplos |

## Scripts

| Comando | Acción |
|---|---|
| `npm run dev` | API + frontend en modo desarrollo |
| `npm run build` | Compila TypeScript y genera `dist/` |
| `npm run db:setup` | Ejecuta `schema.sql` + `seed.sql` en `DATABASE_URL` |
| `npm run db:seed` | Regenera `database/seed.sql` |
| `npm start` | Inicia solo la API |
