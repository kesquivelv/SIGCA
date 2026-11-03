<script setup>
import ToastHost from './components/ui/ToastHost.vue';
</script>

<template>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  <router-view />
  <ToastHost />
</template>
