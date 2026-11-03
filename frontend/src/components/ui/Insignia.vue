<script setup>
/** Etiqueta de estado. `mapa` es un objeto { CLAVE: { texto, tono } } (ver utils/format.js). */
defineProps({ valor: String, mapa: { type: Object, required: true } });
</script>

<template>
  <span class="badge" :class="`badge-${mapa[valor]?.tono || 'neutro'}`">{{ mapa[valor]?.texto || valor }}</span>
</template>
