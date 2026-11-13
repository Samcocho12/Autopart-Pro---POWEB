import { CatalogoModel } from "../models/CatalogoModel.js";
import { toInt } from "../utils/http.js";

export const CatalogoController = {
  async categorias(_req, res) { res.json(await CatalogoModel.categorias()); },
  async fabricantes(_req, res) { res.json(await CatalogoModel.fabricantes()); },
  async proveedores(_req, res) { res.json(await CatalogoModel.proveedores()); },
  async marcas(_req, res) { res.json(await CatalogoModel.marcasVehiculo()); },
  async modelos(req, res) { res.json(await CatalogoModel.modelosPorMarca(toInt(req.params.marcaId))); },
  async todosLosModelos(_req, res) { res.json(await CatalogoModel.todosLosModelos()); },
};
