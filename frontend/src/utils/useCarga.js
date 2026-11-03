import { ref, onMounted } from 'vue';

/**
 * Carga datos asíncronos con estados de carga y error.
 *   const { datos, cargando, error, cargar } = useCarga(() => api.listar(), { inicial: [] });
 */
export function useCarga(fn, { inicial = null, auto = true } = {}) {
  const datos = ref(inicial);
  const cargando = ref(false);
  const error = ref('');
  let n = 0;

  async function cargar(...args) {
    const mio = ++n;
    cargando.value = true;
    error.value = '';
    try {
      const r = await fn(...args);
      if (mio === n) datos.value = r;
      return r;
    } catch (e) {
      if (mio === n) error.value = e.mensaje || 'No se pudo cargar la información';
      return undefined;
    } finally {
      if (mio === n) cargando.value = false;
    }
  }
  if (auto) onMounted(() => cargar());
  return { datos, cargando, error, cargar };
}
