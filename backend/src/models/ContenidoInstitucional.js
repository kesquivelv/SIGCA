const mongoose = require('mongoose');
const baseJSON = require('../utils/baseJSON');

/**
 * Contenido editable del portal, un documento por "clave":
 *  - general:      nombreCentro, eslogan, logoUrl, descripcion, carrusel[], piePagina
 *  - misionVision: mision, vision, valores[]
 *  - contacto:     telefono, correo, direccion, whatsapp, facebook, instagram, mapaUrl
 * Las publicaciones educativas y corporativas están en la colección "publicaciones".
 */
const CLAVES = ['general', 'misionVision', 'contacto'];

const contenidoSchema = new mongoose.Schema({
  clave: { type: String, enum: CLAVES, required: true, unique: true },
  datos: { type: mongoose.Schema.Types.Mixed, default: {} },
  actualizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
}, { timestamps: true, minimize: false });

contenidoSchema.plugin(baseJSON);
module.exports = mongoose.model('ContenidoInstitucional', contenidoSchema, 'contenidoInstitucional');
module.exports.CLAVES = CLAVES;
