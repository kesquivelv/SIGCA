const { Pago, Cita, Caja, siguiente } = require('../models');
const AppError = require('../utils/AppError');
const { aCentavos, formatoQ } = require('../utils/dinero');
const F = require('../utils/fechas');
const { pick, requerir, validarId } = require('../utils/helpers');
const { finanzasDeCita } = require('../services/finanzas.service');
const { METODOS_PAGO } = require('../models/Pago');

const POP = [
  { path: 'paciente', select: 'codigo nombres apellidos' },
  { path: 'cita', select: 'codigo fecha horaInicio precioCentavos estado servicio', populate: { path: 'servicio', select: 'nombre' } },
  { path: 'caja', select: 'codigo estado usuario' },
  { path: 'registradoPor', select: 'nombres apellidos' },
  { path: 'anuladoPor', select: 'nombres apellidos' },
];

// GET /api/pagos?desde=&hasta=&paciente=&cita=&caja=&estado=&metodo=
exports.listar = async (req, res) => {
  const { desde, hasta, paciente, cita, caja, estado, metodo } = req.query;
  const filtro = {};
  if (paciente) { validarId(paciente, 'paciente'); filtro.paciente = paciente; }
  if (cita) { validarId(cita, 'cita'); filtro.cita = cita; }
  if (caja) { validarId(caja, 'caja'); filtro.caja = caja; }
  if (estado) filtro.estado = estado;
  if (metodo) filtro.metodo = metodo;
  if (desde || hasta) {
    filtro.fechaHora = {};
    if (desde) filtro.fechaHora.$gte = F.rangoDia(desde).desde;
    if (hasta) filtro.fechaHora.$lt = F.rangoDia(hasta).hasta;
  }
  res.json(await Pago.find(filtro).populate(POP).sort({ fechaHora: -1 }).limit(500));
};

// GET /api/pagos/:id
exports.obtener = async (req, res) => {
  validarId(req.params.id);
  const p = await Pago.findById(req.params.id).populate(POP);
  if (!p) throw new AppError('Pago no encontrado', 404);
  res.json(p);
};

// POST /api/pagos  { cita, monto (Q), metodo, referencia }
// Exige una caja ABIERTA del usuario; un abono no puede superar el saldo (RN-23).
exports.registrar = async (req, res) => {
  requerir(req.body, ['cita', 'monto', 'metodo']);
  validarId(req.body.cita, 'cita');
  if (!METODOS_PAGO.includes(req.body.metodo)) throw new AppError('Método de pago inválido', 400);
  const montoCentavos = aCentavos(req.body.monto, 'monto');
  if (montoCentavos <= 0) throw new AppError('El monto debe ser mayor que cero', 400);

  const caja = await Caja.findOne({ usuario: req.usuario._id, estado: 'ABIERTA' });
  if (!caja) throw new AppError('Debe abrir su caja diaria antes de registrar pagos', 422);

  const cita = await Cita.findById(req.body.cita);
  if (!cita) throw new AppError('Cita no encontrada', 404);
  if (cita.estado === 'CANCELADA') throw new AppError('No se pueden registrar pagos de una cita cancelada', 422);

  const fin = await finanzasDeCita(cita);
  if (fin.saldoCentavos <= 0) throw new AppError('La cita ya está pagada por completo', 422);
  if (montoCentavos > fin.saldoCentavos) {
    throw new AppError(`El monto excede el saldo pendiente de la cita (${formatoQ(fin.saldoCentavos)})`, 422);
  }

  const n = await siguiente('comprobante');
  const pago = await Pago.create({
    comprobante: `CMP-${F.hoyLocal().slice(0, 4)}-${String(n).padStart(6, '0')}`,
    paciente: cita.paciente,
    cita: cita._id,
    caja: caja._id,
    montoCentavos,
    metodo: req.body.metodo,
    ...pick(req.body, ['referencia']),
    registradoPor: req.usuario._id,
  });
  res.status(201).json(await pago.populate(POP));
};

// PATCH /api/pagos/:id/anular  { motivo }   (los pagos nunca se borran, RN-26)
exports.anular = async (req, res) => {
  validarId(req.params.id);
  requerir(req.body, ['motivo']);
  const pago = await Pago.findById(req.params.id).populate('caja');
  if (!pago) throw new AppError('Pago no encontrado', 404);
  if (pago.estado === 'ANULADO') throw new AppError('El pago ya está anulado', 422);
  if (pago.caja.estado !== 'ABIERTA') throw new AppError('No se puede anular un pago de una caja ya cerrada', 422);
  if (req.usuario.rol === 'RECEPCIONISTA' && String(pago.caja.usuario) !== String(req.usuario._id)) {
    throw new AppError('Solo puede anular pagos de su propia caja', 403);
  }
  Object.assign(pago, {
    estado: 'ANULADO', motivoAnulacion: String(req.body.motivo).trim(), anuladoPor: req.usuario._id, fechaAnulacion: new Date(),
  });
  await pago.save();
  res.json(await Pago.findById(pago._id).populate(POP));
};
