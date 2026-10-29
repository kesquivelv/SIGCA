const mongoose = require('mongoose');
const baseJSON = require('../utils/baseJSON');

/**
 * Relación muchos-a-muchos: un responsable puede estar asociado a varios
 * pacientes y un paciente puede tener varios responsables. La relación se
 * guarda aquí, en el arreglo "pacientes" (referencias).
 */
const responsableSchema = new mongoose.Schema({
  codigo: { type: String, unique: true }, // RES-0001
  fotoUrl: { type: String, trim: true, default: '' },
  nombres: { type: String, required: [true, 'Los nombres son obligatorios'], trim: true },
  apellidos: { type: String, required: [true, 'Los apellidos son obligatorios'], trim: true },
  parentesco: { type: String, required: [true, 'El parentesco es obligatorio'], trim: true },
  telefono: { type: String, required: [true, 'El teléfono es obligatorio'], trim: true },
  correo: {
    type: String, required: [true, 'El correo es obligatorio'], lowercase: true, trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Correo electrónico inválido'],
  },
  direccion: { type: String, required: [true, 'La dirección es obligatoria'], trim: true },
  pacientes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Paciente' }],
}, { timestamps: true });

responsableSchema.virtual('nombreCompleto').get(function n() { return `${this.nombres} ${this.apellidos}`; });
responsableSchema.plugin(baseJSON);

module.exports = mongoose.model('Responsable', responsableSchema, 'responsables');
