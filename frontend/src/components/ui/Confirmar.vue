<script setup>
import { ref } from 'vue';
import Modal from './Modal.vue';
import Boton from './Boton.vue';

/** Confirmación de acciones delicadas. Con `pedirMotivo` exige escribir una razón. */
const props = defineProps({
  titulo: String,
  mensaje: String,
  confirmar: { type: String, default: 'Confirmar' },
  peligro: Boolean,
  pedirMotivo: Boolean,
  etiquetaMotivo: { type: String, default: 'Motivo' },
  cargando: Boolean,
});
const emit = defineEmits(['cerrar', 'confirmado']);
const motivo = ref('');
const error = ref('');

function aceptar() {
  if (props.pedirMotivo && !motivo.value.trim()) { error.value = 'Escriba el motivo para continuar'; return; }
  emit('confirmado', motivo.value.trim());
}
</script>

<template>
  <Modal :titulo="titulo" @cerrar="emit('cerrar')">
    <p>{{ mensaje }}</p>
    <div v-if="pedirMotivo" class="campo" :class="{ 'con-error': error }">
      <label for="motivo-conf">{{ etiquetaMotivo }} <span class="req">*</span></label>
      <textarea id="motivo-conf" v-model="motivo" rows="3" maxlength="300" @input="error = ''" />
      <span v-if="error" class="error-campo" role="alert">{{ error }}</span>
    </div>
    <template #pie>
      <button type="button" class="btn btn-claro" @click="emit('cerrar')">Volver</button>
      <Boton :class="peligro ? 'btn-peligro' : ''" :cargando="cargando" @click="aceptar">{{ confirmar }}</Boton>
    </template>
  </Modal>
</template>
