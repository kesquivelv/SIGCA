/**
 * Manejo de fechas y horas del centro.
 * Las citas se guardan con:
 *  - fecha "YYYY-MM-DD" y horas "HH:mm" (fáciles de mostrar y filtrar), y
 *  - inicio / fin como Date reales (para detectar traslapes y fechas pasadas).
 * TZ_OFFSET define la zona horaria del centro (Guatemala: -06:00).
 */
const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const tz = () => process.env.TZ_OFFSET || '-06:00';

function offsetMinutos() {
  const [, signo, h, m] = tz().match(/([+-])(\d{2}):(\d{2})/);
  return (signo === '-' ? -1 : 1) * (Number(h) * 60 + Number(m));
}

function esFechaValida(fecha) {
  if (!RE_FECHA.test(fecha || '')) return false;
  const d = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === fecha;
}
const esHoraValida = (hora) => RE_HORA.test(hora || '');

/** Date real para una fecha y hora locales del centro. */
const aFechaHora = (fecha, hora) => new Date(`${fecha}T${hora}:00${tz()}`);

const horaAMinutos = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};
const minutosAHora = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** 0 = domingo ... 6 = sábado */
const diaSemana = (fecha) => new Date(`${fecha}T00:00:00Z`).getUTCDay();

/** Fecha local de hoy (YYYY-MM-DD) según la zona del centro. */
function hoyLocal(base = new Date()) {
  return new Date(base.getTime() + offsetMinutos() * 60000).toISOString().slice(0, 10);
}

/** Rango [desde, hasta) de un día local, útil para filtrar pagos por fecha. */
function rangoDia(fecha) {
  const desde = aFechaHora(fecha, '00:00');
  return { desde, hasta: new Date(desde.getTime() + 24 * 60 * 60 * 1000) };
}

/** Suma (o resta) días a una fecha YYYY-MM-DD. */
function sumarDias(fecha, dias) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Edad cumplida en años a partir de la fecha de nacimiento. */
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const nac = new Date(fechaNacimiento).toISOString().slice(0, 10);
  const [ay, am, ad] = hoyLocal().split('-').map(Number);
  const [ny, nm, nd] = nac.split('-').map(Number);
  let edad = ay - ny;
  if (am < nm || (am === nm && ad < nd)) edad -= 1;
  return edad;
}

module.exports = {
  DIAS, RE_FECHA, RE_HORA, esFechaValida, esHoraValida, aFechaHora, horaAMinutos,
  minutosAHora, diaSemana, hoyLocal, rangoDia, sumarDias, calcularEdad,
};
