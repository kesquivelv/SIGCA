const { SolicitudCita, Servicio } = require('../models');
const AppError = require('../utils/AppError');
const F = require('../utils/fechas');
const { pick, requerir, validarId, escaparRegex } = require('../utils/helpers');
const { programarCita } = require('../services/citas.service');

const POP = [{ path: 'servicio', select: 'codigo nombre duracionMinutos precioCentavos' },
  { path: 'cita', select: 'codigo fecha horaInicio estado' },
  { path: 'atendidaPor', select: 'nombres apellidos' }];

// POST /api/publico/solicitudes  (visitante; NO reserva horario, solo queda pendiente)
exports.crearPublica = async (req, res) => {
  requerir(req.body, ['nombreSolicitante', 'correo', 'telefono', 'servicio', 'fechaPreferida']);
  validarId(req.body.servicio, 'servicio');
  const srv = await Servicio.findById(req.body.servicio);
  if (!srv || srv.estado !== 'ACTIVO') throw new AppError('El servicio seleccionado no está disponible', 422);
  if (!F.esFechaValida(req.body.fechaPreferida)) throw new AppError('Fecha preferida inválida', 400);
  if (req.body.fechaPreferida < F.hoyLocal()) throw new AppError('La fecha preferida no puede ser pasada', 422);
  const s = await SolicitudCita.create(pick(req.body, ['nombreSolicitante', 'correo', 'telefono', 'servicio', 'fechaPreferida', 'mensaje']));
  res.status(201).json({ mensaje: 'Su solicitud fue recibida. Nos comunicaremos con usted para confirmar la cita.', id: s.id });
};

// GET /api/solicitudes?estado=&q=
exports.listar = async (req, res) => {
  const filtro = {};
  if (req.query.estado) filtro.estado = req.query.estado;
  if (req.query.q) {
    const re = new RegExp(escaparRegex(req.query.q.trim()), 'i');
    filtro.$or = [{ nombreSolicitante: re }, { correo: re }, { telefono: re }];
  }
  res.json(await SolicitudCita.find(filtro).populate(POP).sort({ createdAt: -1 }));
};

// GET /api/solicitudes/:id
exports.obtener = async (req, res) => {
  validarId(req.params.id);
  const s = await SolicitudCita.findById(req.params.id).populate(POP);
  if (!s) throw new AppError('Solicitud no encontrada', 404);
  res.json(s);
};

// POST /api/solicitudes/:id/atender  { paciente, profesional, fecha, horaInicio, observaciones }
exports.atender = async (req, res) => {
  validarId(req.params.id);
  const s = await SolicitudCita.findById(req.params.id);
  if (!s) throw new AppError('Solicitud no encontrada', 404);
  if (s.estado !== 'PENDIENTE') throw new AppError('La solicitud ya fue atendida o rechazada', 422);
  requerir(req.body, ['paciente', 'profesional', 'fecha', 'horaInicio']);
  const cita = await programarCita({
    ...pick(req.body, ['paciente', 'profesional', 'fecha', 'horaInicio', 'observaciones']),
    servicio: s.servicio,
    usuario: req.usuario,
    solicitud: s._id,
  });
  Object.assign(s, {
    estado: 'ATENDIDA', cita: cita._id, atendidaPor: req.usuario._id, fechaAtencion: new Date(),
  });
  await s.save();
  res.status(201).json({ solicitud: await s.populate(POP), cita });
};

// PATCH /api/solicitudes/:id/rechazar  { motivo }
exports.rechazar = async (req, res) => {
  validarId(req.params.id);
  requerir(req.body, ['motivo']);
  const s = await SolicitudCita.findById(req.params.id);
  if (!s) throw new AppError('Solicitud no encontrada', 404);
  if (s.estado !== 'PENDIENTE') throw new AppError('La solicitud ya fue atendida o rechazada', 422);
  Object.assign(s, {
    estado: 'RECHAZADA', motivoRechazo: String(req.body.motivo).trim(), atendidaPor: req.usuario._id, fechaAtencion: new Date(),
  });
  await s.save();
  res.json(await s.populate(POP));
};
