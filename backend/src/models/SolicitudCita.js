const mongoose = require('mongoose');
const baseJSON = require('../utils/baseJSON');

/** Las solicitudes del portal NO reservan horario: solo quedan pendientes de revisión (RF-06). */
const solicitudSchema = new mongoose.Schema({
  nombreSolicitante: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 120 },
  correo: {
    type: String, required: [true, 'El correo es obligatorio'], lowercase: true, trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Correo electrónico inválido'],
  },
  telefono: { type: String, required: [true, 'El teléfono es obligatorio'], trim: true, match: [/^[0-9+\-\s()]{8,20}$/, 'Teléfono inválido'] },
  servicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio', required: [true, 'El servicio es obligatorio'] },
  fechaPreferida: { type: String, required: [true, 'La fecha preferida es obligatoria'], match: [/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'] },
  mensaje: { type: String, trim: true, maxlength: 1000, default: '' },
  estado: { type: String, enum: ['PENDIENTE', 'ATENDIDA', 'RECHAZADA'], default: 'PENDIENTE' },
  cita: { type: mongoose.Schema.Types.ObjectId, ref: 'Cita' }, // referencia a la cita generada
  atendidaPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  fechaAtencion: Date,
  motivoRechazo: { type: String, trim: true },
}, { timestamps: true });

solicitudSchema.plugin(baseJSON);
module.exports = mongoose.model('SolicitudCita', solicitudSchema, 'solicitudesCita');
