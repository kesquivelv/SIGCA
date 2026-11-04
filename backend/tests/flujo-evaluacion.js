/**
 * Prueba de humo del flujo principal. Requiere la API corriendo y datos recién cargados con `npm run seed`.
 * Uso: npm run test:flujo   (variable API_URL opcional, por defecto http://localhost:4000/api)
 */
const API = process.env.API_URL || 'http://localhost:4000/api';
let ok = 0;
let mal = 0;

async function llamar(metodo, ruta, { token, body } = {}) {
  const res = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* sin cuerpo */ }
  return { status: res.status, data };
}
function esperar(nombre, condicion, extra = '') {
  if (condicion) { ok += 1; console.log(`  ✓ ${nombre}`); } else { mal += 1; console.log(`  ✗ ${nombre} ${extra}`); }
}
const login = async (correo, password) => (await llamar('POST', '/auth/login', { body: { correo, password } }));

function diaHabilFuturo(n = 3) {
  const d = new Date();
  let c = 0;
  while (c < n) { d.setDate(d.getDate() + 1); if (d.getDay() >= 1 && d.getDay() <= 5) c += 1; }
  return d.toISOString().slice(0, 10);
}

(async () => {
  console.log('Autenticación');
  let r = await login('admin@sigca.com', 'Admin123!');
  esperar('login administrador', r.status === 200 && r.data.token);
  const admin = r.data.token;
  r = await login('admin@sigca.com', 'incorrecta');
  esperar('contraseña incorrecta -> 401', r.status === 401);
  r = await login('inactivo@sigca.com', 'Inactivo123!');
  esperar('usuario inactivo no ingresa -> 403', r.status === 403);
  const recep = (await login('recepcion1@sigca.com', 'Recep123!')).data.token;
  const recep2 = (await login('recepcion2@sigca.com', 'Recep123!')).data.token;
  const prof = (await login('psicologa@sigca.com', 'Prof123!')).data.token;

  console.log('Permisos por rol');
  esperar('sin token -> 401', (await llamar('GET', '/pacientes')).status === 401);
  esperar('token inválido -> 401', (await llamar('GET', '/pacientes', { token: 'token-invalido' })).status === 401);
  esperar('recepcionista no ve usuarios -> 403', (await llamar('GET', '/usuarios', { token: recep })).status === 403);
  esperar('profesional no crea pacientes -> 403', (await llamar('POST', '/pacientes', { token: prof, body: {} })).status === 403);
  esperar('profesional no ve pagos -> 403', (await llamar('GET', '/pagos', { token: prof })).status === 403);
  const usuariosActivos = (await llamar('GET', '/usuarios', { token: admin })).data;
  const usuarioRecep2 = usuariosActivos.find((u) => u.correo === 'recepcion2@sigca.com');
  r = await llamar('PATCH', `/usuarios/${usuarioRecep2.id}/estado`, { token: admin, body: { activo: false } });
  esperar('administrador desactiva usuario', r.status === 200 && !r.data.activo);
  esperar('JWT de usuario desactivado se rechaza inmediatamente -> 401', (await llamar('GET', '/caja/actual', { token: recep2 })).status === 401);
  r = await llamar('PATCH', `/usuarios/${usuarioRecep2.id}/estado`, { token: admin, body: { activo: true } });
  esperar('administrador reactiva usuario', r.status === 200 && r.data.activo);
  r = await llamar('GET', '/pacientes', { token: prof });
  esperar('profesional solo ve pacientes con cita suya', r.status === 200 && r.data.length > 0 && r.data.length < 10, `(${r.data && r.data.length})`);
  esperar('profesional no recibe teléfono de responsables', r.data.every((p) => p.direccion === undefined));

  console.log('Pacientes y responsables');
  r = await llamar('POST', '/pacientes', { token: recep, body: { nombres: 'Paciente', apellidos: 'Prueba', fechaNacimiento: '2015-05-05', sexo: 'FEMENINO', telefono: '5555-1111', direccion: 'Zona 1' } });
  esperar('crear paciente', r.status === 201 && /^PAC-/.test(r.data.codigo));
  const pac = r.data;
  esperar('edad calculada', Number.isInteger(pac.edad));
  r = await llamar('POST', '/pacientes', { token: recep, body: { nombres: 'X' } });
  esperar('paciente incompleto -> 400', r.status === 400);
  r = await llamar('POST', '/responsables', { token: recep, body: { nombres: 'Resp', apellidos: 'Prueba', parentesco: 'Madre', telefono: '5555-2222', correo: 'resp@correo-demo.com', direccion: 'Zona 2', pacientes: [pac.id] } });
  esperar('crear responsable asociado', r.status === 201 && r.data.pacientes.length === 1);

  console.log('Servicios');
  r = await llamar('GET', '/servicios');
  esperar('servicios públicos activos', r.status === 200 && r.data.length === 5);
  const srv = r.data.find((s) => s.nombre === 'Atención psicológica');
  esperar('precio en quetzales', srv.precio === 250 && srv.precioCentavos === 25000);
  esperar('recepcionista no crea servicios -> 403', (await llamar('POST', '/servicios', { token: recep, body: {} })).status === 403);

  console.log('Citas');
  const profes = (await llamar('GET', '/profesionales', { token: recep })).data;
  const psic = profes.find((p) => p.especialidad.startsWith('Psicolog'));
  const fecha = diaHabilFuturo(3);
  r = await llamar('GET', `/citas/disponibilidad?profesional=${psic.id}&fecha=${fecha}&servicio=${srv.id}`, { token: recep });
  esperar('disponibilidad devuelve horas libres', r.status === 200 && r.data.libres.length > 0);
  const hora = r.data.libres[0];
  r = await llamar('POST', '/citas', { token: recep, body: { paciente: pac.id, servicio: srv.id, profesional: psic.id, fecha, horaInicio: hora } });
  esperar('programar cita', r.status === 201 && /^CIT-/.test(r.data.codigo) && r.data.precioCentavos === 25000, JSON.stringify(r.data));
  const cita = r.data;
  const otrosProfesionales = profes.filter((p) => p.id !== psic.id);
  let citaPacienteTraslapada = false;
  const minutos = (horaTexto) => Number(horaTexto.slice(0, 2)) * 60 + Number(horaTexto.slice(3, 5));
  for (const otro of otrosProfesionales) {
    const disp = await llamar('GET', `/citas/disponibilidad?profesional=${otro.id}&fecha=${fecha}&servicio=${srv.id}`, { token: recep });
    const horaTraslapada = (disp.data?.libres || []).find((h) => (
      minutos(h) < minutos(hora) + srv.duracionMinutos
      && minutos(h) + srv.duracionMinutos > minutos(hora)
    ));
    if (!horaTraslapada) continue;
    r = await llamar('POST', '/citas', { token: recep, body: { paciente: pac.id, servicio: srv.id, profesional: otro.id, fecha, horaInicio: horaTraslapada } });
    esperar('un paciente no puede tener dos citas traslapadas -> 409', r.status === 409 && /paciente/i.test(r.data.mensaje || ''));
    citaPacienteTraslapada = true;
    break;
  }
  esperar('hay disponibilidad alternativa para probar traslape del paciente', citaPacienteTraslapada);
  r = await llamar('POST', '/citas', { token: recep, body: { paciente: pac.id, servicio: srv.id, profesional: psic.id, fecha, horaInicio: hora } });
  esperar('traslape de profesional -> 409', r.status === 409);
  const usuarios = (await llamar('GET', '/usuarios', { token: admin })).data;
  const noProfesional = usuarios.find((u) => u.rol !== 'PROFESIONAL');
  r = await llamar('PUT', `/citas/${cita.id}`, { token: recep, body: { fecha, horaInicio: hora, profesional: noProfesional.id } });
  esperar('reprogramación rechaza asignar un usuario que no es profesional -> 404', r.status === 404);
  r = await llamar('GET', `/citas/disponibilidad?profesional=${psic.id}&fecha=${fecha}&servicio=${srv.id}&excluir=${cita.id}`, { token: recep });
  const nuevaHora = r.data.libres.find((h) => h !== hora);
  r = await llamar('PUT', `/citas/${cita.id}`, { token: recep, body: { fecha, horaInicio: nuevaHora, profesional: psic.id } });
  esperar('reprogramar cita a otro horario disponible', r.status === 200 && r.data.horaInicio === nuevaHora);
  r = await llamar('POST', '/citas', { token: recep, body: { paciente: pac.id, servicio: srv.id, profesional: psic.id, fecha: '2020-01-06', horaInicio: '09:00' } });
  esperar('cita en el pasado -> 422', r.status === 422);
  r = await llamar('POST', '/citas', { token: recep, body: { paciente: pac.id, servicio: srv.id, profesional: psic.id, fecha: diaHabilFuturo(3).replace(/..$/, '') + '00', horaInicio: '03:00' } });
  esperar('fecha inválida o fuera de horario rechazada', [400, 422].includes(r.status));
  r = await llamar('PATCH', `/citas/${cita.id}/estado`, { token: recep, body: { estado: 'CONFIRMADA' } });
  esperar('confirmar cita', r.status === 200 && r.data.estado === 'CONFIRMADA');
  r = await llamar('PATCH', `/citas/${cita.id}/estado`, { token: recep, body: { estado: 'COMPLETADA' } });
  esperar('no completar cita futura -> 422', r.status === 422);

  console.log('Caja y pagos');
  r = await llamar('POST', '/pagos', { token: recep2, body: { cita: cita.id, monto: 50, metodo: 'EFECTIVO' } });
  esperar('pago sin caja abierta -> 422', r.status === 422);
  r = await llamar('GET', '/caja/actual', { token: recep });
  esperar('recepcion1 tiene caja abierta (seed)', r.status === 200 && r.data && r.data.estado === 'ABIERTA');
  const antes = r.data.totalEfectivoCentavos;
  r = await llamar('POST', '/pagos', { token: recep, body: { cita: cita.id, monto: 100, metodo: 'EFECTIVO' } });
  esperar('abono parcial', r.status === 201 && /^CMP-\d{4}-\d{6}$/.test(r.data.comprobante), JSON.stringify(r.data));
  const pago = r.data;
  r = await llamar('POST', '/pagos', { token: recep, body: { cita: cita.id, monto: 200, metodo: 'EFECTIVO' } });
  esperar('abono mayor al saldo -> 422', r.status === 422);
  r = await llamar('GET', `/citas/${cita.id}`, { token: recep });
  esperar('saldo pendiente Q150', r.data.finanzas.saldo === 150 && r.data.finanzas.estadoPago === 'PARCIAL', JSON.stringify(r.data.finanzas));
  r = await llamar('GET', '/caja/actual', { token: recep });
  esperar('caja en vivo suma el efectivo', r.data.totalEfectivoCentavos === antes + 10000);
  r = await llamar('PATCH', `/pagos/${pago.id}/anular`, { token: recep2, body: { motivo: 'Error' } });
  esperar('otra recepcionista no anula -> 403', r.status === 403);
  r = await llamar('PATCH', `/pagos/${pago.id}/anular`, { token: recep, body: { motivo: 'Error de digitación' } });
  esperar('anular pago (no se borra)', r.status === 200 && r.data.estado === 'ANULADO');
  r = await llamar('GET', `/citas/${cita.id}`, { token: recep });
  esperar('el saldo vuelve a Q250', r.data.finanzas.saldo === 250);
  r = await llamar('POST', '/caja/cerrar', { token: recep, body: { efectivoContado: 1 } });
  esperar('cierre con diferencia exige observaciones -> 422', r.status === 422);
  r = await llamar('POST', '/caja/abrir', { token: recep2, body: { montoInicial: 100 } });
  esperar('abrir caja', r.status === 201 && r.data.estado === 'ABIERTA');
  r = await llamar('POST', '/caja/abrir', { token: recep2, body: { montoInicial: 100 } });
  esperar('no abrir dos cajas -> 422', r.status === 422);
  r = await llamar('POST', '/caja/cerrar', { token: recep2, body: { efectivoContado: 100 } });
  esperar('cerrar caja cuadrada', r.status === 200 && r.data.estado === 'CERRADA' && r.data.diferenciaCentavos === 0);

  console.log('Solicitudes del portal');
  r = await llamar('POST', '/publico/solicitudes', { body: { nombreSolicitante: 'Visita Prueba', correo: 'visita@correo-demo.com', telefono: '5555-3333', servicio: srv.id, fechaPreferida: diaHabilFuturo(5) } });
  esperar('solicitud pública', r.status === 201);
  r = await llamar('POST', '/publico/solicitudes', { body: { nombreSolicitante: 'Visita', correo: 'mal', telefono: '1', servicio: srv.id, fechaPreferida: diaHabilFuturo(5) } });
  esperar('solicitud con datos inválidos -> 400', r.status === 400);
  r = await llamar('GET', '/solicitudes?estado=PENDIENTE', { token: recep });
  esperar('lista de pendientes', r.status === 200 && r.data.length >= 4);
  const sol = r.data.find((s) => s.nombreSolicitante === 'Visita Prueba');
  r = await llamar('PATCH', `/solicitudes/${sol.id}/rechazar`, { token: recep, body: { motivo: 'Prueba' } });
  esperar('rechazar solicitud', r.status === 200 && r.data.estado === 'RECHAZADA');

  console.log('Portal y contenido');
  r = await llamar('GET', '/contenido');
  esperar('contenido institucional', r.status === 200 && r.data.misionVision.mision);
  r = await llamar('GET', '/horarios');
  esperar('7 horarios', r.status === 200 && r.data.length === 7);
  r = await llamar('GET', '/publicaciones?tipo=EDUCATIVO');
  esperar('publicaciones educativas', r.status === 200 && r.data.length === 3);
  esperar('recepcionista no edita contenido -> 403', (await llamar('PUT', '/contenido/general', { token: recep, body: { datos: {} } })).status === 403);
  r = await llamar('GET', '/dashboard', { token: admin });
  esperar('dashboard administrador', r.status === 200 && typeof r.data.pacientesActivos === 'number');

  console.log(`\nResultado: ${ok} correctas, ${mal} con error.`);
  process.exit(mal ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
