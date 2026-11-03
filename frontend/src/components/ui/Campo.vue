<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  error: String,
  ayuda: String,
  requerido: Boolean,
  id: String,
});
const uid = computed(() => props.id || `c-${props.label.replace(/\W+/g, '-').toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`);
</script>

<template>
  <div class="campo" :class="{ 'con-error': error }">
    <label :for="uid">{{ label }}<span v-if="requerido" class="req" aria-hidden="true"> *</span></label>
    <slot :id="uid" :describedby="error ? `${uid}-e` : ayuda ? `${uid}-a` : undefined" :invalido="!!error" />
    <span v-if="ayuda && !error" :id="`${uid}-a`" class="ayuda">{{ ayuda }}</span>
    <span v-if="error" :id="`${uid}-e`" class="error-campo" role="alert">{{ error }}</span>
  </div>
</template>
