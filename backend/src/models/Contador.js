/**
 * Contadores secuenciales para códigos legibles (PAC-0001, CIT-000001,
 * comprobantes CMP-2026-000001...). $inc es atómico en MongoDB, así que
 * dos pagos simultáneos nunca reciben el mismo número de comprobante.
 */
const mongoose = require('mongoose');

const contadorSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } }, { versionKey: false });
const Contador = mongoose.model('Contador', contadorSchema, 'contadores');

async function siguiente(nombre) {
  const c = await Contador.findByIdAndUpdate(nombre, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return c.seq;
}

async function siguienteCodigo(nombre, prefijo, digitos = 4) {
  const n = await siguiente(nombre);
  return `${prefijo}-${String(n).padStart(digitos, '0')}`;
}

module.exports = { Contador, siguiente, siguienteCodigo };
