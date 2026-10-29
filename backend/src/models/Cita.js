const mongoose = require('mongoose');
const baseJSON = require('../utils/baseJSON');

const ESTADOS_CITA = ['PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA'];
// Estados que ocupan el horario del profesional (RN-13: canceladas y completadas no bloquean)
const ESTADOS_QUE_BLOQUEAN = ['PENDIENTE', 'CONFIRMADA'];

const historialSchema = new mongoose.Schema({
  accion: String, // CREADA, CONFIRMADA, REPROGRAMADA, CANCELADA, COMPLETADA
  detalle: String,
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  fecha: { type: Date, default: Date.now },
}, { _id: false });

const citaSchema = new mongoose.Schema({
  codigo: { type: String, unique: true }, // CIT-000001
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
  servicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio', required: true },
  profesional: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fecha: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD
  horaInicio: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  horaFin: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  inicio: { type: Date, required: true }, // fecha + hora reales (para traslapes)
  fin: { type: Date, required: true },
  // Copiados del servicio AL PROGRAMAR: si luego cambia el servicio, la cita conserva sus valores (RF-07)
  duracionMinutos: { type: Number, required: true },
  precioCentavos: { type: Number, required: true, min: 0 },
  estado: { type: String, enum: ESTADOS_CITA, default: 'PENDIENTE' },
  observaciones: { type: String, trim: true, maxlength: 1000, default: '' },
  solicitud: { type: mongoose.Schema.Types.ObjectId, ref: 'SolicitudCita' },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  historial: [historialSchema],
}, { timestamps: true }); // createdAt = fecha de creación de la cita

citaSchema.index({ profesional: 1, inicio: 1, fin: 1 });
citaSchema.index({ paciente: 1, inicio: -1 });
citaSchema.index({ fecha: 1 });
citaSchema.plugin(baseJSON);

module.exports = mongoose.model('Cita', citaSchema, 'citas');
module.exports.ESTADOS_CITA = ESTADOS_CITA;
module.exports.ESTADOS_QUE_BLOQUEAN = ESTADOS_QUE_BLOQUEAN;
