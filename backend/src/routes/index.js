/**
 * Todas las rutas de la API y los roles que pueden usarlas (RN-10).
 * Los permisos se verifican SIEMPRE aquí, aunque el frontend oculte botones.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const { proteger, autenticacionOpcional, autorizar } = require('../middlewares/auth');

const auth = require('../controllers/auth.controller');
const usuarios = require('../controllers/usuarios.controller');
const pacientes = require('../controllers/pacientes.controller');
const responsables = require('../controllers/responsables.controller');
const servicios = require('../controllers/servicios.controller');
const citas = require('../controllers/citas.controller');
const solicitudes = require('../controllers/solicitudes.controller');
const materiales = require('../controllers/materiales.controller');
const pagos = require('../controllers/pagos.controller');
const caja = require('../controllers/caja.controller');
const contenido = require('../controllers/contenido.controller');
const dashboard = require('../controllers/dashboard.controller');

const ADMIN = 'ADMINISTRADOR';
const RECEP = 'RECEPCIONISTA';
const PROF = 'PROFESIONAL';

const limitar = (max, minutos) => (process.env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
    windowMs: minutos * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { mensaje: 'Demasiados intentos. Espere unos minutos e intente de nuevo.' },
  }));

const r = express.Router();

// ---------- Autenticación ----------
r.post('/auth/login', limitar(30, 15), auth.login);
r.get('/auth/perfil', proteger, auth.perfil);
r.patch('/auth/password', proteger, auth.cambiarPassword);

// ---------- Portal público (sin sesión) ----------
r.get('/contenido', contenido.todo);
r.get('/horarios', contenido.listarHorarios);
r.get('/publicaciones', autenticacionOpcional, contenido.listarPublicaciones);
r.get('/publicaciones/:id', autenticacionOpcional, contenido.obtenerPublicacion);
r.get('/servicios', autenticacionOpcional, servicios.listar);
r.get('/servicios/:id', autenticacionOpcional, servicios.obtener);
r.post('/publico/solicitudes', limitar(20, 60), solicitudes.crearPublica);
r.post('/publico/contacto', limitar(20, 60), contenido.enviarMensaje);

// Rutas públicas con los nombres exactos de la sección 8 del enunciado
// (equivalentes a las anteriores; las usa la colección de Postman)
r.post('/solicitudes-cita', limitar(20, 60), solicitudes.crearPublica);
r.post('/contacto', limitar(20, 60), contenido.enviarMensaje);

// ---------- Todo lo que sigue exige sesión ----------
r.use(proteger);

r.get('/dashboard', dashboard.resumen);
r.get('/auth/me', auth.perfil); // nombre del enunciado (equivale a /auth/perfil)

// Usuarios (solo administrador) + lista de profesionales (cualquier usuario autenticado)
r.get('/profesionales', usuarios.profesionales);
r.get('/usuarios', autorizar(ADMIN), usuarios.listar);
r.get('/usuarios/:id', autorizar(ADMIN), usuarios.obtener);
r.post('/usuarios', autorizar(ADMIN), usuarios.crear);
r.put('/usuarios/:id', autorizar(ADMIN), usuarios.actualizar);
r.patch('/usuarios/:id/estado', autorizar(ADMIN), usuarios.cambiarEstado);
r.patch('/usuarios/:id/password', autorizar(ADMIN), usuarios.restablecerPassword);

// Pacientes: el profesional solo consulta (el controlador limita a sus pacientes)
r.get('/pacientes', pacientes.listar);
r.get('/pacientes/:id', pacientes.obtener);
r.get('/pacientes/:id/citas', pacientes.citas);
r.get('/pacientes/:id/materiales', pacientes.materiales);
r.get('/pacientes/:id/pagos', autorizar(ADMIN, RECEP), pacientes.pagos);
r.get('/pacientes/:id/responsables', autorizar(ADMIN, RECEP), pacientes.responsables);
r.post('/pacientes', autorizar(ADMIN, RECEP), pacientes.crear);
r.put('/pacientes/:id', autorizar(ADMIN, RECEP), pacientes.actualizar);
r.patch('/pacientes/:id/estado', autorizar(ADMIN, RECEP), pacientes.cambiarEstado);

// Responsables
r.use('/responsables', autorizar(ADMIN, RECEP));
r.get('/responsables', responsables.listar);
r.get('/responsables/:id', responsables.obtener);
r.post('/responsables', responsables.crear);
r.put('/responsables/:id', responsables.actualizar);
r.post('/responsables/:id/pacientes', responsables.asociar);
r.delete('/responsables/:id/pacientes/:pacienteId', responsables.desasociar);

// Servicios (escritura solo administrador)
r.post('/servicios', autorizar(ADMIN), servicios.crear);
r.put('/servicios/:id', autorizar(ADMIN), servicios.actualizar);
r.patch('/servicios/:id/estado', autorizar(ADMIN), servicios.cambiarEstado);

// Citas
r.get('/citas', citas.listar);
r.get('/citas/disponibilidad', autorizar(ADMIN, RECEP), citas.disponibilidad);
r.get('/citas/:id', citas.obtener);
r.post('/citas', autorizar(ADMIN, RECEP), citas.crear);
r.put('/citas/:id', autorizar(ADMIN, RECEP), citas.actualizar);
r.patch('/citas/:id/estado', citas.cambiarEstado); // el profesional solo puede completar las suyas
r.get('/citas/:id/pagos', autorizar(ADMIN, RECEP), citas.pagos);
r.get('/citas/:id/saldo', autorizar(ADMIN, RECEP), citas.saldo);

// Solicitudes de cita del portal
r.use('/solicitudes', autorizar(ADMIN, RECEP));
r.get('/solicitudes', solicitudes.listar);
r.get('/solicitudes/:id', solicitudes.obtener);
r.post('/solicitudes/:id/atender', solicitudes.atender);
r.patch('/solicitudes/:id/rechazar', solicitudes.rechazar);
r.get('/solicitudes-cita', autorizar(ADMIN, RECEP), solicitudes.listar); // nombre del enunciado
r.post('/solicitudes-cita/:id/atender', autorizar(ADMIN, RECEP), solicitudes.atender);
r.patch('/solicitudes-cita/:id/rechazar', autorizar(ADMIN, RECEP), solicitudes.rechazar);

// Materiales
r.get('/materiales', materiales.listar);
r.get('/materiales/:id', materiales.obtener);
r.get('/materiales/:id/asignaciones', materiales.asignaciones);
r.post('/materiales', autorizar(ADMIN), materiales.crear);
r.put('/materiales/:id', autorizar(ADMIN), materiales.actualizar);
r.patch('/materiales/:id/estado', autorizar(ADMIN), materiales.cambiarEstado);
r.post('/materiales/:id/asignaciones', autorizar(ADMIN, PROF), materiales.asignar);
r.delete('/materiales/:id/asignaciones/:pacienteId', autorizar(ADMIN, PROF), materiales.quitarAsignacion);

// Pagos y caja diaria
r.get('/pagos', autorizar(ADMIN, RECEP), pagos.listar);
r.get('/pagos/:id', autorizar(ADMIN, RECEP), pagos.obtener);
r.post('/pagos', autorizar(ADMIN, RECEP), pagos.registrar);
r.patch('/pagos/:id/anular', autorizar(ADMIN, RECEP), pagos.anular);

r.use('/caja', autorizar(ADMIN, RECEP));
r.get('/caja/actual', caja.actual);
r.post('/caja/abrir', caja.abrir);
r.post('/caja/cerrar', caja.cerrar);
r.get('/caja', caja.listar);
r.get('/caja/:id', caja.obtener);

// Caja con los nombres exactos del enunciado: /api/cajas/...
r.use('/cajas', autorizar(ADMIN, RECEP));
r.post('/cajas/abrir', caja.abrir);
r.get('/cajas/actual', caja.actual);
r.get('/cajas', caja.listar);
r.get('/cajas/:id', caja.obtener);
r.get('/cajas/:id/movimientos', caja.movimientos);
r.post('/cajas/:id/cerrar', caja.cerrarPorId);

// Contenido institucional (edición solo administrador)
r.put('/contenido/:clave', autorizar(ADMIN), contenido.guardar);
r.put('/horarios', autorizar(ADMIN), contenido.guardarHorarios);
r.post('/publicaciones', autorizar(ADMIN), contenido.crearPublicacion);
r.put('/publicaciones/:id', autorizar(ADMIN), contenido.actualizarPublicacion);
r.patch('/publicaciones/:id/estado', autorizar(ADMIN), contenido.estadoPublicacion);

// Mensajes de contacto
r.get('/mensajes', autorizar(ADMIN, RECEP), contenido.listarMensajes);
r.patch('/mensajes/:id/leido', autorizar(ADMIN, RECEP), contenido.marcarMensaje);
r.get('/contacto', autorizar(ADMIN), contenido.listarMensajes); // nombre del enunciado

module.exports = r;
