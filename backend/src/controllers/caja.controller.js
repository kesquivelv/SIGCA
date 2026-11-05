const { Caja, Pago, siguienteCodigo } = require('../models');
const AppError = require('../utils/AppError');
const { aCentavos } = require('../utils/dinero');
const F = require('../utils/fechas');
const { requerir, validarId } = require('../utils/helpers');
const { totalesPorMetodo } = require('../services/finanzas.service');

const POP_PAGO = [
  { path: 'paciente', select: 'codigo nombres apellidos' },
  { path: 'cita', select: 'codigo fecha horaInicio', populate: { path: 'servicio', select: 'nombre' } },
  { path: 'anuladoPor', select: 'nombres apellidos' },
];

/** Caja + sus pagos. Si está ABIERTA los totales se calculan en vivo. */
async function detalle(caja) {
  await caja.populate('usuario', 'nombres apellidos');
  const pagos = await Pago.find({ caja: caja._id }).populate(POP_PAGO).sort({ fechaHora: 1 });
  const obj = caja.toJSON();
  if (caja.estado === 'ABIERTA') {
    const t = totalesPorMetodo(pagos);
    Object.assign(obj, t);
    obj.efectivoEsperadoCentavos = caja.montoInicialCentavos + t.totalEfectivoCentavos;
    for (const k of Object.keys(t)) if (k.endsWith('Centavos')) obj[k.slice(0, -8)] = t[k] / 100;
    obj.efectivoEsperado = obj.efectivoEsperadoCentavos / 100;
  }
  obj.pagos = pagos;
  return obj;
}

const propia = (req, caja) => req.usuario.rol === 'ADMINISTRADOR' || String(caja.usuario._id || caja.usuario) === String(req.usuario._id);

// GET /api/caja/actual  -> caja abierta del usuario (o null)
exports.actual = async (req, res) => {
  const caja = await Caja.findOne({ usuario: req.usuario._id, estado: 'ABIERTA' });
  res.json(caja ? await detalle(caja) : null);
};

// POST /api/caja/abrir  { montoInicial (Q) }
exports.abrir = async (req, res) => {
  requerir(req.body, ['montoInicial']);
  const montoInicialCentavos = aCentavos(req.body.montoInicial, 'montoInicial');
  if (montoInicialCentavos < 0) throw new AppError('El monto inicial no puede ser negativo', 400);
  if (await Caja.exists({ usuario: req.usuario._id, estado: 'ABIERTA' })) {
    throw new AppError('Ya tiene una caja abierta. Ciérrela antes de abrir otra', 422);
  }
  const caja = await Caja.create({
    codigo: await siguienteCodigo('caja', 'CAJ'), usuario: req.usuario._id, montoInicialCentavos,
  });
  res.status(201).json(await detalle(caja));
};

/**
 * Cierra una caja abierta: calcula los totales a partir de los pagos válidos (RN-23),
 * el efectivo esperado y la diferencia con el efectivo contado.
 */
async function cerrarCaja(caja, req) {
  requerir(req.body, ['efectivoContado']);
  const contado = aCentavos(req.body.efectivoContado, 'efectivoContado');
  if (contado < 0) throw new AppError('El efectivo contado no puede ser negativo', 400);

  const t = totalesPorMetodo(await Pago.find({ caja: caja._id }));
  const esperado = caja.montoInicialCentavos + t.totalEfectivoCentavos;
  const diferencia = contado - esperado;
  if (diferencia !== 0 && !String(req.body.observaciones || '').trim()) {
    throw new AppError('Hay diferencia entre el efectivo esperado y el contado: explique el motivo en las observaciones', 422);
  }
  Object.assign(caja, t, {
    efectivoEsperadoCentavos: esperado,
    efectivoContadoCentavos: contado,
    diferenciaCentavos: diferencia,
    observacionesCierre: String(req.body.observaciones || '').trim(),
    estado: 'CERRADA',
    fechaCierre: new Date(),
    cerradaPor: req.usuario._id,
  });
  await caja.save();
  return detalle(caja);
}

// POST /api/caja/cerrar  { efectivoContado (Q), observaciones }  -> cierra la caja abierta del usuario
exports.cerrar = async (req, res) => {
  const caja = await Caja.findOne({ usuario: req.usuario._id, estado: 'ABIERTA' });
  if (!caja) throw new AppError('No tiene una caja abierta', 422);
  res.json(await cerrarCaja(caja, req));
};

// POST /api/cajas/:id/cerrar  { efectivoContado (Q), observaciones }  -> ruta del enunciado
// La recepcionista solo cierra sus propias cajas; el administrador puede cerrar cualquiera.
exports.cerrarPorId = async (req, res) => {
  validarId(req.params.id);
  const caja = await Caja.findById(req.params.id);
  if (!caja) throw new AppError('Caja no encontrada', 404);
  if (!propia(req, caja)) throw new AppError('Solo puede cerrar sus propias cajas', 403);
  if (caja.estado !== 'ABIERTA') throw new AppError('La caja ya está cerrada', 422);
  res.json(await cerrarCaja(caja, req));
};

// GET /api/caja?estado=&desde=&hasta=   (recepcionista: solo las suyas)
exports.listar = async (req, res) => {
  const { estado, desde, hasta } = req.query;
  const filtro = {};
  if (req.usuario.rol !== 'ADMINISTRADOR') filtro.usuario = req.usuario._id;
  if (estado) filtro.estado = estado;
  if (desde || hasta) {
    filtro.fechaApertura = {};
    if (desde) filtro.fechaApertura.$gte = F.rangoDia(desde).desde;
    if (hasta) filtro.fechaApertura.$lt = F.rangoDia(hasta).hasta;
  }
  res.json(await Caja.find(filtro).populate('usuario', 'nombres apellidos').sort({ fechaApertura: -1 }).limit(200));
};

// GET /api/caja/:id
exports.obtener = async (req, res) => {
  validarId(req.params.id);
  const caja = await Caja.findById(req.params.id);
  if (!caja) throw new AppError('Caja no encontrada', 404);
  if (!propia(req, caja)) throw new AppError('Solo puede consultar sus propias cajas', 403);
  res.json(await detalle(caja));
};

// GET /api/cajas/:id/movimientos  -> pagos que forman parte de la caja (incluye anulados)
exports.movimientos = async (req, res) => {
  validarId(req.params.id);
  const caja = await Caja.findById(req.params.id);
  if (!caja) throw new AppError('Caja no encontrada', 404);
  if (!propia(req, caja)) throw new AppError('Solo puede consultar sus propias cajas', 403);
  const obj = await detalle(caja);
  const { pagos, ...resumen } = obj;
  res.json({ caja: resumen, pagos });
};
