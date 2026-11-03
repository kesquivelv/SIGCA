/**
 * Reglas de negocio de las citas.
 *  - La cita debe caer dentro del horario de atención del día (Horario).
 *  - No se puede programar en el pasado.
 *  - Un profesional no puede tener dos citas que se traslapen (RN-13);
 *    solo PENDIENTE y CONFIRMADA bloquean el horario.
 *  - Un paciente tampoco puede estar en dos citas a la vez.
 *  - La cita copia duración y precio del servicio al programarse (RF-07).
 */
const {
  Cita, Paciente, Servicio, Usuario, Horario, siguienteCodigo,
} = require('../models');
const { ESTADOS_QUE_BLOQUEAN } = require('../models/Cita');
const AppError = require('../utils/AppError');
const F = require('../utils/fechas');
const { validarId } = require('../utils/helpers');

const POP_CITA = [
  { path: 'paciente', select: 'codigo nombres apellidos fechaNacimiento estado' },
  { path: 'servicio', select: 'codigo nombre duracionMinutos' },
  { path: 'profesional', select: 'nombres apellidos especialidad' },
];

/** Valida fecha y hora, horario del centro, pasado y traslapes. Lanza AppError. */
async function validarHorario({ fecha, horaInicio, duracionMinutos, profesional, paciente, excluirCita }) {
  if (!F.esFechaValida(fecha)) throw new AppError('Fecha inválida (use AAAA-MM-DD)', 400);
  if (!F.esHoraValida(horaInicio)) throw new AppError('Hora inválida (use HH:mm)', 400);

  const minIni = F.horaAMinutos(horaInicio);
  const minFin = minIni + duracionMinutos;
  if (minFin > 24 * 60) throw new AppError('La cita no puede terminar después de medianoche', 422);
  const horaFin = F.minutosAHora(minFin);
  const inicio = F.aFechaHora(fecha, horaInicio);
  const fin = F.aFechaHora(fecha, horaFin);

  if (inicio < new Date()) throw new AppError('No se pueden programar citas en una fecha u hora pasada', 422);

  const horario = await Horario.findOne({ dia: F.diaSemana(fecha) });
  if (!horario || !horario.activo) throw new AppError('El centro no atiende en la fecha seleccionada', 422);
  if (minIni < F.horaAMinutos(horario.horaInicio) || minFin > F.horaAMinutos(horario.horaFin)) {
    throw new AppError(`La cita debe estar dentro del horario de atención (${horario.horaInicio} a ${horario.horaFin})`, 422);
  }

  const base = { estado: { $in: ESTADOS_QUE_BLOQUEAN }, inicio: { $lt: fin }, fin: { $gt: inicio } };
  if (excluirCita) base._id = { $ne: excluirCita };

  const choqueProf = await Cita.findOne({ ...base, profesional });
  if (choqueProf) {
    throw new AppError(`El profesional ya tiene una cita en ese horario (${choqueProf.horaInicio} a ${choqueProf.horaFin})`, 409);
  }
  const choquePac = await Cita.findOne({ ...base, paciente });
  if (choquePac) {
    throw new AppError(`El paciente ya tiene una cita en ese horario (${choquePac.horaInicio} a ${choquePac.horaFin})`, 409);
  }
  return { horaFin, inicio, fin };
}

/** Programa una cita nueva aplicando todas las reglas. Devuelve la cita poblada. */
async function programarCita({
  paciente, servicio, profesional, fecha, horaInicio, observaciones = '', usuario, solicitud,
}) {
  validarId(paciente, 'paciente');
  validarId(servicio, 'servicio');
  validarId(profesional, 'profesional');

  const [pac, srv, prof] = await Promise.all([
    Paciente.findById(paciente), Servicio.findById(servicio), Usuario.findById(profesional),
  ]);
  if (!pac) throw new AppError('Paciente no encontrado', 404);
  if (pac.estado !== 'ACTIVO') throw new AppError('No se pueden programar citas para un paciente inactivo', 422);
  if (!srv) throw new AppError('Servicio no encontrado', 404);
  if (srv.estado !== 'ACTIVO') throw new AppError('El servicio está inactivo', 422);
  if (!prof || prof.rol !== 'PROFESIONAL') throw new AppError('Profesional no encontrado', 404);
  if (!prof.activo) throw new AppError('El profesional está inactivo', 422);

  const { horaFin, inicio, fin } = await validarHorario({
    fecha, horaInicio, duracionMinutos: srv.duracionMinutos, profesional: prof._id, paciente: pac._id,
  });

  const cita = await Cita.create({
    codigo: await siguienteCodigo('cita', 'CIT', 6),
    paciente: pac._id,
    servicio: srv._id,
    profesional: prof._id,
    fecha,
    horaInicio,
    horaFin,
    inicio,
    fin,
    duracionMinutos: srv.duracionMinutos,
    precioCentavos: srv.precioCentavos,
    observaciones,
    solicitud,
    creadoPor: usuario._id,
    historial: [{ accion: 'CREADA', detalle: `${fecha} ${horaInicio}`, usuario: usuario._id }],
  });
  return cita.populate(POP_CITA);
}

/** Horas de inicio libres (cada 30 min) para un profesional en una fecha. */
async function disponibilidad({ profesional, fecha, duracionMinutos, excluirCita }) {
  validarId(profesional, 'profesional');
  if (!F.esFechaValida(fecha)) throw new AppError('Fecha inválida (use AAAA-MM-DD)', 400);
  const horario = await Horario.findOne({ dia: F.diaSemana(fecha) });
  if (!horario || !horario.activo) return { atiende: false, horaInicio: null, horaFin: null, libres: [] };

  const filtro = {
    profesional,
    fecha,
    estado: { $in: ESTADOS_QUE_BLOQUEAN },
  };
  if (excluirCita) filtro._id = { $ne: excluirCita };
  const ocupadas = await Cita.find(filtro).select('horaInicio horaFin');

  const ini = F.horaAMinutos(horario.horaInicio);
  const fin = F.horaAMinutos(horario.horaFin);
  const ahora = new Date();
  const libres = [];
  for (let m = ini; m + duracionMinutos <= fin; m += 30) {
    const choca = ocupadas.some((o) => m < F.horaAMinutos(o.horaFin) && m + duracionMinutos > F.horaAMinutos(o.horaInicio));
    if (choca) continue;
    if (F.aFechaHora(fecha, F.minutosAHora(m)) < ahora) continue;
    libres.push(F.minutosAHora(m));
  }
  return {
    atiende: true, horaInicio: horario.horaInicio, horaFin: horario.horaFin, libres,
  };
}

module.exports = {
  POP_CITA, validarHorario, programarCita, disponibilidad,
};
