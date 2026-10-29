const Usuario = require('../models/Usuario');
const AppError = require('../utils/AppError');
const { pick, requerir, validarId, escaparRegex } = require('../utils/helpers');

const CAMPOS = ['nombres', 'apellidos', 'correo', 'rol', 'telefono', 'especialidad'];

// GET /api/usuarios?rol=&activo=&q=
exports.listar = async (req, res) => {
  const filtro = {};
  if (req.query.rol) filtro.rol = req.query.rol;
  if (req.query.activo !== undefined && req.query.activo !== '') filtro.activo = req.query.activo === 'true';
  if (req.query.q) {
    const re = new RegExp(escaparRegex(req.query.q), 'i');
    filtro.$or = [{ nombres: re }, { apellidos: re }, { correo: re }];
  }
  res.json(await Usuario.find(filtro).sort({ rol: 1, nombres: 1 }));
};

// GET /api/usuarios/:id
exports.obtener = async (req, res) => {
  validarId(req.params.id);
  const u = await Usuario.findById(req.params.id);
  if (!u) throw new AppError('Usuario no encontrado', 404);
  res.json(u);
};

// POST /api/usuarios
exports.crear = async (req, res) => {
  requerir(req.body, ['nombres', 'apellidos', 'correo', 'rol', 'password']);
  if (String(req.body.password).length < 8) throw new AppError('La contraseña debe tener al menos 8 caracteres', 400);
  const u = await Usuario.create({ ...pick(req.body, CAMPOS), password: String(req.body.password) });
  res.status(201).json(u);
};

// PUT /api/usuarios/:id
exports.actualizar = async (req, res) => {
  validarId(req.params.id);
  const u = await Usuario.findById(req.params.id);
  if (!u) throw new AppError('Usuario no encontrado', 404);
  const datos = pick(req.body, CAMPOS);
  if (String(u._id) === String(req.usuario._id) && datos.rol && datos.rol !== u.rol) {
    throw new AppError('No puede cambiar su propio rol', 422);
  }
  Object.assign(u, datos);
  await u.save();
  res.json(u);
};

// PATCH /api/usuarios/:id/estado  { activo: true|false }
exports.cambiarEstado = async (req, res) => {
  validarId(req.params.id);
  if (typeof req.body.activo !== 'boolean') throw new AppError('El campo activo debe ser true o false', 400);
  if (String(req.params.id) === String(req.usuario._id) && !req.body.activo) {
    throw new AppError('No puede desactivar su propio usuario', 422);
  }
  const u = await Usuario.findByIdAndUpdate(req.params.id, { activo: req.body.activo }, { new: true });
  if (!u) throw new AppError('Usuario no encontrado', 404);
  res.json(u);
};

// PATCH /api/usuarios/:id/password  (restablecimiento protegido: solo ADMINISTRADOR)
exports.restablecerPassword = async (req, res) => {
  validarId(req.params.id);
  requerir(req.body, ['passwordNueva']);
  if (String(req.body.passwordNueva).length < 8) throw new AppError('La contraseña debe tener al menos 8 caracteres', 400);
  const u = await Usuario.findById(req.params.id);
  if (!u) throw new AppError('Usuario no encontrado', 404);
  u.password = String(req.body.passwordNueva);
  await u.save();
  res.json({ mensaje: `Contraseña de ${u.correo} restablecida correctamente` });
};

// GET /api/profesionales  (lista para programar citas; cualquier usuario autenticado)
exports.profesionales = async (req, res) => {
  const filtro = { rol: 'PROFESIONAL' };
  if (req.query.todos !== 'true') filtro.activo = true;
  res.json(await Usuario.find(filtro).select('nombres apellidos especialidad correo telefono activo').sort({ nombres: 1 }));
};
