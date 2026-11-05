<script setup>
/**
 * Tabla responsiva. columnas: [{ key, label, clase }]. Cada celda se puede personalizar con
 * el slot `#c-<key>="{ fila }"` y la columna de acciones con `#acciones="{ fila }"`.
 * En móvil cada fila se convierte en una tarjeta.
 */
defineProps({
  columnas: { type: Array, required: true },
  filas: { type: Array, required: true },
  conAcciones: Boolean,
  clave: { type: String, default: 'id' },
  etiquetaAcciones: { type: String, default: 'Acciones' },
});
</script>

<template>
  <div class="tabla-marco">
    <table class="tabla">
      <thead>
        <tr>
          <th v-for="c in columnas" :key="c.key" :class="c.clase" scope="col">{{ c.label }}</th>
          <th v-if="conAcciones" scope="col" class="acciones">{{ etiquetaAcciones }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="fila in filas" :key="fila[clave]">
          <td v-for="c in columnas" :key="c.key" :class="c.clase" :data-label="c.label">
            <slot :name="`c-${c.key}`" :fila="fila">{{ fila[c.key] }}</slot>
          </td>
          <td v-if="conAcciones" class="acciones"><slot name="acciones" :fila="fila" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
