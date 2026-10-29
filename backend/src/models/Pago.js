const mongoose = require('mongoose');
const baseJSON = require('../utils/baseJSON');

const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'];

/**
 * Cada pago/abono es un registro independiente (no se suman en un solo campo),
 * así se conserva todo el historial. Los pagos NUNCA se borran: se ANULAN (RN-26).
 */
const pagoSchema = new mongoose.Schema({
  comprobante: { type: String, required: true, unique: true }, // CMP-2026-000001
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
  cita: { type: mongoose.Schema.Types.ObjectId, ref: 'Cita', required: true },
  caja: { type: mongoose.Schema.Types.ObjectId, ref: 'Caja', required: true },
  montoCentavos: {
    type: Number, required: true, min: [1, 'El monto debe ser mayor que cero'],
    validate: { validator: Number.isInteger, message: 'Monto inválido' },
  },
  metodo: { type: String, enum: { values: METODOS_PAGO, message: 'Método de pago inválido' }, required: true },
  referencia: { type: String, trim: true, default: '' }, // no. de transferencia o voucher (opcional)
  fechaHora: { type: Date, default: Date.now },
  registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  estado: { type: String, enum: ['REGISTRADO', 'ANULADO'], default: 'REGISTRADO' },
  motivoAnulacion: { type: String, trim: true },
  anuladoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  fechaAnulacion: Date,
}, { timestamps: true });

pagoSchema.index({ cita: 1, estado: 1 });
pagoSchema.index({ caja: 1 });
pagoSchema.index({ paciente: 1, fechaHora: -1 });
pagoSchema.plugin(baseJSON);

module.exports = mongoose.model('Pago', pagoSchema, 'pagos');
module.exports.METODOS_PAGO = METODOS_PAGO;
