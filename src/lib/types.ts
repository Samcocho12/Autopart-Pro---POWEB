export interface ProductoResumen {
  id: number;
  sku: string;
  nombre: string;
  precio_venta: number;
  stock: number;
  stock_minimo?: number;
  imagen_url?: string | null;
  activo?: number;
  ubicacion?: string | null;
  categoria: string;
  categoria_slug: string;
  categoria_id?: number;
  fabricante: string;
  fabricante_id?: number;
  precio_costo?: number;
  proveedor_id?: number | null;
  vehiculo_compatible?: string | null;
}

export interface Compatibilidad {
  id: number;
  anio_desde: number;
  anio_hasta: number;
  motor: string | null;
  modelo_id: number;
  modelo: string;
  marca_id: number;
  marca: string;
}

export interface Movimiento {
  id: number;
  tipo: "entrada" | "salida" | "ajuste" | "venta";
  cantidad: number;
  stock_anterior: number;
  stock_resultante: number;
  motivo: string | null;
  creado_en: string;
  producto_id: number;
  sku: string;
  producto: string;
  usuario: string | null;
  pedido: string | null;
}

export interface ProductoDetalle extends ProductoResumen {
  descripcion: string | null;
  fabricante_pais?: string;
  proveedor?: string | null;
  compatibilidades: Compatibilidad[];
  relacionados?: ProductoResumen[];
  movimientos?: Movimiento[];
}

export interface Pagina<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  facetas?: { categorias: { slug: string; nombre: string; total: number }[] };
}

export interface Categoria { id: number; nombre: string; slug: string; descripcion: string; productos: number }
export interface Fabricante { id: number; nombre: string; pais: string }
export interface Proveedor { id: number; nombre: string; nit: string; ciudad: string }
export interface Marca { id: number; nombre: string; modelos: number }
export interface Modelo { id: number; nombre: string; anio_desde: number | null; anio_hasta: number | null }
export interface ModeloConMarca { id: number; nombre: string; marca_id: number; marca: string }

export interface Alerta {
  id: number;
  nivel: "bajo" | "agotado";
  estado: "activa" | "atendida";
  creado_en: string;
  atendida_en: string | null;
  producto_id: number;
  sku: string;
  nombre: string;
  stock: number;
  stock_minimo: number;
  ubicacion: string | null;
  categoria: string;
  proveedor: string | null;
  sugerido_reponer: number;
}

export type EstadoPedido = "pendiente" | "pagado" | "rechazado" | "anulado" | "error";

export interface PedidoFila {
  id: number;
  referencia: string;
  total: number;
  estado: EstadoPedido;
  metodo_pago: string | null;
  creado_en: string;
  pagado_en: string | null;
  cliente: string;
  ciudad?: string;
  unidades?: number;
}

export interface PedidoDetalle extends PedidoFila {
  subtotal: number;
  iva: number;
  email: string;
  telefono: string;
  documento: string;
  direccion: string;
  wompi_transaction_id: string | null;
  items: { producto_id: number; cantidad: number; precio_unitario: number; subtotal: number; sku: string; nombre: string }[];
}

export interface Usuario { id: number; nombre: string; email: string; rol: "admin" | "vendedor" }

export interface Dashboard {
  kpi: { ventas_30d: number; pedidos_30d: number; pendientes: number; ticket_promedio: number };
  inventario: { referencias: number; unidades: number; valor_costo: number; agotados: number; bajos: number };
  ventasDia: { dia: string; total: number; pedidos: number }[];
  topProductos: { id: number; sku: string; nombre: string; unidades: number; total: number }[];
  porCategoria: { categoria: string; total: number }[];
  recientes: PedidoFila[];
}
