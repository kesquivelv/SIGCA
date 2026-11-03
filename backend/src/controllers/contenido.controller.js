/**
 * Contenido institucional del portal: contenido por clave, publicaciones,
 * horarios de atención y mensajes de contacto.
 */
const {
  ContenidoInstitucional, Publicacion, Horario, MensajeContacto,
} = require('../models');
const { CLAVES } = require('../models/ContenidoInstitucional');
const { TIPOS_PUBLICACION } = require('../models/Publicacion');
const AppError = require('../utils/AppError');
const F = require('../utils/fechas');
const { pick, requerir, validarId } = require('../utils/helpers');

const esPersonal = (req) => !!req.usuario;

// ---------- Contenido institucional ----------
// GET /api/contenido  -> { general, misionVision, contacto }
exports.todo = async (req, res) => {
  const docs = await ContenidoInstitucional.find();
  const r = { general: {}, misionVision: {}, contacto: {} };
  docs.forEach((d) => { r[d.clave] = d.datos; });
  res.json(r);
};

// PUT /api/contenido/:clave  { datos }
exports.guardar = async (req, res) => {
  const { clave } = req.params;
  if (!CLAVES.includes(clave)) throw new AppError('Sección de contenido desconocida', 404);
  const { datos } = req.body;
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) throw new AppError('Los datos del contenido son inválidos', 400);
  const doc = await ContenidoInstitucional.findOneAndUpdate(
    { clave },
    { datos, actualizadoPor: req.usuario._id },
    { new: true, upsert: true, runValidators: true },
  );
  res.json(doc);
};

// ---------- Publicaciones ----------
const CAMPOS_PUB = ['tipo', 'titulo', 'descripcion', 'fechaPublicacion', 'imagenUrl', 'imagenes', 'enlace'];

// GET /api/publicaciones?tipo=&todos=true (todos solo para personal)
exports.listarPublicaciones = async (req, res) => {
  const filtro = {};
  if (req.query.tipo) {
    const tipos = String(req.query.tipo).split(',');
    filtro.tipo = { $in: tipos };
  }
  if (!(esPersonal(req) && req.query.todos === 'true')) filtro.activo = true;
  res.json(await Publicacion.find(filtro).sort({ fechaPublicacion: -1 }));
};

// GET /api/publicaciones/:id
exports.obtenerPublicacion = async (req, res) => {
  validarId(req.params.id);
  const p = await Publicacion.findById(req.params.id);
  if (!p || (!p.activo && !esPersonal(req))) throw new AppError('Publicación no encontrada', 404);
  res.json(p);
};

exports.crearPublicacion = async (req, res) => {
  requerir(req.body, ['tipo', 'titulo', 'descripcion']);
  if (!TIPOS_PUBLICACION.includes(req.body.tipo)) throw new AppError('Tipo de publicación inválido', 400);
  res.status(201).json(await Publicacion.create(pick(req.body, CAMPOS_PUB)));
};

exports.actualizarPublicacion = async (req, res) => {
  validarId(req.params.id);
  const p = await Publicacion.findById(req.params.id);
  if (!p) throw new AppError('Publicación no encontrada', 404);
  Object.assign(p, pick(req.body, CAMPOS_PUB));
  await p.save();
  res.json(p);
};

exports.estadoPublicacion = async (req, res) => {
  validarId(req.params.id);
  if (typeof req.body.activo !== 'boolean') throw new AppError('El campo activo debe ser true o false', 400);
  const p = await Publicacion.findByIdAndUpdate(req.params.id, { activo: req.body.activo }, { new: true });
  if (!p) throw new AppError('Publicación no encontrada', 404);
  res.json(p);
};

// ---------- Horarios ----------
// GET /api/horarios
exports.listarHorarios = async (req, res) => {
  res.json(await Horario.find().sort({ dia: 1 }));
};

// PUT /api/horarios  { horarios: [{ dia, activo, horaInicio, horaFin }] }
exports.guardarHorarios = async (req, res) => {
  const { horarios } = req.body;
  if (!Array.isArray(horarios) || !horarios.length) throw new AppError('Envíe la lista de horarios', 400);
  for (const h of horarios) {
    if (!Number.isInteger(h.dia) || h.dia < 0 || h.dia > 6) throw new AppError('Día inválido', 400);
    if (!F.esHoraValida(h.horaInicio) || !F.esHoraValida(h.horaFin)) throw new AppError(`Hora inválida el ${F.DIAS[h.dia]}`, 400);
    if (h.activo !== false && F.horaAMinutos(h.horaInicio) >= F.horaAMinutos(h.horaFin)) {
      throw new AppError(`El ${F.DIAS[h.dia]}: la hora de inicio debe ser menor que la de fin`, 422);
    }
  }
  await Promise.all(horarios.map((h) => Horario.findOneAndUpdate(
    { dia: h.dia },
    {
      dia: h.dia, nombreDia: F.DIAS[h.dia], activo: h.activo !== false, horaInicio: h.horaInicio, horaFin: h.horaFin,
    },
    { upsert: true, new: true },
  )));
  res.json(await Horario.find().sort({ dia: 1 }));
};

// ---------- Mensajes de contacto ----------
// POST /api/publico/contacto
exports.enviarMensaje = async (req, res) => {
  requerir(req.body, ['nombre', 'correo', 'telefono', 'asunto', 'mensaje']);
  await MensajeContacto.create(pick(req.body, ['nombre', 'correo', 'telefono', 'asunto', 'mensaje']));
  res.status(201).json({ mensaje: 'Gracias por escribirnos. Le responderemos pronto.' });
};

// GET /api/mensajes?leido=
exports.listarMensajes = async (req, res) => {
  const filtro = {};
  if (req.query.leido !== undefined && req.query.leido !== '') filtro.leido = req.query.leido === 'true';
  res.json(await MensajeContacto.find(filtro).sort({ createdAt: -1 }).limit(300));
};

// PATCH /api/mensajes/:id/leido  { leido }
exports.marcarMensaje = async (req, res) => {
  validarId(req.params.id);
  const m = await MensajeContacto.findByIdAndUpdate(req.params.id, { leido: req.body.leido !== false }, { new: true });
  if (!m) throw new AppError('Mensaje no encontrado', 404);
  res.json(m);
};
