/**
 * Validación de formularios, con las mismas reglas que el backend
 * (para dar el aviso antes de enviar; el backend sigue validando siempre).
 */
import { reactive, ref, watch } from 'vue';

const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_TEL = /^[0-9+\-\s()]{8,20}$/;
const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export const reglas = {
  requerido: (msg = 'Este campo es obligatorio') => (v) => (v === null || v === undefined || String(v).trim() === '' ? msg : ''),
  correo: () => (v) => (v && !RE_CORREO.test(String(v).trim()) ? 'Escriba un correo válido, por ejemplo nombre@dominio.com' : ''),
  telefono: () => (v) => (v && !RE_TEL.test(String(v).trim()) ? 'Teléfono inválido (8 a 20 dígitos; puede usar + - y espacios)' : ''),
  minimo: (n) => (v) => (v && String(v).length < n ? `Debe tener al menos ${n} caracteres` : ''),
  maximo: (n) => (v) => (v && String(v).length > n ? `No puede superar ${n} caracteres` : ''),
  fecha: () => (v) => (v && !RE_FECHA.test(v) ? 'Fecha inválida' : ''),
  hora: () => (v) => (v && !RE_HORA.test(v) ? 'Hora inválida' : ''),
  noFutura: () => (v) => (v && String(v).slice(0, 10) > new Date().toISOString().slice(0, 10) ? 'La fecha no puede ser futura' : ''),
  noPasada: () => (v) => {
    if (!v) return '';
    const h = new Date();
    const hoy = `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
    return v < hoy ? 'La fecha no puede ser pasada' : '';
  },
  monto: ({ min = 0.01, max } = {}) => (v) => {
    if (v === '' || v === null || v === undefined) return '';
    const n = Number(v);
    if (!Number.isFinite(n)) return 'Escriba un número válido';
    if (Math.abs(n * 100 - Math.round(n * 100)) > 1e-6) return 'Use como máximo 2 decimales';
    if (n < min) return min === 0 ? 'No puede ser negativo' : `Debe ser mayor o igual a Q${min}`;
    if (max !== undefined && n > max) return `No puede superar Q${max.toFixed(2)}`;
    return '';
  },
  enteroEntre: (min, max) => (v) => {
    if (v === '' || v === null || v === undefined) return '';
    const n = Number(v);
    if (!Number.isInteger(n)) return 'Debe ser un número entero';
    return n < min || n > max ? `Debe estar entre ${min} y ${max}` : '';
  },
  url: () => (v) => (v && !/^https?:\/\/.+/i.test(v) ? 'Debe iniciar con http:// o https://' : ''),
};

/**
 * Uso:
 *   const { valores, errores, validar, aplicarErrorApi } = useFormulario({ nombre: '' }, { nombre: [reglas.requerido()] });
 */
export function useFormulario(inicial, esquema = {}) {
  const valores = reactive({ ...inicial });
  const errores = reactive({});
  const tocados = reactive({});
  const errorGeneral = ref('');

  function validarCampo(campo) {
    const lista = esquema[campo] || [];
    for (const regla of lista) {
      const msg = regla(valores[campo], valores);
      if (msg) { errores[campo] = msg; return false; }
    }
    delete errores[campo];
    return true;
  }
  // El error de un campo desaparece apenas se corrige (al escribir), no al salir del campo:
  // así el diseño no "salta" justo cuando la persona presiona Guardar.
  watch(valores, () => {
    for (const c of Object.keys(errores)) if (esquema[c]) validarCampo(c);
  }, { deep: true, flush: 'sync' });

  function validar() {
    errorGeneral.value = '';
    let ok = true;
    for (const campo of Object.keys(esquema)) {
      tocados[campo] = true;
      if (!validarCampo(campo)) ok = false;
    }
    return ok;
  }
  function tocar(campo) { tocados[campo] = true; validarCampo(campo); }
  /** Muestra bajo cada campo los errores que devolvió el backend. */
  function aplicarErrorApi(err) {
    errorGeneral.value = err.mensaje || 'No se pudo guardar';
    for (const d of err.detalles || []) if (d.campo) errores[d.campo] = d.mensaje;
  }
  function reiniciar(nuevo = inicial) {
    Object.keys(errores).forEach((k) => delete errores[k]);
    Object.keys(tocados).forEach((k) => delete tocados[k]);
    errorGeneral.value = '';
    Object.keys(valores).forEach((k) => delete valores[k]);
    Object.assign(valores, nuevo);
  }
  return { valores, errores, tocados, errorGeneral, validar, tocar, aplicarErrorApi, reiniciar };
}
