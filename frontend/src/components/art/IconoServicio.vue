<script setup>
import { computed } from 'vue';

/** Pictograma dibujado a mano, elegido según el nombre del servicio. */
const props = defineProps({ nombre: { type: String, default: '' } });
const tipo = computed(() => {
  const n = props.nombre.toLowerCase();
  if (n.includes('audit')) return 'oido';
  if (n.includes('lenguaje') || n.includes('habla')) return 'habla';
  if (n.includes('famil') || n.includes('orienta')) return 'familia';
  if (n.includes('evalua')) return 'evaluacion';
  return 'mente';
});
</script>

<template>
  <svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="#3a2b22" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <template v-if="tipo === 'oido'">
      <path d="M36 74c-12-10-14-42 8-50 18-6 34 6 32 24-1 14-14 16-16 28-2 10-12 12-18 4" fill="#e3a82b" />
      <path d="M44 42c0-9 14-9 14 0 0 7-9 9-9 18" />
      <path d="M14 38q-6 12 0 24M22 30q-12 20 0 40" stroke="#4f6b4a" />
    </template>
    <template v-else-if="tipo === 'habla'">
      <path d="M14 22h50q8 0 8 8v22q0 8-8 8H40L24 74V60h-10q-8 0-8-8V30q0-8 8-8z" fill="#fcf6e8" />
      <path d="M72 44h14q8 0 8 8v18q0 8-8 8h-4v12L66 78H52" fill="#9bb08c" />
      <path d="M22 36h32M22 46h20" />
    </template>
    <template v-else-if="tipo === 'familia'">
      <circle cx="32" cy="30" r="11" fill="#f0c9b6" /><circle cx="68" cy="30" r="11" fill="#f8e3a8" /><circle cx="50" cy="52" r="8" fill="#dbe5cf" />
      <path d="M12 82c0-18 8-28 20-28s20 10 20 28zM48 82c0-18 8-28 20-28s20 10 20 28z" fill="#fcf6e8" />
      <path d="M40 82c0-10 4-16 10-16s10 6 10 16" fill="#9bb08c" />
    </template>
    <template v-else-if="tipo === 'evaluacion'">
      <rect x="22" y="16" width="56" height="70" rx="8" fill="#fcf6e8" />
      <rect x="36" y="10" width="28" height="14" rx="6" fill="#e3a82b" />
      <path d="M34 42h32M34 54h32M34 66h18" />
      <path d="M58 70l6 6 12-14" stroke="#b8532f" stroke-width="5" />
    </template>
    <template v-else>
      <path d="M30 80V66C18 60 12 48 16 36c4-14 18-22 34-20 18 2 32 14 30 32-1 8-6 12-10 16v16z" fill="#f0c9b6" />
      <path d="M56 40c0-10-14-10-14 0 0 8 14 8 14 18s-14 10-14 0" stroke="#b8532f" />
      <path d="M62 20q4-10 14-10-1 10-14 10z" fill="#9bb08c" />
    </template>
  </svg>
</template>
