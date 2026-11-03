<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue';

const props = defineProps({ titulo: String, ancho: Boolean, cerrable: { type: Boolean, default: true } });
const emit = defineEmits(['cerrar']);
const caja = ref(null);
let previo = null;

function tecla(e) {
  if (e.key === 'Escape' && props.cerrable) emit('cerrar');
  if (e.key === 'Tab' && caja.value) {
    const foco = caja.value.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!foco.length) return;
    const primero = foco[0];
    const ultimo = foco[foco.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }
}
onMounted(async () => {
  previo = document.activeElement;
  document.addEventListener('keydown', tecla);
  document.body.style.overflow = 'hidden';
  await nextTick();
  (caja.value?.querySelector('input, select, textarea') || caja.value?.querySelector('.cerrar'))?.focus();
});
onBeforeUnmount(() => {
  document.removeEventListener('keydown', tecla);
  document.body.style.overflow = '';
  previo?.focus?.();
});
</script>

<template>
  <Teleport to="body">
    <div class="modal-fondo" @mousedown.self="cerrable && emit('cerrar')">
      <div ref="caja" class="modal" :class="{ ancho }" role="dialog" aria-modal="true" :aria-label="titulo">
        <header class="modal-cab">
          <h2>{{ titulo }}</h2>
          <button v-if="cerrable" type="button" class="cerrar" aria-label="Cerrar ventana" @click="emit('cerrar')">×</button>
        </header>
        <div class="modal-cuerpo"><slot /></div>
        <footer v-if="$slots.pie" class="modal-pie"><slot name="pie" /></footer>
      </div>
    </div>
  </Teleport>
</template>
