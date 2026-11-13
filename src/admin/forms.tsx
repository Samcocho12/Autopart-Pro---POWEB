import { useEffect, useState, type FormEvent } from "react";
import { ErrorBox, Modal, Spinner } from "../components/ui";
import { api } from "../lib/api";
import type { Categoria, Fabricante, ModeloConMarca, ProductoDetalle, ProductoResumen, Proveedor } from "../lib/types";

interface Maestros { categorias: Categoria[]; fabricantes: Fabricante[]; proveedores: Proveedor[] }
let cache: Promise<Maestros> | null = null;
const maestros = () =>
  (cache ??= Promise.all([
    api<Categoria[]>("/categorias"),
    api<Fabricante[]>("/fabricantes"),
    api<Proveedor[]>("/admin/proveedores", { auth: true }),
  ]).then(([categorias, fabricantes, proveedores]) => ({ categorias, fabricantes, proveedores })));

/** Crear / editar producto. */
export function ProductoFormModal({ abierto, onClose, producto, onGuardado }: {
  abierto: boolean; onClose: () => void; producto?: ProductoDetalle | null; onGuardado: (p: ProductoDetalle) => void;
}) {
  const [m, setM] = useState<Maestros | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  useEffect(() => { if (abierto) maestros().then(setM).catch((e) => setError(e.message)); }, [abierto]);

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const body: Record<string, unknown> = {
      sku: d.sku.trim().toUpperCase(), nombre: d.nombre.trim(), descripcion: d.descripcion || null,
      categoria_id: Number(d.categoria_id), fabricante_id: Number(d.fabricante_id), proveedor_id: d.proveedor_id ? Number(d.proveedor_id) : null,
      precio_costo: Number(d.precio_costo || 0), precio_venta: Number(d.precio_venta), stock_minimo: Number(d.stock_minimo), ubicacion: d.ubicacion || null, imagen_url: d.imagen_url?.trim() || null,
    };
    if (!producto) body.stock = Number(d.stock || 0);
    setGuardando(true); setError(null);
    try {
      const r = producto
        ? await api<ProductoDetalle>(`/admin/productos/${producto.id}`, { method: "PUT", body, auth: true })
        : await api<ProductoDetalle>("/admin/productos", { method: "POST", body, auth: true });
      onGuardado(r);
      onClose();
    } catch (err) { setError((err as Error).message); } finally { setGuardando(false); }
  };

  return (
    <Modal abierto={abierto} onClose={onClose} titulo={producto ? "Editar producto" : "Nuevo producto"} ancho="max-w-2xl">
      {!m ? <div className="py-10 text-center"><Spinner className="mx-auto" /></div> : (
        <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2" key={producto?.id ?? "nuevo"}>
          <div><label className="label">SKU</label><input name="sku" required defaultValue={producto?.sku} className="input mono uppercase" placeholder="FRN-BRE-00001" /></div>
          <div><label className="label">Ubicación en bodega</label><input name="ubicacion" defaultValue={producto?.ubicacion ?? ""} className="input mono" placeholder="P1-E2-N3" /></div>
          <div className="sm:col-span-2"><label className="label">Nombre</label><input name="nombre" required defaultValue={producto?.nombre} className="input" placeholder="Pastillas de freno delanteras Brembo — Mazda 3 2014-2019" /></div>
          <div className="sm:col-span-2"><label className="label">Descripción</label><textarea name="descripcion" rows={3} defaultValue={producto?.descripcion ?? ""} className="input" /></div>
          <div><label className="label">Categoría</label>
            <select name="categoria_id" required className="input" defaultValue={producto?.categoria_id}>{m.categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
          <div><label className="label">Fabricante</label>
            <select name="fabricante_id" required className="input" defaultValue={producto?.fabricante_id}>{m.fabricantes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
          <div className="sm:col-span-2"><label className="label">Proveedor</label>
            <select name="proveedor_id" className="input" defaultValue={producto?.proveedor_id ?? ""}><option value="">—</option>{m.proveedores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
          <div><label className="label">Precio de costo</label><input name="precio_costo" type="number" min={0} step={100} defaultValue={producto?.precio_costo} className="input mono" /></div>
          <div><label className="label">Precio de venta (IVA incl.)</label><input name="precio_venta" type="number" min={0} step={100} required defaultValue={producto?.precio_venta} className="input mono" /></div>
          {!producto && <div><label className="label">Stock inicial</label><input name="stock" type="number" min={0} defaultValue={0} className="input mono" /></div>}
          <div><label className="label">Stock mínimo (alerta)</label><input name="stock_minimo" type="number" min={0} required defaultValue={producto?.stock_minimo ?? 5} className="input mono" /></div>
          <div className="sm:col-span-2"><label className="label">Foto del producto (URL, opcional)</label><input name="imagen_url" type="url" defaultValue={producto?.imagen_url ?? ""} className="input" placeholder="https://… — si se deja vacío se usa la ilustración del tipo de repuesto" /></div>
          {error && <div className="sm:col-span-2"><ErrorBox mensaje={error} /></div>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" disabled={guardando}>{guardando && <Spinner className="text-ink-950" />}Guardar</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/** Registrar entrada / salida / ajuste de inventario. */
export function MovimientoModal({ producto, tipoInicial = "entrada", cantidadInicial, onClose, onHecho }: {
  producto: Pick<ProductoResumen, "id" | "nombre" | "sku" | "stock"> | null;
  tipoInicial?: "entrada" | "salida" | "ajuste"; cantidadInicial?: number; onClose: () => void; onHecho: () => void;
}) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  useEffect(() => { setTipo(tipoInicial); setError(null); }, [producto, tipoInicial]);

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setGuardando(true); setError(null);
    try {
      await api("/admin/inventario/movimientos", { method: "POST", auth: true, body: { producto_id: producto!.id, tipo, cantidad: Number(d.get("cantidad")), motivo: d.get("motivo") } });
      onHecho(); onClose();
    } catch (err) { setError((err as Error).message); } finally { setGuardando(false); }
  };

  return (
    <Modal abierto={!!producto} onClose={onClose} titulo="Movimiento de inventario">
      {producto && (
        <form onSubmit={enviar} className="space-y-4">
          <div className="rounded-xl border border-ink-700 bg-ink-800/60 p-3 text-sm">
            <p className="font-medium">{producto.nombre.split(" — ")[0]}</p>
            <p className="mono text-xs text-ink-400">{producto.sku} · Stock actual: <span className="text-ink-100">{producto.stock}</span></p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["entrada", "salida", "ajuste"] as const).map((t) => (
              <button type="button" key={t} onClick={() => setTipo(t)} className={`rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition ${tipo === t ? "border-signal bg-signal/15 text-signal-soft" : "border-ink-600 text-ink-300 hover:border-ink-500"}`}>{t}</button>
            ))}
          </div>
          <div>
            <label className="label">{tipo === "ajuste" ? "Nuevo stock (conteo físico)" : "Cantidad"}</label>
            <input name="cantidad" type="number" min={tipo === "ajuste" ? 0 : 1} required defaultValue={cantidadInicial} className="input mono" autoFocus key={`${tipo}-${cantidadInicial}`} />
          </div>
          <div>
            <label className="label">Motivo</label>
            <input name="motivo" className="input" placeholder={tipo === "entrada" ? "Compra a proveedor, factura #…" : tipo === "salida" ? "Garantía, consumo interno…" : "Conteo físico"} />
          </div>
          {error && <ErrorBox mensaje={error} />}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" disabled={guardando}>{guardando && <Spinner className="text-ink-950" />}Registrar</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/** Agregar compatibilidad vehicular. */
export function CompatibilidadModal({ productoId, abierto, onClose, onHecho }: { productoId: number; abierto: boolean; onClose: () => void; onHecho: () => void }) {
  const [modelos, setModelos] = useState<ModeloConMarca[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (abierto && !modelos.length) api<ModeloConMarca[]>("/admin/modelos", { auth: true }).then(setModelos); }, [abierto, modelos.length]);
  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api(`/admin/productos/${productoId}/compatibilidades`, { method: "POST", auth: true, body: { ...d, modelo_id: Number(d.modelo_id), anio_desde: Number(d.anio_desde), anio_hasta: Number(d.anio_hasta) } });
      onHecho(); onClose();
    } catch (err) { setError((err as Error).message); }
  };
  return (
    <Modal abierto={abierto} onClose={onClose} titulo="Agregar compatibilidad">
      <form onSubmit={enviar} className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">Vehículo</label>
          <select name="modelo_id" required className="input">{modelos.map((m) => <option key={m.id} value={m.id}>{m.marca} {m.nombre}</option>)}</select></div>
        <div><label className="label">Año desde</label><input name="anio_desde" type="number" min={1980} max={2030} required className="input mono" /></div>
        <div><label className="label">Año hasta</label><input name="anio_hasta" type="number" min={1980} max={2030} required className="input mono" /></div>
        <div className="col-span-2"><label className="label">Motor (opcional)</label><input name="motor" className="input mono" placeholder="1.6L" /></div>
        {error && <div className="col-span-2"><ErrorBox mensaje={error} /></div>}
        <div className="col-span-2 flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary">Agregar</button></div>
      </form>
    </Modal>
  );
}
