const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const AppError = require('../utils/AppError');

function extraerToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

/**
 * Verifica el JWT y carga el usuario desde la BD en cada petición.
 * Así, si el administrador desactiva a alguien, su token deja de servir de inmediato (RN-08).
 */
async function proteger(req, res, next) {
  const token = extraerToken(req);
  if (!token) throw new AppError('Debe iniciar sesión para acceder a este recurso', 401);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Sesión inválida o expirada, inicie sesión nuevamente', 401);
  }
  const usuario = await Usuario.findById(payload.id);
  if (!usuario || !usuario.activo) throw new AppError('Usuario inactivo o inexistente', 401);
  req.usuario = usuario;
  next();
}

/** Igual que proteger, pero si no hay token deja pasar como visitante (req.usuario = null). */
async function autenticacionOpcional(req, res, next) {
  req.usuario = null;
  const token = extraerToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(payload.id);
    if (usuario && usuario.activo) req.usuario = usuario;
  } catch { /* token inválido: se trata como visitante */ }
  next();
}

/** Autorización por roles (RN-10). Uso: autorizar('ADMINISTRADOR', 'RECEPCIONISTA') */
const autorizar = (...roles) => (req, res, next) => {
  if (!req.usuario || !roles.includes(req.usuario.rol)) {
    return next(new AppError('No tiene permisos para realizar esta operación', 403));
  }
  next();
};

const generarToken = (usuario) => jwt.sign(
  { id: usuario._id, rol: usuario.rol },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
);

module.exports = { proteger, autenticacionOpcional, autorizar, generarToken };
