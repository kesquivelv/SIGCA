const Usuario = require('../models/Usuario');
const AppError = require('../utils/AppError');
const { requerir } = require('../utils/helpers');
const { generarToken } = require('../middlewares/auth');

// POST /api/auth/login  { correo, password }  -> { token, usuario }
exports.login = async (req, res) => {
  requerir(req.body, ['correo', 'password']);
  const correo = String(req.body.correo).toLowerCase().trim();
  const usuario = await Usuario.findOne({ correo }).select('+password');
  const valido = usuario && (await usuario.compararPassword(String(req.body.password)));
  if (!valido) throw new AppError('Correo o contraseña incorrectos', 401);
  if (!usuario.activo) throw new AppError('Su usuario está inactivo. Comuníquese con el administrador', 403);
  res.json({ token: generarToken(usuario), usuario: usuario.toJSON() });
};

// GET /api/auth/perfil
exports.perfil = async (req, res) => {
  res.json(req.usuario);
};

// PATCH /api/auth/password  { passwordActual, passwordNueva }
exports.cambiarPassword = async (req, res) => {
  requerir(req.body, ['passwordActual', 'passwordNueva']);
  if (String(req.body.passwordNueva).length < 8) throw new AppError('La contraseña nueva debe tener al menos 8 caracteres', 400);
  const u = await Usuario.findById(req.usuario._id).select('+password');
  if (!(await u.compararPassword(String(req.body.passwordActual)))) throw new AppError('La contraseña actual es incorrecta', 400);
  u.password = String(req.body.passwordNueva);
  await u.save();
  res.json({ mensaje: 'Contraseña actualizada correctamente' });
};
