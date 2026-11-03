<script setup>
import { useToastStore } from '../../stores/toast';
const toast = useToastStore();
</script>

<template>
  <div class="toasts" aria-live="polite" role="status">
    <div v-for="t in toast.items" :key="t.id" class="toast" :class="t.tipo">
      <span>{{ t.texto }}</span>
      <button type="button" aria-label="Cerrar aviso" @click="toast.quitar(t.id)">×</button>
    </div>
  </div>
</template>
