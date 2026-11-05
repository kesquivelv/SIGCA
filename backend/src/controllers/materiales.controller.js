const { Material, AsignacionMaterial, Paciente, Cita, siguienteCodigo } = require('../models');
const AppError = require('../utils/AppError');
const { pick, requerir, validarId, escaparRegex } = require('../utils/helpers');

const CAMPOS = ['titulo', 'descripcion', 'tipo', 'enlace'];

// GET /api/materiales?q=&tipo=&estado=
exports.listar = async (req, res) => {
  const filtro = {};
  if (req.query.tipo) filtro.tipo = req.query.tipo;
  if (req.query.estado) filtro.estado = req.query.estado;
  if (req.query.q) {
    const re = new RegExp(escaparRegex(req.query.q.trim()), 'i');
    filtro.$or = [{ titulo: re }, { descripcion: re }, { codigo: re }];
  }
  res.json(await Material.find(filtro).sort({ titulo: 1 }));
};

// GET /api/materiales/:id
exports.obtener = async (req, res) => {
  validarId(req.params.id);
  const m = await Material.findById(req.params.id);
  if (!m) throw new AppError('Material no encontrado', 404);
  res.json(m);
};

// POST /api/materiales
exports.crear = async (req, res) => {
  requerir(req.body, ['titulo', 'descripcion', 'tipo', 'enlace']);
  const m = new Material({ ...pick(req.body, CAMPOS), creadoPor: req.usuario._id });
  await m.validate();
  m.codigo = await siguienteCodigo('material', 'MAT');
  await m.save();
  res.status(201).json(m);
};

// PUT /api/materiales/:id
exports.actualizar = async (req, res) => {
  validarId(req.params.id);
  const m = await Material.findById(req.params.id);
  if (!m) throw new AppError('Material no encontrado', 404);
  Object.assign(m, pick(req.body, CAMPOS));
  await m.save();
  res.json(m);
};

// PATCH /api/materiales/:id/estado  { estado }
exports.cambiarEstado = async (req, res) => {
  validarId(req.params.id);
  if (!['ACTIVO', 'INACTIVO'].includes(req.body.estado)) throw new AppError('Estado inválido (ACTIVO o INACTIVO)', 400);
  const m = await Material.findByIdAndUpdate(req.params.id, { estado: req.body.estado }, { new: true });
  if (!m) throw new AppError('Material no encontrado', 404);
  res.json(m);
};

// GET /api/materiales/:id/asignaciones
exports.asignaciones = async (req, res) => {
  validarId(req.params.id);
  res.json(await AsignacionMaterial.find({ material: req.params.id })
    .populate('paciente', 'codigo nombres apellidos')
    .populate('asignadoPor', 'nombres apellidos')
    .sort({ fechaAsignacion: -1 }));
};

// POST /api/materiales/:id/asignaciones  { paciente, indicaciones }
exports.asignar = async (req, res) => {
  validarId(req.params.id);
  requerir(req.body, ['paciente']);
  validarId(req.body.paciente, 'paciente');
  const [m, p] = await Promise.all([Material.findById(req.params.id), Paciente.findById(req.body.paciente)]);
  if (!m) throw new AppError('Material no encontrado', 404);
  if (m.estado !== 'ACTIVO') throw new AppError('El material está inactivo', 422);
  if (!p) throw new AppError('Paciente no encontrado', 404);
  if (p.estado !== 'ACTIVO') throw new AppError('Los materiales solo pueden asignarse a pacientes activos', 422); // RN-09
  if (req.usuario.rol === 'PROFESIONAL'
    && !(await Cita.exists({ profesional: req.usuario._id, paciente: p._id }))) {
    throw new AppError('Solo puede asignar materiales a pacientes con citas con usted', 403);
  }
  if (await AsignacionMaterial.exists({ material: m._id, paciente: p._id })) {
    throw new AppError('Este material ya está asignado al paciente', 409);
  }
  const a = await AsignacionMaterial.create({
    material: m._id, paciente: p._id, asignadoPor: req.usuario._id, indicaciones: req.body.indicaciones || '',
  });
  res.status(201).json(await a.populate([{ path: 'paciente', select: 'codigo nombres apellidos' }, { path: 'asignadoPor', select: 'nombres apellidos' }]));
};

// DELETE /api/materiales/:id/asignaciones/:pacienteId
exports.quitarAsignacion = async (req, res) => {
  validarId(req.params.id);
  validarId(req.params.pacienteId, 'paciente');
  const a = await AsignacionMaterial.findOne({ material: req.params.id, paciente: req.params.pacienteId });
  if (!a) throw new AppError('Asignación no encontrada', 404);
  if (req.usuario.rol === 'PROFESIONAL' && String(a.asignadoPor) !== String(req.usuario._id)) {
    throw new AppError('Solo puede quitar asignaciones hechas por usted', 403);
  }
  await a.deleteOne();
  res.json({ mensaje: 'Asignación eliminada' });
};
