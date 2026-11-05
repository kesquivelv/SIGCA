<script setup>
/** Pequeñas ilustraciones decorativas para encabezados de página. */
defineProps({ tipo: { type: String, default: 'libro' } });
</script>

<template>
  <svg viewBox="0 0 200 160" aria-hidden="true" fill="none" stroke="#3a2b22" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <template v-if="tipo === 'libro'">
      <path d="M100 40c-20-14-50-16-76-8v88c26-8 56-6 76 8 20-14 50-16 76-8V32c-26-8-56-6-76 8z" fill="#fcf6e8" />
      <path d="M100 40v88" /><path d="M38 52c14-3 30-2 46 4M38 72c14-3 30-2 46 4M116 56c16-6 32-7 46-4" />
      <path d="M150 30l6-18 6 18 18 6-18 6-6 18-6-18-18-6z" fill="#e3a82b" transform="translate(-6 -8) scale(.8)" />
    </template>
    <template v-else-if="tipo === 'globos'">
      <path d="M20 30h86q14 0 14 14v30q0 14-14 14H60l-24 20V88H34q-14 0-14-14z" fill="#dbe5cf" />
      <path d="M96 76h72q14 0 14 14v26q0 14-14 14h-6v18l-22-18H96q-14 0-14-14V90q0-14 14-14z" fill="#f0c9b6" />
      <path d="M36 50h54M36 64h34" />
    </template>
    <template v-else-if="tipo === 'sol'">
      <circle cx="100" cy="80" r="36" fill="#e3a82b" />
      <path d="M100 14v18M100 128v18M34 80H16M184 80h-18M53 33l12 12M147 127l12 12M147 33l-12 12M53 127l12-12" />
      <path d="M88 76q4-6 8 0M108 76q4-6 8 0M90 92q12 10 22 0" />
    </template>
    <template v-else>
      <path d="M60 130V96c-16-8-24-24-18-42 6-20 28-30 52-26 26 4 44 24 40 48-2 12-10 18-16 22v32z" fill="#f8e3a8" />
      <path d="M96 66c-2-12 18-12 18 0 0 10-18 12-18 26" />
    </template>
  </svg>
</template>
