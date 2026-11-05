<script setup>
/** Iconos sencillos de línea para el menú del panel. */
defineProps({ nombre: { type: String, required: true } });
const rutas = {
  inicio: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  calendario: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  citas: 'M5 4h14v16H5zM9 9h6M9 13h6M9 17h3',
  solicitudes: 'M3 6h18v12H3zM3 7l9 7 9-7',
  pacientes: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-5 4-7 8-7s8 2 8 7',
  responsables: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-4 3-6 6-6s6 2 6 6M17 10a2.5 2.5 0 100-5M18 14c2 .5 3 2.5 3 5',
  profesionales: 'M12 3l9 4-9 4-9-4zM7 10v5c0 2 10 2 10 0v-5',
  servicios: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  materiales: 'M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2zM4 19a2 2 0 012-2h12',
  pagos: 'M3 7h18v11H3zM3 11h18M7 15h3',
  caja: 'M4 9l2-5h12l2 5M4 9h16v11H4zM10 14h4',
  usuarios: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z',
  contenido: 'M4 4h16v16H4zM8 9h8M8 13h8M8 17h4',
  mensajes: 'M4 5h16v11H9l-5 4z',
  salir: 'M10 4H5v16h5M15 8l5 4-5 4M20 12H9',
};
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="rutas[nombre]" />
  </svg>
</template>
