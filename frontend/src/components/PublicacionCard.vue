<script setup>
import { ref, computed } from 'vue';
import { fecha, TIPOS_PUBLICACION } from '../utils/format';

const props = defineProps({ pub: { type: Object, required: true }, mostrarTipo: Boolean });
const abierta = ref(false);
const largo = computed(() => props.pub.descripcion.length > 180);
const texto = computed(() => (abierta.value || !largo.value ? props.pub.descripcion : `${props.pub.descripcion.slice(0, 180).trim()}…`));
const fallo = ref(false);
</script>

<template>
  <article class="pub">
    <div class="pub-img">
      <img v-if="pub.imagenUrl && !fallo" :src="pub.imagenUrl" :alt="pub.titulo" loading="lazy" @error="fallo = true" />
      <span v-else class="mano" aria-hidden="true">sin foto</span>
    </div>
    <div class="pub-cuerpo">
      <span class="pub-fecha">{{ fecha(pub.fechaPublicacion) }}</span>
      <h3>{{ pub.titulo }}</h3>
      <span v-if="mostrarTipo" class="badge badge-salvia" style="align-self:flex-start">{{ TIPOS_PUBLICACION[pub.tipo] }}</span>
      <p style="white-space:pre-line">{{ texto }}</p>
      <button v-if="largo" type="button" class="btn btn-sm btn-fantasma" style="align-self:flex-start" :aria-expanded="abierta" @click="abierta = !abierta">
        {{ abierta ? 'Leer menos' : 'Leer más' }}
      </button>
      <a v-if="pub.enlace" :href="pub.enlace" target="_blank" rel="noopener">Ver más información (se abre en otra pestaña)</a>
      <div v-if="pub.imagenes?.length" class="pub-galeria">
        <img v-for="(im, i) in pub.imagenes.slice(0, 4)" :key="i" :src="im" :alt="`${pub.titulo}, foto ${i + 1}`" loading="lazy" />
      </div>
    </div>
  </article>
</template>
