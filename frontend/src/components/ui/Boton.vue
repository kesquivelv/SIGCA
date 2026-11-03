<script setup>
/** Botón con estado "guardando" para evitar envíos duplicados. */
defineProps({ cargando: Boolean, tipo: { type: String, default: 'button' } });
</script>

<template>
  <button class="btn" :type="tipo" :disabled="cargando" :aria-busy="cargando">
    <span v-if="cargando" class="giro" aria-hidden="true" />
    <slot />
  </button>
</template>
