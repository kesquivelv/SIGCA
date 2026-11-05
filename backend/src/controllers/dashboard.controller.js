const {
  Cita, Paciente, SolicitudCita, MensajeContacto, Pago, Caja,
} = require('../models');
const F = require('../utils/fechas');
const { totalesPorMetodo } = require('../services/finanzas.service');
const { POP_CITA } = require('../services/citas.service');

// GET /api/dashboard  -> resumen para la pantalla de inicio del panel
exports.resumen = async (req, res) => {
  const hoy = F.hoyLocal();
  const esProf = req.usuario.rol === 'PROFESIONAL';
  const filtroCita = esProf ? { profesional: req.usuario._id } : {};

  const [citasHoy, proximas] = await Promise.all([
    Cita.find({ ...filtroCita, fecha: hoy }).populate(POP_CITA).sort({ inicio: 1 }),
    Cita.countDocuments({ ...filtroCita, fecha: { $gt: hoy }, estado: { $in: ['PENDIENTE', 'CONFIRMADA'] } }),
  ]);
  const r = {
    hoy,
    citasHoy,
    citasProximas: proximas,
  };
  if (esProf) return res.json(r);

  const { desde, hasta } = F.rangoDia(hoy);
  const pagosHoy = await Pago.find({ fechaHora: { $gte: desde, $lt: hasta } });
  const t = totalesPorMetodo(pagosHoy);
  const [pacientesActivos, solicitudesPendientes, mensajesSinLeer, cajaAbierta] = await Promise.all([
    Paciente.countDocuments({ estado: 'ACTIVO' }),
    SolicitudCita.countDocuments({ estado: 'PENDIENTE' }),
    MensajeContacto.countDocuments({ leido: false }),
    Caja.exists({ usuario: req.usuario._id, estado: 'ABIERTA' }),
  ]);
  res.json({
    ...r,
    pacientesActivos,
    solicitudesPendientes,
    mensajesSinLeer,
    cajaAbierta: !!cajaAbierta,
    ingresosHoyCentavos: t.totalIngresosCentavos,
    ingresosHoy: t.totalIngresosCentavos / 100,
  });
};
