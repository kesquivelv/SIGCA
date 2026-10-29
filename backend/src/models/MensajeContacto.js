const mongoose = require('mongoose');
const baseJSON = require('../utils/baseJSON');

const mensajeSchema = new mongoose.Schema({
  nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 120 },
  correo: {
    type: String, required: [true, 'El correo es obligatorio'], lowercase: true, trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Correo electrónico inválido'],
  },
  telefono: { type: String, required: [true, 'El teléfono es obligatorio'], trim: true, match: [/^[0-9+\-\s()]{8,20}$/, 'Teléfono inválido'] },
  asunto: { type: String, required: [true, 'El asunto es obligatorio'], trim: true, maxlength: 150 },
  mensaje: { type: String, required: [true, 'El mensaje es obligatorio'], trim: true, minlength: [10, 'El mensaje debe tener al menos 10 caracteres'], maxlength: 2000 },
  leido: { type: Boolean, default: false },
}, { timestamps: true });

mensajeSchema.plugin(baseJSON);
module.exports = mongoose.model('MensajeContacto', mensajeSchema, 'mensajesContacto');
