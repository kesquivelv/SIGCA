const mongoose = require('mongoose');
const baseJSON = require('../utils/baseJSON');

const servicioSchema = new mongoose.Schema({
  codigo: { type: String, unique: true }, // SRV-0001
  nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, unique: true, maxlength: 100 },
  descripcion: { type: String, required: [true, 'La descripción es obligatoria'], trim: true, maxlength: 1500 },
  duracionMinutos: {
    type: Number, required: [true, 'La duración es obligatoria'],
    min: [15, 'La duración mínima es 15 minutos'], max: [480, 'La duración máxima es 480 minutos'],
    validate: { validator: Number.isInteger, message: 'La duración debe ser un número entero de minutos' },
  },
  // Precio en centavos enteros (RN-28). En JSON se expone también "precio" en quetzales.
  precioCentavos: {
    type: Number, required: [true, 'El precio es obligatorio'], min: [0, 'El precio no puede ser negativo'],
    validate: { validator: Number.isInteger, message: 'Precio inválido' },
  },
  imagenUrl: { type: String, trim: true, default: '' },
  estado: { type: String, enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' },
}, { timestamps: true });

servicioSchema.plugin(baseJSON);
module.exports = mongoose.model('Servicio', servicioSchema, 'servicios');
