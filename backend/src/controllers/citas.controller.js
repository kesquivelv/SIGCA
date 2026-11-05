const { Cita, Servicio, Usuario, Pago } = require('../models');
const AppError = require('../utils/AppError');
const { pick, requerir, validarId } = require('../utils/helpers');
const { adjuntarFinanzas, finanzasDeCita } = require('../services/finanzas.service');
const {
  POP_CITA, validarHorario, programarCita, disponibilidad,
} = require('../services/citas.service');

const esProfesional = (req) => req.usuario.rol === 'PROFESIONAL';

/** Transiciones de estado permitidas. */
const TRANSICIONES = {
  PENDIENTE: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['COMPLETADA', 'CANCELADA'],
  COMPLETADA: [],
  CANCELADA: [],
};

async function cargar(req, id) {
  validarId(id);
  const cita = await Cita.findById(id);
  if (!cita) throw new AppError('Cita no encontrada', 404);
  if (esProfesional(req) && String(cita.profesional) !== String(req.usuario._id)) {
    throw new AppError('Solo puede consultar sus propias citas', 403);
  }
  return cita;
}

// GET /api/citas?fecha=&desde=&hasta=&estado=&profesional=&paciente=
exports.listar = async (req, res) => {
  const { fecha, desde, hasta, estado, profesional, paciente } = req.query;
  const filtro = {};
  if (fecha) filtro.fecha = fecha;
  if (desde || hasta) {
    filtro.fecha = {};
    if (desde) filtro.fecha.$gte = desde;
    if (hasta) filtro.fecha.$lte = hasta;
  }
  if (estado) filtro.estado = estado;
  if (paciente) { validarId(paciente, 'paciente'); filtro.paciente = paciente; }
  if (esProfesional(req)) filtro.profesional = req.usuario._id;
  else if (profesional) { validarId(profesional, 'profesional'); filtro.profesional = profesional; }

  const citas = await Cita.find(filtro).populate(POP_CITA).sort({ inicio: 1 });
  // El profesional no ve información financiera
  res.json(esProfesional(req) ? citas : await adjuntarFinanzas(citas));
};

// GET /api/citas/disponibilidad?profesional=&fecha=&servicio=&excluir=
exports.disponibilidad = async (req, res) => {
  const { profesional, fecha, servicio, excluir } = req.query;
  requerir(req.query, ['profesional', 'fecha', 'servicio']);
  validarId(servicio, 'servicio');
  const srv = await Servicio.findById(servicio);
  if (!srv) throw new AppError('Servicio no encontrado', 404);
  res.json(await disponibilidad({
    profesional, fecha, duracionMinutos: srv.duracionMinutos, excluirCita: excluir,
  }));
};

// GET /api/citas/:id
exports.obtener = async (req, res) => {
  const cita = await cargar(req, req.params.id);
  await cita.populate([...POP_CITA, { path: 'historial.usuario', select: 'nombres apellidos' }, { path: 'creadoPor', select: 'nombres apellidos' }]);
  const obj = cita.toJSON();
  if (!esProfesional(req)) obj.finanzas = await finanzasDeCita(cita);
  res.json(obj);
};

// POST /api/citas  { paciente, servicio, profesional, fecha, horaInicio, observaciones }
exports.crear = async (req, res) => {
  requerir(req.body, ['paciente', 'servicio', 'profesional', 'fecha', 'horaInicio']);
  const cita = await programarCita({
    ...pick(req.body, ['paciente', 'servicio', 'profesional', 'fecha', 'horaInicio', 'observaciones']),
    usuario: req.usuario,
  });
  res.status(201).json(cita);
};

// PUT /api/citas/:id  { fecha, horaInicio, profesional, observaciones }  -> reprogramar
exports.actualizar = async (req, res) => {
  const cita = await cargar(req, req.params.id);
  if (!['PENDIENTE', 'CONFIRMADA'].includes(cita.estado)) {
    throw new AppError('Solo se pueden modificar citas pendientes o confirmadas', 422);
  }
  const datos = pick(req.body, ['fecha', 'horaInicio', 'profesional', 'observaciones']);
  const fecha = datos.fecha || cita.fecha;
  const horaInicio = datos.horaInicio || cita.horaInicio;
  const profesional = datos.profesional || cita.profesional;
  const cambioHorario = fecha !== cita.fecha || horaInicio !== cita.horaInicio || String(profesional) !== String(cita.profesional);

  let detalle = 'Observaciones actualizadas';
  if (cambioHorario) {
    validarId(profesional, 'profesional');
    const profesionalActivo = await Usuario.findById(profesional).select('rol activo');
    if (!profesionalActivo || profesionalActivo.rol !== 'PROFESIONAL') {
      throw new AppError('Profesional no encontrado', 404);
    }
    if (!profesionalActivo.activo) throw new AppError('El profesional está inactivo', 422);
    const { horaFin, inicio, fin } = await validarHorario({
      fecha, horaInicio, duracionMinutos: cita.duracionMinutos, profesional, paciente: cita.paciente, excluirCita: cita._id,
    });
    detalle = `De ${cita.fecha} ${cita.horaInicio} a ${fecha} ${horaInicio}`;
    Object.assign(cita, { fecha, horaInicio, horaFin, inicio, fin, profesional });
  }
  if (datos.observaciones !== undefined) cita.observaciones = datos.observaciones;
  cita.historial.push({ accion: cambioHorario ? 'REPROGRAMADA' : 'ACTUALIZADA', detalle, usuario: req.usuario._id });
  await cita.save();
  res.json(await cita.populate(POP_CITA));
};

// PATCH /api/citas/:id/estado  { estado, motivo }
exports.cambiarEstado = async (req, res) => {
  const cita = await cargar(req, req.params.id);
  const { estado, motivo } = req.body;
  if (!Object.keys(TRANSICIONES).includes(estado)) throw new AppError('Estado inválido', 400);
  if (esProfesional(req) && estado !== 'COMPLETADA') {
    throw new AppError('El profesional solo puede marcar sus citas como completadas', 403);
  }
  if (!TRANSICIONES[cita.estado].includes(estado)) {
    throw new AppError(`No se puede pasar una cita de ${cita.estado} a ${estado}`, 422);
  }
  if (estado === 'COMPLETADA' && cita.inicio > new Date()) {
    throw new AppError('No se puede completar una cita que aún no ha comenzado', 422);
  }
  if (estado === 'CANCELADA' && !String(motivo || '').trim()) {
    throw new AppError('Indique el motivo de la cancelación', 400);
  }
  if (estado === 'CANCELADA') {
    // RN-27: una cita con pagos válidos no puede cancelarse; primero deben anularse sus pagos
    const pagosValidos = await Pago.countDocuments({ cita: cita._id, estado: 'REGISTRADO' });
    if (pagosValidos > 0) {
      throw new AppError(`La cita tiene ${pagosValidos} pago(s) válido(s). Anúlelos primero (mientras su caja siga abierta) y luego cancele la cita`, 409);
    }
  }
  cita.estado = estado;
  cita.historial.push({ accion: estado, detalle: motivo || '', usuario: req.usuario._id });
  await cita.save();
  res.json(await cita.populate(POP_CITA));
};

// GET /api/citas/:id/pagos  -> historial de pagos de la cita (incluye anulados) y su resumen financiero
exports.pagos = async (req, res) => {
  const cita = await cargar(req, req.params.id);
  const pagos = await Pago.find({ cita: cita._id })
    .populate('registradoPor', 'nombres apellidos')
    .populate('anuladoPor', 'nombres apellidos')
    .populate('caja', 'codigo estado')
    .sort({ fechaHora: 1 });
  res.json({ cita: cita.codigo, pagos, finanzas: await finanzasDeCita(cita) });
};

// GET /api/citas/:id/saldo  -> costo, pagado, saldo pendiente y estado de pago (calculados, RN-18)
exports.saldo = async (req, res) => {
  const cita = await cargar(req, req.params.id);
  res.json({ cita: cita.codigo, ...(await finanzasDeCita(cita)) });
};
