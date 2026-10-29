const mongoose = require('mongoose');
const baseJSON = require('../utils/baseJSON');
const { calcularEdad } = require('../utils/fechas');

const pacienteSchema = new mongoose.Schema({
  codigo: { type: String, unique: true }, // identificador legible: PAC-0001
  fotoUrl: { type: String, trim: true, default: '' },
  nombres: { type: String, required: [true, 'Los nombres son obligatorios'], trim: true, maxlength: 80 },
  apellidos: { type: String, required: [true, 'Los apellidos son obligatorios'], trim: true, maxlength: 80 },
  fechaNacimiento: {
    type: Date, required: [true, 'La fecha de nacimiento es obligatoria'],
    validate: { validator: (v) => v <= new Date(), message: 'La fecha de nacimiento no puede ser futura' },
  },
  sexo: { type: String, enum: { values: ['MASCULINO', 'FEMENINO'], message: 'Sexo inválido' }, required: [true, 'El sexo es obligatorio'] },
  telefono: { type: String, trim: true, required: [true, 'El teléfono es obligatorio'] },
  direccion: { type: String, trim: true, required: [true, 'La dirección es obligatoria'] },
  fechaInicioProceso: { type: Date, default: Date.now },
  observaciones: { type: String, trim: true, maxlength: 1000, default: '' },
  estado: { type: String, enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' },
}, { timestamps: true });

// La edad NO se guarda: se calcula siempre a partir de la fecha de nacimiento
pacienteSchema.virtual('edad').get(function edad() { return calcularEdad(this.fechaNacimiento); });
pacienteSchema.virtual('nombreCompleto').get(function nombre() { return `${this.nombres} ${this.apellidos}`; });

pacienteSchema.plugin(baseJSON);

module.exports = mongoose.model('Paciente', pacienteSchema, 'pacientes');
