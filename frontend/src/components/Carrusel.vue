<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';

const props = defineProps({ items: { type: Array, default: () => [] } });
const i = ref(0);
const pausa = ref(false);
const fallo = ref({});
let timer = null;
const quieto = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const actual = computed(() => props.items[i.value]);

const ir = (n) => { i.value = (n + props.items.length) % props.items.length; };
onMounted(() => {
  if (!quieto) timer = setInterval(() => { if (!pausa.value && props.items.length > 1) ir(i.value + 1); }, 6000);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <section v-if="items.length" class="carrusel" aria-roledescription="carrusel" aria-label="Momentos del centro" @mouseenter="pausa = true" @mouseleave="pausa = false" @focusin="pausa = true" @focusout="pausa = false">
    <div class="pol-marco">
      <figure :key="i" class="polaroid" style="margin:0" aria-live="polite">
        <div class="foto">
          <img v-if="actual.imagenUrl && !fallo[i]" :src="actual.imagenUrl" :alt="actual.titulo || 'Imagen del centro'" @error="fallo[i] = true" />
          <span v-else class="mano" aria-hidden="true">{{ actual.titulo }}</span>
        </div>
        <figcaption>
          <strong>{{ actual.titulo }}</strong>
          <span class="texto-suave">{{ actual.subtitulo }}</span>
        </figcaption>
      </figure>
    </div>
    <div v-if="items.length > 1" class="carrusel-ctl">
      <button type="button" class="btn btn-sm btn-claro" aria-label="Imagen anterior" @click="ir(i - 1)">‹</button>
      <div class="puntos">
        <button v-for="(it, n) in items" :key="n" type="button" class="punto" :aria-current="n === i" :aria-label="`Ir a la imagen ${n + 1}`" @click="ir(n)" />
      </div>
      <button type="button" class="btn btn-sm btn-claro" aria-label="Imagen siguiente" @click="ir(i + 1)">›</button>
    </div>
  </section>
</template>
