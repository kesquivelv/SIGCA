/**
 * Todas las llamadas a la API de SIGCA, agrupadas por módulo.
 * Cada ruta corresponde a un endpoint real de backend/src/routes/index.js.
 */
import http from './http';

const q = (params = {}) => ({ params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)) });

export const authApi = {
  login: (correo, password) => http.post('/auth/login', { correo, password }),
  perfil: () => http.get('/auth/perfil'),
  cambiarPassword: (d) => http.patch('/auth/password', d),
};

export const publicoApi = {
  contenido: () => http.get('/contenido'),
  horarios: () => http.get('/horarios'),
  publicaciones: (tipo) => http.get('/publicaciones', q({ tipo })),
  servicios: () => http.get('/servicios'),
  solicitarCita: (d) => http.post('/publico/solicitudes', d),
  enviarMensaje: (d) => http.post('/publico/contacto', d),
};

export const dashboardApi = { resumen: () => http.get('/dashboard') };

export const usuariosApi = {
  listar: (f) => http.get('/usuarios', q(f)),
  crear: (d) => http.post('/usuarios', d),
  actualizar: (id, d) => http.put(`/usuarios/${id}`, d),
  estado: (id, activo) => http.patch(`/usuarios/${id}/estado`, { activo }),
  password: (id, passwordNueva) => http.patch(`/usuarios/${id}/password`, { passwordNueva }),
  profesionales: (todos) => http.get('/profesionales', q({ todos: todos ? 'true' : '' })),
};

export const pacientesApi = {
  listar: (f) => http.get('/pacientes', q(f)),
  obtener: (id) => http.get(`/pacientes/${id}`),
  crear: (d) => http.post('/pacientes', d),
  actualizar: (id, d) => http.put(`/pacientes/${id}`, d),
  estado: (id, estado) => http.patch(`/pacientes/${id}/estado`, { estado }),
  citas: (id) => http.get(`/pacientes/${id}/citas`),
  pagos: (id) => http.get(`/pacientes/${id}/pagos`),
  materiales: (id) => http.get(`/pacientes/${id}/materiales`),
};

export const responsablesApi = {
  listar: (f) => http.get('/responsables', q(f)),
  obtener: (id) => http.get(`/responsables/${id}`),
  crear: (d) => http.post('/responsables', d),
  actualizar: (id, d) => http.put(`/responsables/${id}`, d),
  asociar: (id, paciente) => http.post(`/responsables/${id}/pacientes`, { paciente }),
  desasociar: (id, pacienteId) => http.delete(`/responsables/${id}/pacientes/${pacienteId}`),
};

export const serviciosApi = {
  listar: (todos = true) => http.get('/servicios', q({ todos: todos ? 'true' : '' })),
  crear: (d) => http.post('/servicios', d),
  actualizar: (id, d) => http.put(`/servicios/${id}`, d),
  estado: (id, estado) => http.patch(`/servicios/${id}/estado`, { estado }),
};

export const citasApi = {
  listar: (f) => http.get('/citas', q(f)),
  obtener: (id) => http.get(`/citas/${id}`),
  crear: (d) => http.post('/citas', d),
  actualizar: (id, d) => http.put(`/citas/${id}`, d),
  estado: (id, estado, motivo) => http.patch(`/citas/${id}/estado`, { estado, motivo }),
  disponibilidad: (f) => http.get('/citas/disponibilidad', q(f)),
};

export const solicitudesApi = {
  listar: (f) => http.get('/solicitudes', q(f)),
  atender: (id, d) => http.post(`/solicitudes/${id}/atender`, d),
  rechazar: (id, motivo) => http.patch(`/solicitudes/${id}/rechazar`, { motivo }),
};

export const materialesApi = {
  listar: (f) => http.get('/materiales', q(f)),
  crear: (d) => http.post('/materiales', d),
  actualizar: (id, d) => http.put(`/materiales/${id}`, d),
  estado: (id, estado) => http.patch(`/materiales/${id}/estado`, { estado }),
  asignaciones: (id) => http.get(`/materiales/${id}/asignaciones`),
  asignar: (id, paciente, indicaciones) => http.post(`/materiales/${id}/asignaciones`, { paciente, indicaciones }),
  quitar: (id, pacienteId) => http.delete(`/materiales/${id}/asignaciones/${pacienteId}`),
};

export const pagosApi = {
  listar: (f) => http.get('/pagos', q(f)),
  registrar: (d) => http.post('/pagos', d),
  anular: (id, motivo) => http.patch(`/pagos/${id}/anular`, { motivo }),
};

export const cajaApi = {
  actual: () => http.get('/caja/actual'),
  abrir: (montoInicial) => http.post('/caja/abrir', { montoInicial }),
  cerrar: (efectivoContado, observaciones) => http.post('/caja/cerrar', { efectivoContado, observaciones }),
  listar: (f) => http.get('/caja', q(f)),
  obtener: (id) => http.get(`/caja/${id}`),
};

export const contenidoApi = {
  guardar: (clave, datos) => http.put(`/contenido/${clave}`, { datos }),
  guardarHorarios: (horarios) => http.put('/horarios', { horarios }),
  publicaciones: (f) => http.get('/publicaciones', q({ ...f, todos: 'true' })),
  crearPublicacion: (d) => http.post('/publicaciones', d),
  actualizarPublicacion: (id, d) => http.put(`/publicaciones/${id}`, d),
  estadoPublicacion: (id, activo) => http.patch(`/publicaciones/${id}/estado`, { activo }),
  mensajes: (f) => http.get('/mensajes', q(f)),
  marcarMensaje: (id, leido) => http.patch(`/mensajes/${id}/leido`, { leido }),
};
