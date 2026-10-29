const mongoose = require('mongoose');
const baseJSON = require('../utils/baseJSON');

const asignacionSchema = new mongoose.Schema({
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
  asignadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fechaAsignacion: { type: Date, default: Date.now },
  indicaciones: { type: String, trim: true, maxlength: 500, default: '' },
}, { timestamps: true });

asignacionSchema.index({ material: 1, paciente: 1 }, { unique: true });
asignacionSchema.plugin(baseJSON);
module.exports = mongoose.model('AsignacionMaterial', asignacionSchema, 'asignacionesMateriales');
