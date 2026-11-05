/**
 * Carga datos FICTICIOS de demostración (ningún dato real de pacientes).
 * Uso: npm run seed      (¡BORRA los datos existentes de SIGCA!)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const M = require('../src/models');
const F = require('../src/utils/fechas');
const { totalesPorMetodo } = require('../src/services/finanzas.service');

const img = (seed, w = 1200, h = 500) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const Q = (q) => Math.round(q * 100); // quetzales -> centavos

/** Próximos días hábiles (lunes a viernes) a partir de mañana */
function proximosHabiles(n) {
  const r = [];
  let f = F.hoyLocal();
  while (r.length < n) {
    f = F.sumarDias(f, 1);
    const d = F.diaSemana(f);
    if (d >= 1 && d <= 5) r.push(f);
  }
  return r;
}
/** Días hábiles anteriores a hoy */
function anterioresHabiles(n) {
  const r = [];
  let f = F.hoyLocal();
  while (r.length < n) {
    f = F.sumarDias(f, -1);
    const d = F.diaSemana(f);
    if (d >= 1 && d <= 5) r.push(f);
  }
  return r; // r[0] = día hábil más reciente
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado. Limpiando colecciones...');
  for (const modelo of Object.values(M)) {
    if (modelo && modelo.deleteMany) await modelo.deleteMany({});
  }

  // ---------- Horarios ----------
  const horarios = [
    { dia: 0, activo: false, horaInicio: '08:00', horaFin: '12:00' },
    { dia: 1, activo: true, horaInicio: '08:00', horaFin: '18:00' },
    { dia: 2, activo: true, horaInicio: '08:00', horaFin: '18:00' },
    { dia: 3, activo: true, horaInicio: '08:00', horaFin: '18:00' },
    { dia: 4, activo: true, horaInicio: '08:00', horaFin: '18:00' },
    { dia: 5, activo: true, horaInicio: '08:00', horaFin: '18:00' },
    { dia: 6, activo: true, horaInicio: '08:00', horaFin: '13:00' },
  ];
  await M.Horario.insertMany(horarios.map((h) => ({ ...h, nombreDia: F.DIAS[h.dia] })));

  // ---------- Usuarios (contraseñas se hashean en el modelo) ----------
  const crearU = (d) => M.Usuario.create(d);
  const admin = await crearU({ nombres: 'Ana Lucía', apellidos: 'Morales', correo: 'admin@sigca.com', password: 'Admin123!', rol: 'ADMINISTRADOR', telefono: '5555-0001' });
  const recep1 = await crearU({ nombres: 'Carla', apellidos: 'Pérez', correo: 'recepcion1@sigca.com', password: 'Recep123!', rol: 'RECEPCIONISTA', telefono: '5555-0002' });
  const recep2 = await crearU({ nombres: 'Diego', apellidos: 'Ramírez', correo: 'recepcion2@sigca.com', password: 'Recep123!', rol: 'RECEPCIONISTA', telefono: '5555-0003' });
  const prof1 = await crearU({ nombres: 'Sofía', apellidos: 'Castillo', correo: 'psicologa@sigca.com', password: 'Prof123!', rol: 'PROFESIONAL', especialidad: 'Psicología clínica', telefono: '5555-0004' });
  const prof2 = await crearU({ nombres: 'Javier', apellidos: 'López', correo: 'terapeuta@sigca.com', password: 'Prof123!', rol: 'PROFESIONAL', especialidad: 'Terapia de lenguaje', telefono: '5555-0005' });
  const prof3 = await crearU({ nombres: 'María José', apellidos: 'Herrera', correo: 'auditiva@sigca.com', password: 'Prof123!', rol: 'PROFESIONAL', especialidad: 'Estimulación auditiva verbal', telefono: '5555-0006' });
  await crearU({ nombres: 'Usuario', apellidos: 'Inactivo', correo: 'inactivo@sigca.com', password: 'Inactivo123!', rol: 'RECEPCIONISTA', activo: false });

  // ---------- Servicios ----------
  const datosServ = [
    ['Atención psicológica', 'Sesión individual de evaluación y acompañamiento psicológico para niños, adolescentes y adultos.', 60, 250, 'psicologia'],
    ['Terapia de lenguaje', 'Intervención para dificultades de articulación, fluidez, comprensión y expresión del lenguaje.', 45, 200, 'lenguaje'],
    ['Estimulación auditiva verbal', 'Sesiones para desarrollar la escucha y el lenguaje hablado en niños con pérdida auditiva.', 60, 275, 'auditiva'],
    ['Evaluación psicológica infantil', 'Batería de pruebas e informe para identificar fortalezas y necesidades de desarrollo.', 90, 400, 'evaluacion'],
    ['Orientación familiar', 'Acompañamiento a padres y familias con estrategias de crianza y comunicación.', 60, 300, 'familia'],
  ];
  const servicios = [];
  for (const [nombre, descripcion, dur, precio, seed] of datosServ) {
    servicios.push(await M.Servicio.create({
      codigo: await M.siguienteCodigo('servicio', 'SRV'), nombre, descripcion, duracionMinutos: dur, precioCentavos: Q(precio), imagenUrl: img(seed, 600, 400),
    }));
  }
  const [sPsico, sLeng, sAud, sEval, sFam] = servicios;

  // ---------- Pacientes (6 menores, 4 adultos, 1 inactivo) ----------
  const datosPac = [
    ['Mateo', 'García Ruiz', '2017-03-14', 'MASCULINO'],
    ['Valentina', 'García Ruiz', '2019-08-02', 'FEMENINO'],
    ['Santiago', 'Méndez Ortiz', '2015-11-20', 'MASCULINO'],
    ['Camila', 'Rodríguez Paz', '2012-05-09', 'FEMENINO'],
    ['Sebastián', 'Juárez Lima', '2018-01-30', 'MASCULINO'],
    ['Isabella', 'Cifuentes Mora', '2010-09-17', 'FEMENINO'],
    ['Andrea', 'Sandoval Pineda', '1994-02-11', 'FEMENINO'],
    ['Luis Fernando', 'Ochoa Barrios', '1988-07-25', 'MASCULINO'],
    ['Gabriela', 'Monzón Reyes', '2001-12-03', 'FEMENINO'],
    ['Roberto', 'Aguilar Sic', '1979-04-18', 'MASCULINO', 'INACTIVO'],
  ];
  const pacientes = [];
  for (const [i, [nombres, apellidos, nac, sexo, estado]] of datosPac.entries()) {
    pacientes.push(await M.Paciente.create({
      codigo: await M.siguienteCodigo('paciente', 'PAC'),
      fotoUrl: `https://i.pravatar.cc/200?img=${i + 10}`,
      nombres, apellidos, fechaNacimiento: nac, sexo,
      telefono: `4${String(1000000 + i * 1371).slice(0, 3)}-${String(2000 + i * 37)}`,
      direccion: `${i + 3}a. avenida ${i + 10}-${i + 20}, zona ${(i % 12) + 1}, Ciudad de Guatemala`,
      fechaInicioProceso: F.sumarDias(F.hoyLocal(), -30 * (i + 1)),
      observaciones: 'Paciente de demostración (datos ficticios).',
      estado: estado || 'ACTIVO',
    }));
  }
  const [mateo, valentina, santiago, camila, sebastian, isabella, andrea, luis, gabriela] = pacientes;

  // ---------- Responsables (todos los menores tienen al menos uno) ----------
  const datosResp = [
    ['Patricia', 'Ruiz de García', 'Madre', [mateo, valentina]],
    ['Ernesto', 'García Solís', 'Padre', [mateo, valentina]],
    ['Lucía', 'Ortiz de Méndez', 'Madre', [santiago]],
    ['Marta', 'Paz Rodríguez', 'Abuela', [camila]],
    ['Héctor', 'Juárez Cifuentes', 'Tío', [sebastian, isabella]],
  ];
  for (const [i, [nombres, apellidos, parentesco, pacs]] of datosResp.entries()) {
    await M.Responsable.create({
      codigo: await M.siguienteCodigo('responsable', 'RES'),
      fotoUrl: `https://i.pravatar.cc/200?img=${i + 40}`,
      nombres, apellidos, parentesco,
      telefono: `5${200 + i}-${3000 + i * 11}`,
      correo: `${nombres.toLowerCase()}.${apellidos.split(' ')[0].toLowerCase()}@correo-demo.com`,
      direccion: `Colonia Demo ${i + 1}, Villa Nueva`,
      pacientes: pacs.map((p) => p._id),
    });
  }

  // ---------- Citas (15) ----------
  const pasados = anterioresHabiles(4); // [ayer hábil, antes, ...]
  const futuros = proximosHabiles(5);
  async function cita(paciente, servicio, profesional, fecha, hora, estado, obs = '') {
    const minFin = F.horaAMinutos(hora) + servicio.duracionMinutos;
    const horaFin = F.minutosAHora(minFin);
    return M.Cita.create({
      codigo: await M.siguienteCodigo('cita', 'CIT', 6),
      paciente: paciente._id, servicio: servicio._id, profesional: profesional._id,
      fecha, horaInicio: hora, horaFin,
      inicio: F.aFechaHora(fecha, hora), fin: F.aFechaHora(fecha, horaFin),
      duracionMinutos: servicio.duracionMinutos, precioCentavos: servicio.precioCentavos,
      estado, observaciones: obs, creadoPor: recep1._id,
      historial: [{ accion: 'CREADA', detalle: `${fecha} ${hora}`, usuario: recep1._id }],
    });
  }
  // Pasadas (para pagos y cajas cerradas)
  const c1 = await cita(mateo, sLeng, prof2, pasados[2], '09:00', 'COMPLETADA');
  const c2 = await cita(camila, sPsico, prof1, pasados[2], '10:00', 'COMPLETADA');
  const c3 = await cita(andrea, sPsico, prof1, pasados[2], '14:00', 'COMPLETADA');
  const c4 = await cita(valentina, sAud, prof3, pasados[1], '08:30', 'COMPLETADA');
  const c5 = await cita(luis, sFam, prof1, pasados[1], '11:00', 'COMPLETADA');
  const c6 = await cita(santiago, sEval, prof1, pasados[1], '15:00', 'COMPLETADA');
  const c7 = await cita(gabriela, sPsico, prof1, pasados[0], '09:00', 'CANCELADA', 'Cancelada por la paciente.');
  const c8 = await cita(isabella, sLeng, prof2, pasados[0], '10:00', 'COMPLETADA');
  // Futuras
  const c9 = await cita(mateo, sLeng, prof2, futuros[0], '09:00', 'CONFIRMADA');
  const c10 = await cita(sebastian, sAud, prof3, futuros[0], '10:00', 'PENDIENTE');
  const c11 = await cita(andrea, sPsico, prof1, futuros[0], '14:00', 'CONFIRMADA');
  await cita(camila, sPsico, prof1, futuros[1], '09:00', 'PENDIENTE');
  await cita(gabriela, sFam, prof1, futuros[2], '11:00', 'PENDIENTE');
  await cita(valentina, sAud, prof3, futuros[3], '08:30', 'CONFIRMADA');
  const c15 = await cita(luis, sEval, prof1, futuros[4], '15:00', 'PENDIENTE', 'Generada desde solicitud web');

  // ---------- Cajas y pagos ----------
  const momento = (fecha, hora) => F.aFechaHora(fecha, hora);
  async function pago(cajaDoc, citaDoc, monto, metodo, usuario, fechaHora, anulacion) {
    const n = await M.siguiente('comprobante');
    return M.Pago.create({
      comprobante: `CMP-${F.hoyLocal().slice(0, 4)}-${String(n).padStart(6, '0')}`,
      paciente: citaDoc.paciente, cita: citaDoc._id, caja: cajaDoc._id,
      montoCentavos: Q(monto), metodo, registradoPor: usuario._id, fechaHora,
      ...(anulacion ? {
        estado: 'ANULADO', motivoAnulacion: anulacion, anuladoPor: usuario._id, fechaAnulacion: new Date(fechaHora.getTime() + 600000),
      } : {}),
    });
  }
  async function cerrarCaja(cajaDoc, contadoQ, usuario, fechaCierre) {
    const t = totalesPorMetodo(await M.Pago.find({ caja: cajaDoc._id }));
    const esperado = cajaDoc.montoInicialCentavos + t.totalEfectivoCentavos;
    Object.assign(cajaDoc, t, {
      efectivoEsperadoCentavos: esperado, efectivoContadoCentavos: Q(contadoQ),
      diferenciaCentavos: Q(contadoQ) - esperado, estado: 'CERRADA', fechaCierre, cerradaPor: usuario._id,
    });
    await cajaDoc.save();
  }

  // Caja 1 (recepción 1, CERRADA, cuadrada)
  const caja1 = await M.Caja.create({ codigo: await M.siguienteCodigo('caja', 'CAJ'), usuario: recep1._id, montoInicialCentavos: Q(200), fechaApertura: momento(pasados[2], '07:45') });
  await pago(caja1, c1, 200, 'EFECTIVO', recep1, momento(pasados[2], '09:50')); // completo
  await pago(caja1, c2, 100, 'EFECTIVO', recep1, momento(pasados[2], '11:05')); // abono parcial
  await pago(caja1, c3, 250, 'TRANSFERENCIA', recep1, momento(pasados[2], '15:10')); // completo
  await pago(caja1, c3, 50, 'EFECTIVO', recep1, momento(pasados[2], '15:05'), 'Monto digitado por error, se registró por transferencia'); // anulado
  await cerrarCaja(caja1, 500, recep1, momento(pasados[2], '18:10'));

  // Caja 2 (recepción 2, CERRADA, con faltante de Q10)
  const caja2 = await M.Caja.create({ codigo: await M.siguienteCodigo('caja', 'CAJ'), usuario: recep2._id, montoInicialCentavos: Q(200), fechaApertura: momento(pasados[1], '07:50') });
  await pago(caja2, c4, 275, 'TARJETA', recep2, momento(pasados[1], '09:40')); // completo
  await pago(caja2, c5, 300, 'EFECTIVO', recep2, momento(pasados[1], '12:05')); // completo
  await pago(caja2, c6, 200, 'EFECTIVO', recep2, momento(pasados[1], '16:40')); // parcial (de Q400)
  await pago(caja2, c2, 100, 'TRANSFERENCIA', recep2, momento(pasados[1], '17:00')); // 2.º abono de c2 (queda Q50)
  await cerrarCaja(caja2, 690, recep2, momento(pasados[1], '18:15'));

  // Caja 3 (recepción 1, ABIERTA hoy)
  const hoy = F.hoyLocal();
  const ahora = new Date();
  const caja3 = await M.Caja.create({ codigo: await M.siguienteCodigo('caja', 'CAJ'), usuario: recep1._id, montoInicialCentavos: Q(150), fechaApertura: new Date(ahora.getTime() - 3 * 3600000) });
  await pago(caja3, c8, 200, 'EFECTIVO', recep1, new Date(ahora.getTime() - 2 * 3600000)); // completo
  await pago(caja3, c9, 100, 'TARJETA', recep1, new Date(ahora.getTime() - 3600000)); // anticipo parcial de cita futura
  await pago(caja3, c11, 250, 'TRANSFERENCIA', recep1, new Date(ahora.getTime() - 1800000), 'Transferencia rechazada por el banco'); // anulado

  // ---------- Materiales ----------
  const datosMat = [
    ['Guía de ejercicios de respiración', 'Ejercicios sencillos para manejar la ansiedad en casa.', 'DOCUMENTO', 'https://www.who.int/es'],
    ['Video: sonidos del entorno', 'Video para practicar discriminación auditiva de sonidos cotidianos.', 'VIDEO', 'https://www.youtube.com/'],
    ['Tarjetas de vocabulario', 'Tarjetas imprimibles con imágenes para reforzar vocabulario.', 'ACTIVIDAD', 'https://es.wikipedia.org/wiki/Vocabulario'],
    ['Audio de canciones infantiles', 'Lista de canciones para estimulación auditiva y ritmo.', 'AUDIO', 'https://www.youtube.com/'],
    ['Rutinas visuales para el hogar', 'Plantillas para organizar rutinas diarias con apoyos visuales.', 'DOCUMENTO', 'https://es.wikipedia.org/wiki/Rutina'],
  ];
  const materiales = [];
  for (const [titulo, descripcion, tipo, enlace] of datosMat) {
    materiales.push(await M.Material.create({ codigo: await M.siguienteCodigo('material', 'MAT'), titulo, descripcion, tipo, enlace, creadoPor: admin._id }));
  }
  await M.AsignacionMaterial.create([
    { material: materiales[0]._id, paciente: andrea._id, asignadoPor: prof1._id, indicaciones: 'Practicar 10 minutos diarios.' },
    { material: materiales[1]._id, paciente: valentina._id, asignadoPor: prof3._id, indicaciones: 'Ver con acompañamiento de un adulto.' },
    { material: materiales[2]._id, paciente: mateo._id, asignadoPor: prof2._id, indicaciones: 'Repasar 5 tarjetas por día.' },
    { material: materiales[4]._id, paciente: sebastian._id, asignadoPor: prof3._id },
  ]);

  // ---------- Solicitudes de cita ----------
  await M.SolicitudCita.create([
    { nombreSolicitante: 'Karla Estrada', correo: 'karla.estrada@correo-demo.com', telefono: '5123-4567', servicio: sLeng._id, fechaPreferida: futuros[1], mensaje: 'Mi hijo de 4 años casi no habla.' },
    { nombreSolicitante: 'Pedro Gómez', correo: 'pedro.gomez@correo-demo.com', telefono: '4234-5678', servicio: sPsico._id, fechaPreferida: futuros[2], mensaje: 'Busco terapia por ansiedad.' },
    { nombreSolicitante: 'Rosa Tzul', correo: 'rosa.tzul@correo-demo.com', telefono: '3345-6789', servicio: sAud._id, fechaPreferida: futuros[3] },
    {
      nombreSolicitante: 'Luis Fernando Ochoa', correo: 'luis.ochoa@correo-demo.com', telefono: '5456-7890', servicio: sEval._id, fechaPreferida: futuros[4],
      estado: 'ATENDIDA', cita: c15._id, atendidaPor: recep1._id, fechaAtencion: new Date(),
    },
    {
      nombreSolicitante: 'Usuario de prueba', correo: 'prueba@correo-demo.com', telefono: '5567-8901', servicio: sFam._id, fechaPreferida: futuros[0],
      estado: 'RECHAZADA', motivoRechazo: 'Datos de contacto inválidos', atendidaPor: recep2._id, fechaAtencion: new Date(),
    },
  ]);

  // ---------- Contenido institucional ----------
  await M.ContenidoInstitucional.create([
    {
      clave: 'general',
      datos: {
        nombreCentro: 'Centro Integral Voces y Sentidos',
        eslogan: 'Escuchar, comprender y crecer juntos',
        logoUrl: '',
        descripcion: 'Somos un centro especializado en atención psicológica y estimulación auditiva verbal para niños, adolescentes, adultos y sus familias.',
        carrusel: [1, 2, 3, 4, 5].map((n) => ({ imagenUrl: img(`sigca${n}`), titulo: ['Atención psicológica', 'Terapia de lenguaje', 'Estimulación auditiva', 'Escuela para padres', 'Capacitaciones'][n - 1], subtitulo: 'Acompañamiento profesional y cercano' })),
        piePagina: '© Centro Integral Voces y Sentidos. Todos los derechos reservados.',
      },
    },
    {
      clave: 'misionVision',
      datos: {
        mision: 'Brindar atención psicológica y de estimulación auditiva verbal con calidad humana y profesional, acompañando a cada paciente y su familia en su desarrollo integral.',
        vision: 'Ser el centro de referencia en Guatemala en atención psicológica y desarrollo de la comunicación, reconocido por su ética, calidez e innovación.',
        valores: ['Respeto', 'Empatía', 'Ética profesional', 'Compromiso con la familia', 'Mejora continua'],
      },
    },
    {
      clave: 'contacto',
      datos: {
        telefono: '2222-3333', correo: 'info@vocesysentidos.com', direccion: '6a. avenida 12-34, zona 10, Ciudad de Guatemala',
        whatsapp: '5555-4444', facebook: 'https://facebook.com', instagram: 'https://instagram.com', mapaUrl: '',
      },
    },
  ]);
  await M.Publicacion.create([
    { tipo: 'EDUCATIVO', titulo: 'Señales de alerta en el desarrollo del lenguaje', descripcion: 'Conozca los hitos del lenguaje por edad y cuándo consultar a un especialista.', imagenUrl: img('edu1', 600, 400), fechaPublicacion: F.sumarDias(hoy, -20) },
    { tipo: 'EDUCATIVO', titulo: 'Cómo cuidar la audición de los niños', descripcion: 'Recomendaciones prácticas para prevenir problemas auditivos en casa y en la escuela.', imagenUrl: img('edu2', 600, 400), fechaPublicacion: F.sumarDias(hoy, -10) },
    { tipo: 'EDUCATIVO', titulo: 'Ansiedad en adolescentes: qué hacer', descripcion: 'Estrategias para que las familias acompañen a adolescentes con ansiedad.', imagenUrl: img('edu3', 600, 400), enlace: 'https://www.who.int/es', fechaPublicacion: F.sumarDias(hoy, -3) },
    { tipo: 'CAPACITACION', titulo: 'Taller para docentes: inclusión en el aula', descripcion: 'Capacitación para centros educativos sobre estudiantes con dificultades auditivas y de lenguaje.', imagenUrl: img('cap1', 600, 400), imagenes: [img('cap1a', 600, 400), img('cap1b', 600, 400)] },
    { tipo: 'CAPACITACION', titulo: 'Primeros auxilios psicológicos', descripcion: 'Formación para empresas e instituciones en contención emocional básica.', imagenUrl: img('cap2', 600, 400) },
    { tipo: 'ESCUELA_PADRES', titulo: 'Escuela para padres: crianza positiva', descripcion: 'Ciclo de 6 sesiones mensuales sobre límites, comunicación y manejo de emociones.', imagenUrl: img('esc1', 600, 400), imagenes: [img('esc1a', 600, 400)] },
    { tipo: 'ACTIVIDAD', titulo: 'Jornada de tamizaje auditivo gratuito', descripcion: 'Actividad comunitaria de evaluación auditiva básica para niños de 3 a 10 años.', imagenUrl: img('act1', 600, 400) },
  ]);

  // ---------- Mensajes de contacto ----------
  await M.MensajeContacto.create([
    { nombre: 'Julia Martínez', correo: 'julia@correo-demo.com', telefono: '5011-2233', asunto: 'Información de precios', mensaje: '¿Cuál es el costo de la evaluación infantil?' },
    { nombre: 'Colegio El Sol', correo: 'direccion@colegio-demo.com', telefono: '2211-4455', asunto: 'Capacitación docente', mensaje: 'Nos interesa el taller de inclusión para 20 maestros.', leido: true },
    { nombre: 'Marco Pineda', correo: 'marco@correo-demo.com', telefono: '4011-6677', asunto: 'Horarios sábado', mensaje: '¿Atienden terapia de lenguaje los sábados por la mañana?' },
  ]);

  console.log('\nDatos de prueba cargados correctamente.');
  console.log('------------------------------------------------------------');
  console.log(' Administrador   admin@sigca.com          Admin123!');
  console.log(' Recepcionista   recepcion1@sigca.com     Recep123!   (tiene caja ABIERTA)');
  console.log(' Recepcionista   recepcion2@sigca.com     Recep123!');
  console.log(' Profesional     psicologa@sigca.com      Prof123!');
  console.log(' Profesional     terapeuta@sigca.com      Prof123!');
  console.log(' Profesional     auditiva@sigca.com       Prof123!');
  console.log(' (Inactivo)      inactivo@sigca.com       Inactivo123!  -> no puede iniciar sesión');
  console.log('------------------------------------------------------------');
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('Error al cargar datos:', e);
  await mongoose.disconnect();
  process.exit(1);
});
