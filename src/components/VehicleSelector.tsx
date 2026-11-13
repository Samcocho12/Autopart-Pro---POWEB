import { useEffect, useMemo, useState } from "react";
import { CarFront, Search } from "lucide-react";
import { api } from "../lib/api";
import type { Marca, Modelo } from "../lib/types";
import type { Vehiculo } from "../context/VehicleContext";

interface Props {
  valor: Vehiculo | null;
  onBuscar: (v: Vehiculo | null) => void;
  variante?: "hero" | "sidebar";
}

/** Selector en cascada Marca → Modelo → Año. */
export default function VehicleSelector({ valor, onBuscar, variante = "sidebar" }: Props) {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [marcaId, setMarcaId] = useState<number | "">(valor?.marcaId ?? "");
  const [modeloId, setModeloId] = useState<number | "">(valor?.modeloId ?? "");
  const [anio, setAnio] = useState<number | "">(valor?.anio ?? "");

  useEffect(() => { api<Marca[]>("/vehiculos/marcas").then(setMarcas).catch(() => setMarcas([])); }, []);
  useEffect(() => {
    setMarcaId(valor?.marcaId ?? ""); setModeloId(valor?.modeloId ?? ""); setAnio(valor?.anio ?? "");
  }, [valor?.marcaId, valor?.modeloId, valor?.anio]);
  useEffect(() => {
    if (!marcaId) { setModelos([]); return; }
    api<Modelo[]>(`/vehiculos/marcas/${marcaId}/modelos`).then(setModelos).catch(() => setModelos([]));
  }, [marcaId]);

  const modelo = modelos.find((m) => m.id === modeloId);
  const anios = useMemo(() => {
    const desde = modelo?.anio_desde ?? 2000, hasta = modelo?.anio_hasta ?? new Date().getFullYear();
    return Array.from({ length: hasta - desde + 1 }, (_, i) => hasta - i);
  }, [modelo]);

  const buscar = () => {
    if (!marcaId) return onBuscar(null);
    const m = marcas.find((x) => x.id === marcaId)!;
    onBuscar({ marcaId: m.id, marca: m.nombre, modeloId: modelo?.id, modelo: modelo?.nombre, anio: anio || undefined });
  };

  const hero = variante === "hero";
  return (
    <div className={hero ? "grid gap-3 sm:grid-cols-[1fr_1fr_0.7fr_auto]" : "grid gap-3"}>
      <div>
        {!hero && <label className="label">Marca</label>}
        <select className="input" value={marcaId} onChange={(e) => { setMarcaId(e.target.value ? Number(e.target.value) : ""); setModeloId(""); setAnio(""); }}>
          <option value="">{hero ? "Marca del vehículo" : "Todas"}</option>
          {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
      </div>
      <div>
        {!hero && <label className="label">Modelo</label>}
        <select className="input" value={modeloId} disabled={!marcaId} onChange={(e) => { setModeloId(e.target.value ? Number(e.target.value) : ""); setAnio(""); }}>
          <option value="">{hero ? "Modelo" : "Todos"}</option>
          {modelos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
      </div>
      <div>
        {!hero && <label className="label">Año</label>}
        <select className="input mono" value={anio} disabled={!marcaId} onChange={(e) => setAnio(e.target.value ? Number(e.target.value) : "")}>
          <option value="">{hero ? "Año" : "Todos"}</option>
          {anios.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <button className={hero ? "btn-primary h-full min-h-11 px-6" : "btn-primary w-full"} onClick={buscar}>
        {hero ? <Search className="size-4" /> : <CarFront className="size-4" />}
        {hero ? "Buscar repuestos" : "Aplicar vehículo"}
      </button>
    </div>
  );
}
