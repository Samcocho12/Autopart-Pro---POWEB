# Manual de despliegue — AutoPart Pro

Arquitectura en producción:

```
GitHub (código) ──► Vercel ──┬── Frontend React (estático, CDN)
                             └── /api → Vercel Function (Node.js + Express MVC)
                                          │                    │
                                          ▼                    ▼
                         MySQL en la nube (TiDB Cloud     Wompi Sandbox
                         Starter, compatible MySQL)       (pagos de prueba)
```

| Componente | Servicio | Costo |
|---|---|---|
| Código fuente | GitHub | Gratis |
| Frontend + API | Vercel (Hobby) | Gratis |
| Base de datos MySQL | TiDB Cloud Starter (protocolo MySQL, 5 GiB gratis) — local: MySQL 8 / XAMPP | Gratis |
| Pasarela de pagos | Wompi — entorno Sandbox | Gratis |

---

## 1. Requisitos previos

- Node.js **20 o superior** y npm.
- Git y una cuenta de GitHub con el repositorio `autopart-pro`.
- Cuentas gratuitas en **Vercel**, **TiDB Cloud** (tidbcloud.com) y **Wompi** (comercios.wompi.co).

---

## 2. Ejecución local (desarrollo)

### 2.1 Instalar dependencias
```bash
git clone https://github.com/Samcocho12/autopart-pro.git
cd autopart-pro
npm install
```

### 2.2 Base de datos local
Con MySQL 8 instalado (o XAMPP/MariaDB):
```sql
CREATE DATABASE autopart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2.3 Variables de entorno
```bash
cp .env.example .env
```
Edita `.env` como mínimo con:
```
DATABASE_URL=mysql://root:tu_clave@localhost:3306/autopart
DB_SSL=false
JWT_SECRET=una-cadena-larga-y-aleatoria
```

### 2.4 Crear tablas y cargar datos de demostración
```bash
npm run db:setup
```
Crea las 13 tablas y 2 vistas, y carga 1.145 repuestos, 1.366 compatibilidades, 29 modelos de vehículo, 90 pedidos históricos y las alertas iniciales.
(Para regenerar los datos: `npm run db:seed` y luego `npm run db:setup`).

### 2.5 Levantar el proyecto
```bash
npm run dev
```
- Tienda: http://localhost:5173
- API: http://localhost:3001/api/health
- Panel: http://localhost:5173/admin

**Usuarios de prueba** (creados por el seed):

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@autopart.pro | `Admin123*` |
| Vendedor | vendedor@autopart.pro | `Vendedor123*` |

> Cambia estas contraseñas si el proyecto se usa fuera del ámbito académico.

---

## 3. Base de datos MySQL en la nube (TiDB Cloud Starter)

TiDB Cloud Starter es una base de datos **compatible con el protocolo y el SQL de MySQL**: el mismo `schema.sql`, el mismo driver `mysql2` y las mismas consultas funcionan sin cambios. Su plan gratuito no pide tarjeta.

1. Entra a **tidbcloud.com** → crea una cuenta → **Create Cluster** → tipo **Starter** (región AWS más cercana, p. ej. `us-east-1`).
2. Abre el cluster → botón **Connect**:
   - *Connect With*: **General** · *Operating System*: el tuyo.
   - Pulsa **Generate Password** y guárdala.
   - Copia los datos: host (`gateway01.us-east-1.prod.aws.tidbcloud.com`), puerto `4000`, usuario (`xxxxxxxx.root`).
3. Crea la base de datos desde **SQL Editor** del panel:
   ```sql
   CREATE DATABASE autopart;
   ```
4. Arma la URL de conexión y ponla en tu `.env` local:
   ```
   DATABASE_URL=mysql://xxxxxxxx.root:CLAVE@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/autopart
   DB_SSL=true
   DB_SSL_CA=
   ```
   TiDB usa un certificado público, así que `DB_SSL_CA` se deja vacío. Si la clave tiene caracteres especiales (`@ : / #`), codifícalos (`@` → `%40`).
5. Ejecuta `npm run db:setup` para crear las tablas y cargar los datos en la nube.

> **Alternativas MySQL:** cualquier MySQL 8 accesible por internet sirve (Railway, Aiven plan pago, un VPS). Si el proveedor usa un certificado propio, pega su `ca.pem` en `DB_SSL_CA` en una sola línea:
> `awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' ca.pem`
> (El plan gratuito de Aiven for MySQL ya no admite servicios nuevos desde noviembre de 2026).

---

## 4. Wompi Sandbox

1. Regístrate en **comercios.wompi.co** y entra al panel.
2. Activa el modo **Sandbox / Pruebas** y abre **Desarrolladores**.
3. Copia las cuatro llaves:

| Variable | Dónde se ve en Wompi | Prefijo |
|---|---|---|
| `WOMPI_PUBLIC_KEY` | Llave pública | `pub_test_` |
| `WOMPI_PRIVATE_KEY` | Llave privada | `prv_test_` |
| `WOMPI_EVENTS_SECRET` | Secreto de *Eventos* | `test_events_` |
| `WOMPI_INTEGRITY_SECRET` | Secreto de *Integridad* | `test_integrity_` |

4. En **URL de Eventos** coloca (después del paso 5): `https://TU-PROYECTO.vercel.app/api/pagos/wompi/webhook`

**Datos de prueba Sandbox:**

| Método | Dato | Resultado |
|---|---|---|
| Tarjeta | `4242 4242 4242 4242`, fecha futura, CVC de 3 dígitos | APROBADA |
| Tarjeta | `4111 1111 1111 1111` | RECHAZADA |
| Nequi | `3991111111` | APROBADA |
| Nequi | `3992222222` | RECHAZADA |

---

## 5. Despliegue en Vercel

1. En **vercel.com** → *Add New… → Project* → importa `Samcocho12/autopart-pro`.
2. Vercel detecta **Vite** automáticamente (`vercel.json` ya define build, salida y rutas). No cambies nada.
3. En **Environment Variables** agrega:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | URL de TiDB Cloud (paso 3.4) |
| `DB_SSL` | `true` |
| `DB_SSL_CA` | Vacío en TiDB (solo si tu proveedor usa CA propia) |
| `JWT_SECRET` | Cadena aleatoria larga (`openssl rand -hex 32`) |
| `PUBLIC_SITE_URL` | `https://TU-PROYECTO.vercel.app` |
| `WOMPI_PUBLIC_KEY` | `pub_test_…` |
| `WOMPI_PRIVATE_KEY` | `prv_test_…` |
| `WOMPI_EVENTS_SECRET` | `test_events_…` |
| `WOMPI_INTEGRITY_SECRET` | `test_integrity_…` |

4. Pulsa **Deploy**. Cada `git push` a `main` vuelve a desplegar automáticamente.
5. Copia la URL final, actualiza `PUBLIC_SITE_URL` si cambió y configura la **URL de Eventos** en Wompi (paso 4.4). Haz *Redeploy* para aplicar variables nuevas.

### 5.1 Cómo funciona el enrutamiento (`vercel.json`)
- `/api/(.*)` → `api/index.js`, que exporta la app Express (`server/app.js`).
- Cualquier otra ruta → `index.html` (React Router maneja `/catalogo`, `/admin`, etc.).

---

## 6. Verificación posterior al despliegue

| Prueba | Resultado esperado |
|---|---|
| `GET https://TU-PROYECTO.vercel.app/api/health` | `{"ok":true,…}` |
| Inicio → elegir Chevrolet / Spark GT / 2015 → Buscar | Lista de repuestos compatibles |
| Agregar al carrito → Finalizar compra → pagar con `4242…` | Página "¡Pago aprobado!" |
| Panel → Pedidos | El pedido aparece como **pagado** |
| Panel → Kardex | Movimiento tipo **venta** con el stock descontado |
| Panel → Alertas → Reponer | La alerta pasa a **atendida** al superar el mínimo |

---

## 7. Solución de problemas

| Síntoma | Causa probable / solución |
|---|---|
| `DATABASE_URL no está configurada` | Falta la variable en Vercel o en `.env` |
| `self-signed certificate` / `HANDSHAKE_SSL_ERROR` | Proveedor con CA propia: copia su `ca.pem` en `DB_SSL_CA` con `\n` en lugar de saltos de línea |
| `Connections using insecure transport are prohibited` | Falta `DB_SSL=true` |
| `Access denied` en TiDB | El usuario lleva prefijo (`xxxxxxxx.root`) y la clave debe ir codificada en la URL |
| `La pasarela Wompi no está configurada` (503) | Faltan `WOMPI_PUBLIC_KEY` o `WOMPI_INTEGRITY_SECRET` |
| Wompi muestra "firma inválida" | `WOMPI_INTEGRITY_SECRET` no corresponde a la llave pública usada |
| Pedido queda en "pendiente" | El webhook no está configurado; igual se actualiza al volver a `/pago/resultado` |
| `401 Firma del evento inválida` en el webhook | `WOMPI_EVENTS_SECRET` incorrecto |
| 404 al recargar `/catalogo` | Falta `vercel.json` en la raíz del repo |

---

## 8. Estructura del repositorio

```
autopart-pro/
├── api/index.js               # Entrada de Vercel Functions
├── server/                    # Backend MVC
│   ├── app.js / index.js
│   ├── config/  (env.js, db.js)
│   ├── models/  (Producto, Inventario, Pedido, Catalogo, Usuario, Dashboard)
│   ├── controllers/
│   ├── routes/index.js
│   ├── middlewares/ (auth.js, errorHandler.js)
│   ├── services/WompiService.js
│   └── utils/http.js
├── src/                       # Frontend React + TypeScript + Tailwind
│   ├── pages/  (tienda)   admin/ (panel)
│   ├── components/  context/  lib/
├── database/
│   ├── schema.sql  seed.sql  generate-seed.mjs  setup.mjs
├── docs/                      # Documentación entregable
├── vercel.json  .env.example  package.json
```
