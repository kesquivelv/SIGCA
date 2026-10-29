const { Responsable, Paciente, siguienteCodigo } = require('../models');
const AppError = require('../utils/AppError');
const { pick, requerir, validarId, escaparRegex } = require('../utils/helpers');

const CAMPOS = ['fotoUrl', 'nombres', 'apellidos', 'parentesco', 'telefono', 'correo', 'direccion'];
const POP_PACIENTES = { path: 'pacientes', select: 'codigo nombres apellidos fechaNacimiento estado fotoUrl' };

async function validarPacientes(ids = []) {
  if (!Array.isArray(ids)) throw new AppError('pacientes debe ser un arreglo de IDs', 400);
  ids.forEach((id) => validarId(id, 'paciente'));
  const unicos = [...new Set(ids.map(String))];
  const n = await Paciente.countDocuments({ _id: { $in: unicos } });
  if (n !== unicos.length) throw new AppError('Uno o más pacientes no existen', 404);
  return unicos;
}

// GET /api/responsables?q=&paciente=
exports.listar = async (req, res) => {
  const filtro = {};
  if (req.query.paciente) { validarId(req.query.paciente, 'paciente'); filtro.pacientes = req.query.paciente; }
  if (req.query.q) {
    const re = new RegExp(escaparRegex(req.query.q.trim()), 'i');
    filtro.$or = [{ nombres: re }, { apellidos: re }, { codigo: re }, { telefono: re }, { correo: re }];
  }
  res.json(await Responsable.find(filtro).populate(POP_PACIENTES).sort({ apellidos: 1 }));
};

// GET /api/responsables/:id
exports.obtener = async (req, res) => {
  validarId(req.params.id);
  const r = await Responsable.findById(req.params.id).populate(POP_PACIENTES);
  if (!r) throw new AppError('Responsable no encontrado', 404);
  res.json(r);
};

// POST /api/responsables  { ...datos, pacientes: [ids] }
exports.crear = async (req, res) => {
  requerir(req.body, ['nombres', 'apellidos', 'parentesco', 'telefono', 'correo', 'direccion']);
  const r = new Responsable(pick(req.body, CAMPOS));
  if (req.body.pacientes) r.pacientes = await validarPacientes(req.body.pacientes);
  await r.validate();
  r.codigo = await siguienteCodigo('responsable', 'RES');
  await r.save();
  res.status(201).json(await r.populate(POP_PACIENTES));
};

// PUT /api/responsables/:id
exports.actualizar = async (req, res) => {
  validarId(req.params.id);
  const r = await Responsable.findById(req.params.id);
  if (!r) throw new AppError('Responsable no encontrado', 404);
  Object.assign(r, pick(req.body, CAMPOS));
  if (req.body.pacientes) r.pacientes = await validarPacientes(req.body.pacientes);
  await r.save();
  res.json(await r.populate(POP_PACIENTES));
};

// POST /api/responsables/:id/pacientes  { paciente }  -> asociar
exports.asociar = async (req, res) => {
  validarId(req.params.id);
  requerir(req.body, ['paciente']);
  await validarPacientes([req.body.paciente]);
  const r = await Responsable.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { pacientes: req.body.paciente } },
    { new: true },
  ).populate(POP_PACIENTES);
  if (!r) throw new AppError('Responsable no encontrado', 404);
  res.json(r);
};

// DELETE /api/responsables/:id/pacientes/:pacienteId  -> desasociar
exports.desasociar = async (req, res) => {
  validarId(req.params.id);
  validarId(req.params.pacienteId, 'paciente');
  const r = await Responsable.findByIdAndUpdate(
    req.params.id,
    { $pull: { pacientes: req.params.pacienteId } },
    { new: true },
  ).populate(POP_PACIENTES);
  if (!r) throw new AppError('Responsable no encontrado', 404);
  res.json(r);
};
