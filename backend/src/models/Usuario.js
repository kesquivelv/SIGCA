const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const baseJSON = require('../utils/baseJSON');

const ROLES = ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'];

const usuarioSchema = new mongoose.Schema({
  nombres: { type: String, required: [true, 'Los nombres son obligatorios'], trim: true, maxlength: 80 },
  apellidos: { type: String, required: [true, 'Los apellidos son obligatorios'], trim: true, maxlength: 80 },
  correo: {
    type: String, required: [true, 'El correo es obligatorio'], unique: true, lowercase: true, trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Correo electrónico inválido'],
  },
  // select:false -> el hash nunca se carga en consultas normales (RF-13)
  password: { type: String, required: true, minlength: 8, select: false },
  rol: { type: String, enum: { values: ROLES, message: 'Rol inválido' }, required: true },
  telefono: { type: String, trim: true },
  especialidad: { type: String, trim: true }, // solo aplica al rol PROFESIONAL
  activo: { type: Boolean, default: true },
}, { timestamps: true });

// Hashing de contraseña antes de guardar (nunca texto plano)
usuarioSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

usuarioSchema.methods.compararPassword = function compararPassword(plano) {
  return bcrypt.compare(plano, this.password);
};

usuarioSchema.virtual('nombreCompleto').get(function nombreCompleto() {
  return `${this.nombres} ${this.apellidos}`;
});

usuarioSchema.plugin(baseJSON, { ocultar: ['password'] });

module.exports = mongoose.model('Usuario', usuarioSchema, 'usuarios');
module.exports.ROLES = ROLES;
