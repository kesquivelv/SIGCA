const mongoose = require('mongoose');
const baseJSON = require('../utils/baseJSON');

/**
 * Publicaciones del portal:
 *  - EDUCATIVO: contenido educativo
 *  - CAPACITACION / ESCUELA_PADRES / ACTIVIDAD: sección Corporativo
 */
const TIPOS_PUBLICACION = ['EDUCATIVO', 'CAPACITACION', 'ESCUELA_PADRES', 'ACTIVIDAD'];

const publicacionSchema = new mongoose.Schema({
  tipo: { type: String, enum: TIPOS_PUBLICACION, required: true },
  titulo: { type: String, required: [true, 'El título es obligatorio'], trim: true, maxlength: 150 },
  descripcion: { type: String, required: [true, 'La descripción es obligatoria'], trim: true, maxlength: 5000 },
  fechaPublicacion: { type: Date, default: Date.now },
  imagenUrl: { type: String, trim: true, default: '' },
  imagenes: [{ type: String, trim: true }], // galería opcional (actividades corporativas)
  enlace: { type: String, trim: true, default: '' },
  activo: { type: Boolean, default: true },
}, { timestamps: true });

publicacionSchema.plugin(baseJSON);
module.exports = mongoose.model('Publicacion', publicacionSchema, 'publicaciones');
module.exports.TIPOS_PUBLICACION = TIPOS_PUBLICACION;
