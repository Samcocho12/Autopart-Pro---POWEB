# Referencia de la API REST

Base: `/api` · Formato: JSON · Autenticación del panel: `Authorization: Bearer <JWT>` (8 h).

## Públicas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio |
| GET | `/categorias` | Categorías con número de productos |
| GET | `/fabricantes` | Fabricantes |
| GET | `/vehiculos/marcas` | Marcas de vehículo |
| GET | `/vehiculos/marcas/:marcaId/modelos` | Modelos de la marca con rango de años disponible |
| GET | `/productos` | **Búsqueda avanzada** (ver parámetros) |
| GET | `/productos/:id` | Detalle con compatibilidades y relacionados |
| POST | `/pedidos` | Crea pedido y devuelve la URL del checkout Wompi |
| GET | `/pedidos/:referencia` | Estado público del pedido |
| GET | `/pagos/config` | Indica si Wompi está configurado y si es Sandbox |
| GET | `/pagos/wompi/verificar?id=TX` | Consulta la transacción en Wompi y actualiza el pedido |
| POST | `/pagos/wompi/webhook` | Recibe eventos `transaction.updated` (firma SHA256 verificada) |
| POST | `/auth/login` | `{email, password}` → `{token, usuario}` |
| GET | `/auth/me` | Usuario autenticado |

### Parámetros de `GET /productos`

| Parámetro | Ejemplo | Efecto |
|---|---|---|
| `q` | `bujias ngk` | Cada palabra debe aparecer en nombre, SKU o fabricante (sin distinguir tildes) |
| `marca` | `3` | Compatibles con la marca de vehículo |
| `modelo` | `11` | Compatibles con el modelo |
| `anio` | `2018` | `anio BETWEEN anio_desde AND anio_hasta` |
| `categoria` | `frenos` | Slug de categoría |
| `fabricante` | `4` | Id del fabricante |
| `min`, `max` | `50000` | Rango de precio |
| `enStock` | `1` | Solo con existencias |
| `orden` | `precio_asc` · `precio_desc` · `recientes` · `stock` | Ordenamiento |
| `page`, `limit` | `2`, `24` | Paginación (máx. 100) |

Respuesta: `{ items, total, page, limit, pages, facetas: { categorias: [{slug, nombre, total}] } }`.

### Ejemplo `POST /pedidos`
```json
{
  "cliente": { "nombre": "Ana Ruiz", "documento": "1082...", "email": "ana@correo.com",
               "telefono": "3001234567", "direccion": "Cra 5 # 10-20", "ciudad": "Santa Marta" },
  "items": [ { "producto_id": 5, "cantidad": 2 } ]
}
```
Respuesta `201`:
```json
{
  "pedido": { "id": 91, "referencia": "AP-MWF7HNTR-068AG", "subtotal": 192100.84, "iva": 36499.16, "total": 228600 },
  "checkout": { "sandbox": true, "amountInCents": 22860000, "checkoutUrl": "https://checkout.wompi.co/p/?public-key=…&signature%3Aintegrity=…" }
}
```

## Administración (requieren JWT)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/admin/dashboard` | todos | KPIs, ventas por día, top productos |
| GET | `/admin/productos` | todos | Búsqueda con costo, `stockBajo=1`, `activo=0/1` |
| GET | `/admin/productos/:id` | todos | Detalle + kardex |
| POST | `/admin/productos` | admin | Crear (stock inicial genera movimiento de entrada) |
| PUT | `/admin/productos/:id` | admin | Editar (el stock no se edita aquí) |
| DELETE | `/admin/productos/:id` | admin | Borrado lógico |
| POST | `/admin/productos/:id/compatibilidades` | admin | `{modelo_id, anio_desde, anio_hasta, motor}` |
| DELETE | `/admin/compatibilidades/:id` | admin | Quitar compatibilidad |
| GET | `/admin/inventario/movimientos` | todos | Kardex (`producto_id`, `limit`) |
| POST | `/admin/inventario/movimientos` | todos | `{producto_id, tipo: entrada|salida|ajuste, cantidad, motivo}` |
| GET | `/admin/alertas` | todos | `estado=activa|atendida`, `nivel=bajo|agotado` |
| PATCH | `/admin/alertas/:id/atender` | todos | Cierra la alerta manualmente |
| GET | `/admin/pedidos` | todos | `estado`, `q`, paginación |
| GET | `/admin/pedidos/:id` | todos | Detalle con cliente e ítems |
| GET | `/admin/proveedores` · `/admin/modelos` | todos | Catálogos para formularios |

## Códigos de error
`400` datos inválidos · `401` sin sesión o firma inválida · `403` rol insuficiente · `404` no existe · `409` stock insuficiente o duplicado · `503` Wompi sin configurar.
