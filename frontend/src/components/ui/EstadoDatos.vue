<script setup>
/** Muestra carga, error con reintento o mensaje de vacío; si todo está bien, muestra el contenido. */
defineProps({
  cargando: Boolean,
  error: String,
  vacio: Boolean,
  textoVacio: { type: String, default: 'Todavía no hay información para mostrar.' },
  detalleVacio: String,
});
defineEmits(['reintentar']);
</script>

<template>
  <div v-if="cargando" class="estado" role="status"><span class="cargando-punto" /><p>Cargando…</p></div>
  <div v-else-if="error" class="estado-error" role="alert">
    <strong>{{ error }}</strong>
    <div><button type="button" class="btn btn-sm btn-claro" @click="$emit('reintentar')">Intentar de nuevo</button></div>
  </div>
  <div v-else-if="vacio" class="estado">
    <h3>{{ textoVacio }}</h3>
    <p v-if="detalleVacio">{{ detalleVacio }}</p>
    <slot name="vacio" />
  </div>
  <slot v-else />
</template>
