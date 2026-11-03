<script setup>
import { ref } from 'vue';
import { Q } from '../utils/format';
import IconoServicio from './art/IconoServicio.vue';

defineProps({ servicio: { type: Object, required: true }, completo: Boolean });
const fallo = ref(false);
</script>

<template>
  <article class="serv">
    <div class="serv-arte">
      <img v-if="completo && servicio.imagenUrl && !fallo" :src="servicio.imagenUrl" :alt="`Imagen de ${servicio.nombre}`" loading="lazy" @error="fallo = true" />
      <IconoServicio v-else :nombre="servicio.nombre" />
    </div>
    <div class="serv-cuerpo">
      <h3>{{ servicio.nombre }}</h3>
      <p>{{ completo ? servicio.descripcion : `${servicio.descripcion.slice(0, 110).trim()}${servicio.descripcion.length > 110 ? '…' : ''}` }}</p>
      <div class="serv-meta">
        <span class="badge">{{ servicio.duracionMinutos }} min</span>
        <span class="badge badge-mostaza">{{ Q(servicio.precio) }}</span>
      </div>
      <router-link class="btn btn-sm" :to="{ name: 'solicitar-cita', query: { servicio: servicio.id } }">Solicitar esta cita</router-link>
    </div>
  </article>
</template>
