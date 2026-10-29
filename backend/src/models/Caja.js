const mongoose = require('mongoose');
const baseJSON = require('../utils/baseJSON');

/**
 * Caja diaria. Mientras está ABIERTA sus totales se calculan en vivo a partir
 * de los pagos válidos. Al CERRARSE se guarda una "foto" de los totales para
 * conservar el historial del cierre (RN-24). Todos los montos en centavos.
 */
const cajaSchema = new mongoose.Schema({
  codigo: { type: String, unique: true }, // CAJ-0001
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fechaApertura: { type: Date, default: Date.now },
  montoInicialCentavos: {
    type: Number, required: true, min: [0, 'El monto inicial no puede ser negativo'],
    validate: { validator: Number.isInteger, message: 'Monto inválido' },
  },
  estado: { type: String, enum: ['ABIERTA', 'CERRADA'], default: 'ABIERTA' },
  // ---- Datos del cierre ----
  totalEfectivoCentavos: { type: Number, default: 0 },
  totalTransferenciaCentavos: { type: Number, default: 0 },
  totalTarjetaCentavos: { type: Number, default: 0 },
  totalIngresosCentavos: { type: Number, default: 0 },
  efectivoEsperadoCentavos: { type: Number, default: 0 },
  efectivoContadoCentavos: { type: Number },
  diferenciaCentavos: { type: Number },
  cantidadPagos: { type: Number, default: 0 },
  observacionesCierre: { type: String, trim: true, default: '' },
  fechaCierre: Date,
  cerradaPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
}, { timestamps: true });

cajaSchema.index({ usuario: 1, estado: 1 });
cajaSchema.plugin(baseJSON);
module.exports = mongoose.model('Caja', cajaSchema, 'cajas');
