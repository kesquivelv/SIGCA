const mongoose = require('mongoose');
const baseJSON = require('../utils/baseJSON');

/** Un documento por día de la semana (0 = domingo ... 6 = sábado). */
const horarioSchema = new mongoose.Schema({
  dia: { type: Number, min: 0, max: 6, required: true, unique: true },
  nombreDia: { type: String, required: true },
  activo: { type: Boolean, default: true },
  horaInicio: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/, default: '08:00' },
  horaFin: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/, default: '17:00' },
}, { timestamps: true });

horarioSchema.plugin(baseJSON);
module.exports = mongoose.model('Horario', horarioSchema, 'horarios');
