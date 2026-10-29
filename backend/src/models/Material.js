const mongoose = require('mongoose');
const baseJSON = require('../utils/baseJSON');

const TIPOS_MATERIAL = ['DOCUMENTO', 'VIDEO', 'AUDIO', 'ENLACE', 'ACTIVIDAD', 'OTRO'];

const materialSchema = new mongoose.Schema({
  codigo: { type: String, unique: true }, // MAT-0001
  titulo: { type: String, required: [true, 'El título es obligatorio'], trim: true, maxlength: 150 },
  descripcion: { type: String, required: [true, 'La descripción es obligatoria'], trim: true, maxlength: 1500 },
  tipo: { type: String, enum: { values: TIPOS_MATERIAL, message: 'Tipo de material inválido' }, required: true },
  enlace: {
    type: String, required: [true, 'El enlace es obligatorio'], trim: true,
    match: [/^https?:\/\/.+/i, 'El enlace debe iniciar con http:// o https://'],
  },
  fechaRegistro: { type: Date, default: Date.now },
  estado: { type: String, enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
}, { timestamps: true });

materialSchema.plugin(baseJSON);
module.exports = mongoose.model('Material', materialSchema, 'materiales');
module.exports.TIPOS_MATERIAL = TIPOS_MATERIAL;
