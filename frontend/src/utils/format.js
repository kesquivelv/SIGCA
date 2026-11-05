/** Formato de dinero en quetzales: Q1,250.00 */
export function Q(valor) {
  const n = Number(valor || 0);
  const signo = n < 0 ? '-' : '';
  return `${signo}Q${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** "2026-11-03" o ISO -> "3 de noviembre de 2026" (sin desfases de zona horaria). */
export function fecha(valor, { corta = false, conDia = false } = {}) {
  if (!valor) return '—';
  const s = String(valor).slice(0, 10);
  const [a, m, d] = s.split('-').map(Number);
  if (!a) return '—';
  const base = corta ? `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}` : `${d} de ${MESES[m - 1]} de ${a}`;
  if (!conDia) return base;
  const dia = DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
  return `${dia} ${base}`;
}

/** Fecha/hora real (ISO) -> "03/11/2026 14:30" en la zona del navegador. */
export function fechaHora(valor) {
  if (!valor) return '—';
  const d = new Date(valor);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const hoyISO = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const soloFecha = (v) => (v ? String(v).slice(0, 10) : '');
export const nombreCompleto = (o) => (o ? `${o.nombres || ''} ${o.apellidos || ''}`.trim() : '—');
export const iniciales = (o) => (o ? `${(o.nombres || '?')[0]}${(o.apellidos || '')[0] || ''}`.toUpperCase() : '?');

export function edadDe(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const [a, m, d] = String(fechaNacimiento).slice(0, 10).split('-').map(Number);
  const hoy = new Date();
  let e = hoy.getFullYear() - a;
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) e -= 1;
  return e;
}

export function sumarDias(iso, dias) {
  const [a, m, d] = iso.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
}

export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  PROFESIONAL: 'Profesional',
};

export const ESTADO_CITA = {
  PENDIENTE: { texto: 'Pendiente', tono: 'mostaza' },
  CONFIRMADA: { texto: 'Confirmada', tono: 'salvia' },
  COMPLETADA: { texto: 'Completada', tono: 'neutro' },
  CANCELADA: { texto: 'Cancelada', tono: 'terracota' },
};
export const ESTADO_PAGO = {
  PAGADO: { texto: 'Pagado', tono: 'salvia' },
  PARCIAL: { texto: 'Pago parcial', tono: 'mostaza' },
  PENDIENTE: { texto: 'Sin pagar', tono: 'terracota' },
};
export const METODOS = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', TARJETA: 'Tarjeta' };
export const TIPOS_MATERIAL = { DOCUMENTO: 'Documento', VIDEO: 'Video', AUDIO: 'Audio', ENLACE: 'Enlace', ACTIVIDAD: 'Actividad', OTRO: 'Otro' };
export const TIPOS_PUBLICACION = {
  EDUCATIVO: 'Contenido educativo',
  CAPACITACION: 'Capacitación',
  ESCUELA_PADRES: 'Escuela para padres',
  ACTIVIDAD: 'Actividad',
};
