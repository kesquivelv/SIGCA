const {
  Paciente, Responsable, Cita, Pago, AsignacionMaterial, siguienteCodigo,
} = require('../models');
const AppError = require('../utils/AppError');
const { pick, requerir, validarId, escaparRegex } = require('../utils/helpers');
const { adjuntarFinanzas } = require('../services/finanzas.service');

const CAMPOS = ['fotoUrl', 'nombres', 'apellidos', 'fechaNacimiento', 'sexo', 'telefono', 'direccion', 'fechaInicioProceso', 'observaciones'];
// Información básica que puede ver un PROFESIONAL (sin datos administrativos)
const CAMPOS_BASICOS = 'codigo fotoUrl nombres apellidos fechaNacimiento sexo telefono estado fechaInicioProceso';

const esProfesional = (req) => req.usuario.rol === 'PROFESIONAL';

/** IDs de pacientes que tienen al menos una cita con el profesional. */
async function pacientesDelProfesional(profesionalId) {
  return Cita.distinct('paciente', { profesional: profesionalId });
}

async function verificarAccesoProfesional(req, pacienteId) {
  if (!esProfesional(req)) return;
  const tiene = await Cita.exists({ profesional: req.usuario._id, paciente: pacienteId });
  if (!tiene) throw new AppError('Solo puede consultar pacientes que tengan citas asignadas con usted', 403);
}

// GET /api/pacientes?q=&estado=
exports.listar = async (req, res) => {
  const filtro = {};
  if (req.query.estado) filtro.estado = req.query.estado;
  if (req.query.q) {
    const re = new RegExp(escaparRegex(req.query.q.trim()), 'i');
    filtro.$or = [{ nombres: re }, { apellidos: re }, { codigo: re }, { telefono: re }];
  }
  let consulta;
  if (esProfesional(req)) {
    filtro._id = { $in: await pacientesDelProfesional(req.usuario._id) };
    consulta = Paciente.find(filtro).select(CAMPOS_BASICOS);
  } else {
    consulta = Paciente.find(filtro);
  }
  res.json(await consulta.sort({ apellidos: 1, nombres: 1 }));
};

// GET /api/pacientes/:id  (incluye responsables asociados)
exports.obtener = async (req, res) => {
  validarId(req.params.id);
  await verificarAccesoProfesional(req, req.params.id);
  const consulta = Paciente.findById(req.params.id);
  if (esProfesional(req)) consulta.select(CAMPOS_BASICOS);
  const paciente = await consulta;
  if (!paciente) throw new AppError('Paciente no encontrado', 404);
  const obj = paciente.toJSON();
  if (!esProfesional(req)) {
    obj.responsables = await Responsable.find({ pacientes: paciente._id }).select('-pacientes');
  }
  res.json(obj);
};

// POST /api/pacientes
exports.crear = async (req, res) => {
  requerir(req.body, ['nombres', 'apellidos', 'fechaNacimiento', 'sexo', 'telefono', 'direccion']);
  const datos = pick(req.body, CAMPOS);
  const paciente = new Paciente(datos);
  await paciente.validate(); // valida antes de consumir un código
  paciente.codigo = await siguienteCodigo('paciente', 'PAC');
  await paciente.save();
  res.status(201).json(paciente);
};

// PUT /api/pacientes/:id
exports.actualizar = async (req, res) => {
  validarId(req.params.id);
  const paciente = await Paciente.findById(req.params.id);
  if (!paciente) throw new AppError('Paciente no encontrado', 404);
  Object.assign(paciente, pick(req.body, CAMPOS));
  await paciente.save();
  res.json(paciente);
};

// PATCH /api/pacientes/:id/estado  { estado: 'ACTIVO' | 'INACTIVO' }  -> eliminación lógica
exports.cambiarEstado = async (req, res) => {
  validarId(req.params.id);
  if (!['ACTIVO', 'INACTIVO'].includes(req.body.estado)) throw new AppError('Estado inválido (ACTIVO o INACTIVO)', 400);
  const paciente = await Paciente.findByIdAndUpdate(req.params.id, { estado: req.body.estado }, { new: true, runValidators: true });
  if (!paciente) throw new AppError('Paciente no encontrado', 404);
  res.json(paciente);
};

// GET /api/pacientes/:id/citas  (historial de citas con su estado financiero)
exports.citas = async (req, res) => {
  validarId(req.params.id);
  await verificarAccesoProfesional(req, req.params.id);
  const filtro = { paciente: req.params.id };
  if (esProfesional(req)) filtro.profesional = req.usuario._id;
  const citas = await Cita.find(filtro)
    .populate('servicio', 'nombre')
    .populate('profesional', 'nombres apellidos especialidad')
    .sort({ inicio: -1 });
  res.json(await adjuntarFinanzas(citas));
};

// GET /api/pacientes/:id/pagos  (historial de pagos del paciente)
exports.pagos = async (req, res) => {
  validarId(req.params.id);
  const pagos = await Pago.find({ paciente: req.params.id })
    .populate({ path: 'cita', select: 'codigo fecha horaInicio precioCentavos servicio', populate: { path: 'servicio', select: 'nombre' } })
    .populate('registradoPor', 'nombres apellidos')
    .populate('anuladoPor', 'nombres apellidos')
    .sort({ fechaHora: -1 });
  const validos = pagos.filter((p) => p.estado === 'REGISTRADO');
  const totalPagadoCentavos = validos.reduce((s, p) => s + p.montoCentavos, 0);
  // Saldo pendiente total del paciente (citas no canceladas)
  const citas = await adjuntarFinanzas(await Cita.find({ paciente: req.params.id, estado: { $ne: 'CANCELADA' } }));
  const saldoPendienteCentavos = citas.reduce((s, c) => s + c.finanzas.saldoCentavos, 0);
  res.json({
    pagos,
    totalPagadoCentavos,
    totalPagado: totalPagadoCentavos / 100,
    saldoPendienteCentavos,
    saldoPendiente: saldoPendienteCentavos / 100,
  });
};

// GET /api/pacientes/:id/responsables
exports.responsables = async (req, res) => {
  validarId(req.params.id);
  res.json(await Responsable.find({ pacientes: req.params.id }).select('-pacientes'));
};

// GET /api/pacientes/:id/materiales
exports.materiales = async (req, res) => {
  validarId(req.params.id);
  await verificarAccesoProfesional(req, req.params.id);
  res.json(await AsignacionMaterial.find({ paciente: req.params.id })
    .populate('material')
    .populate('asignadoPor', 'nombres apellidos')
    .sort({ fechaAsignacion: -1 }));
};
