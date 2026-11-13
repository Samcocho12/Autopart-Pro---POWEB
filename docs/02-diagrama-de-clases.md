# Diagrama de clases — AutoPart Pro

La API sigue el patrón **MVC (Modelo–Vista–Controlador)**:

- **Modelo** (`server/models`): clases con métodos estáticos que encapsulan el SQL y las reglas de negocio.
- **Controlador** (`server/controllers`): recibe la petición HTTP, valida, invoca modelos/servicios y responde JSON.
- **Vista**: la SPA en React (`src/`) que consume la API REST.
- **Rutas** (`server/routes/index.js`) conectan URL → middleware → controlador.

## Diagrama general

```mermaid
classDiagram
    direction LR

    class Database {
        <<config/db.js>>
        +getPool() Pool
        +query(sql, params) rows
        +withTransaction(fn) any
    }

    class ProductoModel {
        +buscar(filtros, opciones) Pagina
        +obtener(id, opciones) Producto
        +relacionados(id, categoriaId, limit) Producto[]
        +crear(conn, datos) int
        +actualizar(id, datos) int
        +desactivar(id) int
        +agregarCompatibilidad(productoId, datos) int
        +eliminarCompatibilidad(id) int
    }

    class InventarioModel {
        +registrarMovimiento(conn, mov) Saldo
        +evaluarAlerta(conn, productoId, stock, minimo) void
        +movimientos(filtros) Movimiento[]
        +alertas(filtros) Alerta[]
        +marcarAtendida(id) int
    }

    class PedidoModel {
        +generarReferencia() string
        +crear(cliente, items) Pedido
        +porReferencia(ref) Pedido
        +porId(id) Pedido
        +items(pedidoId) DetallePedido[]
        +listar(filtros) Pagina
        +aplicarResultadoPago(resultado) Pedido
    }

    class CatalogoModel {
        +categorias() Categoria[]
        +fabricantes() Fabricante[]
        +proveedores() Proveedor[]
        +marcasVehiculo() Marca[]
        +modelosPorMarca(marcaId) Modelo[]
        +todosLosModelos() Modelo[]
    }

    class UsuarioModel {
        +porEmail(email) Usuario
        +porId(id) Usuario
        +verificarPassword(plano, hash) bool
    }

    class DashboardModel {
        +resumen() Dashboard
    }

    class WompiService {
        +configurado bool
        +esSandbox bool
        +apiBase string
        +firmaIntegridad(ref, centavos, moneda) string
        +datosCheckout(pedido) Checkout
        +consultarTransaccion(id) Transaccion
        +verificarEvento(evento) bool
    }

    class ProductoController {
        +buscar(req, res)
        +detalle(req, res)
        +buscarAdmin(req, res)
        +detalleAdmin(req, res)
        +crear(req, res)
        +actualizar(req, res)
        +eliminar(req, res)
        +agregarCompatibilidad(req, res)
        +eliminarCompatibilidad(req, res)
    }
    class InventarioController {
        +registrar(req, res)
        +movimientos(req, res)
        +alertas(req, res)
        +atender(req, res)
    }
    class PedidoController {
        +crear(req, res)
        +estado(req, res)
        +listar(req, res)
        +detalle(req, res)
    }
    class PagoController {
        +verificar(req, res)
        +webhook(req, res)
        +config(req, res)
    }
    class CatalogoController {
        +categorias(req, res)
        +fabricantes(req, res)
        +proveedores(req, res)
        +marcas(req, res)
        +modelos(req, res)
        +todosLosModelos(req, res)
    }
    class AuthController {
        +login(req, res)
        +me(req, res)
    }
    class DashboardController {
        +resumen(req, res)
    }

    class AuthMiddleware {
        <<middlewares/auth.js>>
        +signToken(usuario) string
        +requireAuth(req, res, next)
        +requireRole(roles) Middleware
    }

    ProductoController ..> ProductoModel
    ProductoController ..> InventarioModel
    InventarioController ..> InventarioModel
    PedidoController ..> PedidoModel
    PedidoController ..> WompiService
    PagoController ..> PedidoModel
    PagoController ..> WompiService
    CatalogoController ..> CatalogoModel
    AuthController ..> UsuarioModel
    AuthController ..> AuthMiddleware
    DashboardController ..> DashboardModel
    PedidoModel ..> InventarioModel : descuenta stock al pagar
    ProductoModel ..> Database
    InventarioModel ..> Database
    PedidoModel ..> Database
    CatalogoModel ..> Database
    UsuarioModel ..> Database
    DashboardModel ..> Database
```

## Entidades del dominio

```mermaid
classDiagram
    class Producto {
        +int id
        +string sku
        +string nombre
        +string descripcion
        +decimal precioCosto
        +decimal precioVenta
        +int stock
        +int stockMinimo
        +string ubicacion
        +bool activo
    }
    class Categoria {
        +int id
        +string nombre
        +string slug
    }
    class Fabricante {
        +int id
        +string nombre
        +string pais
    }
    class Proveedor {
        +int id
        +string nombre
        +string nit
    }
    class MarcaVehiculo {
        +int id
        +string nombre
    }
    class ModeloVehiculo {
        +int id
        +string nombre
    }
    class Compatibilidad {
        +int anioDesde
        +int anioHasta
        +string motor
    }
    class MovimientoInventario {
        +TipoMovimiento tipo
        +int cantidad
        +int stockAnterior
        +int stockResultante
        +string motivo
    }
    class AlertaStock {
        +NivelAlerta nivel
        +EstadoAlerta estado
    }
    class Cliente {
        +string nombre
        +string documento
        +string email
        +string telefono
        +string direccion
        +string ciudad
    }
    class Pedido {
        +string referencia
        +decimal subtotal
        +decimal iva
        +decimal total
        +EstadoPedido estado
        +string metodoPago
        +string wompiTransactionId
    }
    class DetallePedido {
        +int cantidad
        +decimal precioUnitario
        +decimal subtotal
    }
    class Usuario {
        +string nombre
        +string email
        +Rol rol
        +bool activo
    }

    class TipoMovimiento {
        <<enumeration>>
        entrada
        salida
        ajuste
        venta
    }
    class EstadoPedido {
        <<enumeration>>
        pendiente
        pagado
        rechazado
        anulado
        error
    }
    class Rol {
        <<enumeration>>
        admin
        vendedor
    }

    Categoria "1" --> "*" Producto
    Fabricante "1" --> "*" Producto
    Proveedor "0..1" --> "*" Producto
    MarcaVehiculo "1" *-- "*" ModeloVehiculo
    Producto "1" *-- "*" Compatibilidad
    ModeloVehiculo "1" --> "*" Compatibilidad
    Producto "1" *-- "*" MovimientoInventario
    Producto "1" --> "*" AlertaStock
    Usuario "0..1" --> "*" MovimientoInventario
    Cliente "1" --> "*" Pedido
    Pedido "1" *-- "1..*" DetallePedido
    Producto "1" --> "*" DetallePedido
    Pedido "0..1" --> "*" MovimientoInventario
```

## Flujo de compra con Wompi (secuencia)

```mermaid
sequenceDiagram
    actor C as Cliente
    participant UI as React (Checkout)
    participant API as API Node (PedidoController)
    participant DB as MySQL
    participant W as Wompi Sandbox

    C->>UI: Llena datos y pulsa "Pagar"
    UI->>API: POST /api/pedidos {cliente, items}
    API->>DB: Valida stock y precios, crea pedido "pendiente"
    API-->>UI: checkoutUrl firmada (SHA256 integridad)
    UI->>W: Redirección al Web Checkout
    C->>W: Paga (tarjeta 4242…, Nequi, PSE)
    W-->>API: POST /api/pagos/wompi/webhook (evento firmado)
    API->>DB: Verifica firma → pedido "pagado", descuenta stock, kardex, alertas
    W->>UI: Redirige a /pago/resultado?id=TX
    UI->>API: GET /api/pagos/wompi/verificar?id=TX
    API->>W: GET /v1/transactions/TX
    API-->>UI: Estado final del pedido
```

## Componentes del frontend (Vista)

| Capa | Archivos | Responsabilidad |
|---|---|---|
| Contextos | `CartContext`, `AuthContext`, `VehicleContext` | Estado global: carrito, sesión JWT, "Mi vehículo" |
| Tienda | `Home`, `Catalogo`, `Producto`, `Checkout`, `PagoResultado` | Búsqueda filtrada y compra |
| Panel | `Dashboard`, `Inventario`, `ProductoAdmin`, `Alertas`, `Movimientos`, `Pedidos` | Gestión de inventario y ventas |
| Componentes | `VehicleSelector`, `ProductCard`, `StoreLayout`, `ui.tsx` | Piezas reutilizables |
| Librería | `lib/api.ts`, `lib/format.ts`, `lib/useFetch.ts` | Cliente HTTP, formato COP, carga de datos |
