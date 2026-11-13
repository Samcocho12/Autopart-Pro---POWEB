-- =============================================================
--  AutoPart Pro — Esquema de base de datos (MySQL 8.x / compatible TiDB)
--  Sistema de Inventario Inteligente y Ventas de repuestos
-- =============================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW  IF EXISTS vw_alertas_stock;
DROP VIEW  IF EXISTS vw_productos_catalogo;
DROP TABLE IF EXISTS alertas_stock;
DROP TABLE IF EXISTS detalle_pedido;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS movimientos_inventario;
DROP TABLE IF EXISTS compatibilidades;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS modelos_vehiculo;
DROP TABLE IF EXISTS marcas_vehiculo;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS fabricantes;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS usuarios;

SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------------
-- Usuarios internos (administradores / vendedores)
-- -------------------------------------------------------------
CREATE TABLE usuarios (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(100)  NOT NULL,
  email          VARCHAR(150)  NOT NULL,
  password_hash  VARCHAR(255)  NOT NULL,
  rol            ENUM('admin','vendedor') NOT NULL DEFAULT 'vendedor',
  activo         TINYINT(1)    NOT NULL DEFAULT 1,
  creado_en      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Clientes (compradores de la tienda)
-- -------------------------------------------------------------
CREATE TABLE clientes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(120) NOT NULL,
  documento   VARCHAR(20)  NOT NULL,
  email       VARCHAR(150) NOT NULL,
  telefono    VARCHAR(20)  NOT NULL,
  direccion   VARCHAR(200) NOT NULL,
  ciudad      VARCHAR(80)  NOT NULL,
  creado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_clientes_email (email),
  KEY idx_clientes_documento (documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Catálogos maestros
-- -------------------------------------------------------------
CREATE TABLE categorias (
  id           SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(80)  NOT NULL,
  slug         VARCHAR(80)  NOT NULL,
  descripcion  VARCHAR(255) NULL,
  UNIQUE KEY uq_categorias_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE fabricantes (
  id       SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre   VARCHAR(80) NOT NULL,
  pais     VARCHAR(60) NULL,
  UNIQUE KEY uq_fabricantes_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE proveedores (
  id        SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(120) NOT NULL,
  nit       VARCHAR(20)  NOT NULL,
  telefono  VARCHAR(20)  NULL,
  email     VARCHAR(150) NULL,
  ciudad    VARCHAR(80)  NULL,
  UNIQUE KEY uq_proveedores_nit (nit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE marcas_vehiculo (
  id      SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(60) NOT NULL,
  UNIQUE KEY uq_marcas_vehiculo_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE modelos_vehiculo (
  id        SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id  SMALLINT UNSIGNED NOT NULL,
  nombre    VARCHAR(60) NOT NULL,
  UNIQUE KEY uq_modelo_marca (marca_id, nombre),
  CONSTRAINT fk_modelos_marca FOREIGN KEY (marca_id)
    REFERENCES marcas_vehiculo(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Productos (repuestos)
-- -------------------------------------------------------------
CREATE TABLE productos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sku             VARCHAR(30)   NOT NULL,
  nombre          VARCHAR(150)  NOT NULL,
  descripcion     TEXT          NULL,
  categoria_id    SMALLINT UNSIGNED NOT NULL,
  fabricante_id   SMALLINT UNSIGNED NOT NULL,
  proveedor_id    SMALLINT UNSIGNED NULL,
  precio_costo    DECIMAL(12,2) NOT NULL DEFAULT 0,
  precio_venta    DECIMAL(12,2) NOT NULL,
  stock           INT           NOT NULL DEFAULT 0,
  stock_minimo    INT           NOT NULL DEFAULT 5,
  ubicacion       VARCHAR(30)   NULL COMMENT 'Pasillo-Estante-Nivel en bodega',
  imagen_url      VARCHAR(500)  NULL,
  activo          TINYINT(1)    NOT NULL DEFAULT 1,
  creado_en       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_productos_sku (sku),
  KEY idx_productos_categoria (categoria_id),
  KEY idx_productos_fabricante (fabricante_id),
  KEY idx_productos_stock (stock, stock_minimo),
  KEY idx_productos_nombre (nombre),
  CONSTRAINT chk_productos_precio CHECK (precio_venta >= 0),
  CONSTRAINT chk_productos_stock  CHECK (stock >= 0),
  CONSTRAINT fk_productos_categoria  FOREIGN KEY (categoria_id)  REFERENCES categorias(id)  ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_productos_fabricante FOREIGN KEY (fabricante_id) REFERENCES fabricantes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_productos_proveedor  FOREIGN KEY (proveedor_id)  REFERENCES proveedores(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Compatibilidad producto ↔ vehículo (marca / modelo / rango de años)
-- -------------------------------------------------------------
CREATE TABLE compatibilidades (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id  INT UNSIGNED      NOT NULL,
  modelo_id    SMALLINT UNSIGNED NOT NULL,
  anio_desde   SMALLINT UNSIGNED NOT NULL,
  anio_hasta   SMALLINT UNSIGNED NOT NULL,
  motor        VARCHAR(40)       NULL,
  KEY idx_compat_busqueda (modelo_id, anio_desde, anio_hasta),
  KEY idx_compat_producto (producto_id),
  CONSTRAINT chk_compat_anios CHECK (anio_hasta >= anio_desde),
  CONSTRAINT fk_compat_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_compat_modelo   FOREIGN KEY (modelo_id)   REFERENCES modelos_vehiculo(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Kardex: movimientos de inventario
-- -------------------------------------------------------------
CREATE TABLE movimientos_inventario (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id       INT UNSIGNED NOT NULL,
  usuario_id        INT UNSIGNED NULL,
  pedido_id         INT UNSIGNED NULL,
  tipo              ENUM('entrada','salida','ajuste','venta') NOT NULL,
  cantidad          INT          NOT NULL,
  stock_anterior    INT          NOT NULL,
  stock_resultante  INT          NOT NULL,
  motivo            VARCHAR(255) NULL,
  creado_en         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mov_producto (producto_id, creado_en),
  CONSTRAINT fk_mov_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_mov_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Pedidos y detalle
-- -------------------------------------------------------------
CREATE TABLE pedidos (
  id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  referencia             VARCHAR(40)   NOT NULL,
  cliente_id             INT UNSIGNED  NOT NULL,
  subtotal               DECIMAL(12,2) NOT NULL,
  iva                    DECIMAL(12,2) NOT NULL,
  total                  DECIMAL(12,2) NOT NULL,
  estado                 ENUM('pendiente','pagado','rechazado','anulado','error') NOT NULL DEFAULT 'pendiente',
  metodo_pago            VARCHAR(30)   NULL,
  wompi_transaction_id   VARCHAR(60)   NULL,
  creado_en              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pagado_en              DATETIME      NULL,
  UNIQUE KEY uq_pedidos_referencia (referencia),
  KEY idx_pedidos_estado (estado, creado_en),
  CONSTRAINT fk_pedidos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE detalle_pedido (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pedido_id        INT UNSIGNED  NOT NULL,
  producto_id      INT UNSIGNED  NOT NULL,
  cantidad         INT UNSIGNED  NOT NULL,
  precio_unitario  DECIMAL(12,2) NOT NULL,
  subtotal         DECIMAL(12,2) NOT NULL,
  KEY idx_detalle_pedido (pedido_id),
  CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0),
  CONSTRAINT fk_detalle_pedido   FOREIGN KEY (pedido_id)   REFERENCES pedidos(id)   ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE movimientos_inventario
  ADD CONSTRAINT fk_mov_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- -------------------------------------------------------------
-- Alertas de stock mínimo
-- -------------------------------------------------------------
CREATE TABLE alertas_stock (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id    INT UNSIGNED NOT NULL,
  stock_actual   INT          NOT NULL,
  stock_minimo   INT          NOT NULL,
  nivel          ENUM('bajo','agotado') NOT NULL,
  estado         ENUM('activa','atendida') NOT NULL DEFAULT 'activa',
  creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atendida_en    DATETIME     NULL,
  KEY idx_alertas_estado (estado, nivel),
  KEY idx_alertas_producto (producto_id, estado),
  CONSTRAINT fk_alertas_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Vistas
-- -------------------------------------------------------------
CREATE VIEW vw_productos_catalogo AS
SELECT p.id, p.sku, p.nombre, p.descripcion, p.precio_venta, p.stock, p.stock_minimo,
       p.imagen_url, p.activo, p.ubicacion,
       c.id AS categoria_id, c.nombre AS categoria, c.slug AS categoria_slug,
       f.id AS fabricante_id, f.nombre AS fabricante
FROM productos p
JOIN categorias  c ON c.id = p.categoria_id
JOIN fabricantes f ON f.id = p.fabricante_id;

CREATE VIEW vw_alertas_stock AS
SELECT p.id AS producto_id, p.sku, p.nombre, p.stock, p.stock_minimo, p.ubicacion,
       c.nombre AS categoria,
       CASE WHEN p.stock = 0 THEN 'agotado' ELSE 'bajo' END AS nivel,
       (p.stock_minimo * 2 - p.stock) AS sugerido_reponer
FROM productos p
JOIN categorias c ON c.id = p.categoria_id
WHERE p.activo = 1 AND p.stock <= p.stock_minimo;
