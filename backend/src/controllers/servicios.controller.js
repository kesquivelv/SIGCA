const { Servicio, siguienteCodigo } = require('../models');
const AppError = require('../utils/AppError');
const { aCentavos } = require('../utils/dinero');
const { pick, requerir, validarId } = require('../utils/helpers');

const CAMPOS = ['nombre', 'descripcion', 'duracionMinutos', 'imagenUrl'];
const esPersonal = (req) => req.usuario && ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'].includes(req.usuario.rol);

// GET /api/servicios   (visitantes: solo activos | personal con ?todos=true: todos)
exports.listar = async (req, res) => {
  const filtro = {};
  if (!(esPersonal(req) && req.query.todos === 'true')) filtro.estado = 'ACTIVO';
  res.json(await Servicio.find(filtro).sort({ nombre: 1 }));
};

// GET /api/servicios/:id
exports.obtener = async (req, res) => {
  validarId(req.params.id);
  const s = await Servicio.findById(req.params.id);
  if (!s || (s.estado !== 'ACTIVO' && !esPersonal(req))) throw new AppError('Servicio no encontrado', 404);
  res.json(s);
};

// POST /api/servicios  { nombre, descripcion, duracionMinutos, precio (Q), imagenUrl }
exports.crear = async (req, res) => {
  requerir(req.body, ['nombre', 'descripcion', 'duracionMinutos', 'precio']);
  const s = new Servicio({ ...pick(req.body, CAMPOS), precioCentavos: aCentavos(req.body.precio, 'precio') });
  await s.validate();
  s.codigo = await siguienteCodigo('servicio', 'SRV');
  await s.save();
  res.status(201).json(s);
};

// PUT /api/servicios/:id
// Cambiar el precio NO afecta las citas ya programadas: cada cita guardó su propio precio.
exports.actualizar = async (req, res) => {
  validarId(req.params.id);
  const s = await Servicio.findById(req.params.id);
  if (!s) throw new AppError('Servicio no encontrado', 404);
  Object.assign(s, pick(req.body, CAMPOS));
  if (req.body.precio !== undefined) s.precioCentavos = aCentavos(req.body.precio, 'precio');
  if (req.body.estado) s.estado = req.body.estado;
  await s.save();
  res.json(s);
};

// PATCH /api/servicios/:id/estado
exports.cambiarEstado = async (req, res) => {
  validarId(req.params.id);
  if (!['ACTIVO', 'INACTIVO'].includes(req.body.estado)) throw new AppError('Estado inválido (ACTIVO o INACTIVO)', 400);
  const s = await Servicio.findByIdAndUpdate(req.params.id, { estado: req.body.estado }, { new: true });
  if (!s) throw new AppError('Servicio no encontrado', 404);
  res.json(s);
};
