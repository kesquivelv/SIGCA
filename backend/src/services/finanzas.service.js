/**
 * Cálculos financieros de SIGCA. Todo en centavos enteros (RN-28).
 * Solo los pagos en estado REGISTRADO cuentan; los ANULADOS se conservan
 * como historial pero no suman (RN-26).
 */
const mongoose = require('mongoose');
const Pago = require('../models/Pago');

const VACIO = () => ({
  totalEfectivoCentavos: 0,
  totalTransferenciaCentavos: 0,
  totalTarjetaCentavos: 0,
  totalIngresosCentavos: 0,
  cantidadPagos: 0,
});

/** Suma por método de pago los pagos válidos de una lista. */
function totalesPorMetodo(pagos = []) {
  const t = VACIO();
  for (const p of pagos) {
    if (p.estado !== 'REGISTRADO') continue;
    if (p.metodo === 'EFECTIVO') t.totalEfectivoCentavos += p.montoCentavos;
    else if (p.metodo === 'TRANSFERENCIA') t.totalTransferenciaCentavos += p.montoCentavos;
    else if (p.metodo === 'TARJETA') t.totalTarjetaCentavos += p.montoCentavos;
    t.totalIngresosCentavos += p.montoCentavos;
    t.cantidadPagos += 1;
  }
  return t;
}

/** Estado de pago a partir de precio, pagado y estado de la cita. */
function calcularFinanzas(precioCentavos, pagadoCentavos, estadoCita) {
  const cancelada = estadoCita === 'CANCELADA';
  const saldoCentavos = cancelada ? 0 : Math.max(precioCentavos - pagadoCentavos, 0);
  let estadoPago = 'PENDIENTE';
  if (pagadoCentavos >= precioCentavos) estadoPago = 'PAGADO';
  else if (pagadoCentavos > 0) estadoPago = 'PARCIAL';
  return {
    precioCentavos,
    pagadoCentavos,
    saldoCentavos,
    precio: precioCentavos / 100,
    pagado: pagadoCentavos / 100,
    saldo: saldoCentavos / 100,
    estadoPago,
  };
}

/** Total pagado (válido) por cita, en un solo aggregate. Devuelve Map<id, centavos>. */
async function pagadoPorCita(ids) {
  if (!ids.length) return new Map();
  const filas = await Pago.aggregate([
    { $match: { cita: { $in: ids.map((i) => new mongoose.Types.ObjectId(String(i))) }, estado: 'REGISTRADO' } },
    { $group: { _id: '$cita', total: { $sum: '$montoCentavos' } } },
  ]);
  return new Map(filas.map((f) => [String(f._id), f.total]));
}

/** Devuelve las citas como objetos planos con el campo `finanzas`. */
async function adjuntarFinanzas(citas) {
  const mapa = await pagadoPorCita(citas.map((c) => c._id));
  return citas.map((c) => {
    const obj = typeof c.toJSON === 'function' ? c.toJSON() : { ...c };
    obj.finanzas = calcularFinanzas(c.precioCentavos, mapa.get(String(c._id)) || 0, c.estado);
    return obj;
  });
}

/** Finanzas de una sola cita. */
async function finanzasDeCita(cita) {
  const mapa = await pagadoPorCita([cita._id]);
  return calcularFinanzas(cita.precioCentavos, mapa.get(String(cita._id)) || 0, cita.estado);
}

module.exports = { totalesPorMetodo, calcularFinanzas, adjuntarFinanzas, finanzasDeCita };
