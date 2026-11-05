<script setup>
import { iniciales } from '../../utils/format';
defineProps({ persona: Object, grande: Boolean });
</script>

<template>
  <span class="avatar" :class="{ grande }" aria-hidden="true">
    <img v-if="persona?.fotoUrl" :src="persona.fotoUrl" alt="" loading="lazy" />
    <template v-else>{{ iniciales(persona) }}</template>
  </span>
</template>
