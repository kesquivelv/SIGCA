<script setup>
import { ref } from 'vue';
import { authApi } from '../../api';
import { useToastStore } from '../../stores/toast';
import { useFormulario, reglas } from '../../utils/validators';
import Modal from '../ui/Modal.vue';
import Campo from '../ui/Campo.vue';
import Boton from '../ui/Boton.vue';

const emit = defineEmits(['cerrar']);
const toast = useToastStore();
const cargando = ref(false);
const { valores, errores, errorGeneral, validar, tocar, aplicarErrorApi } = useFormulario(
  { passwordActual: '', passwordNueva: '', confirmarPassword: '' },
  {
    passwordActual: [reglas.requerido('Escriba su contraseña actual')],
    passwordNueva: [reglas.requerido('Escriba la nueva contraseña'), reglas.minimo(8)],
    confirmarPassword: [
      reglas.requerido('Confirme la nueva contraseña'),
      (valor, campos) => valor && valor !== campos.passwordNueva ? 'Las contraseñas no coinciden' : '',
    ],
  },
);

async function guardar() {
  if (!validar()) return;
  cargando.value = true;
  try {
    await authApi.cambiarPassword({
      passwordActual: valores.passwordActual,
      passwordNueva: valores.passwordNueva,
    });
    toast.ok('Contraseña actualizada correctamente.');
    emit('cerrar');
  } catch (e) {
    aplicarErrorApi(e);
  } finally {
    cargando.value = false;
  }
}
</script>

<template>
  <Modal titulo="Cambiar contraseña" @cerrar="emit('cerrar')">
    <form id="form-password-propia" novalidate @submit.prevent="guardar">
      <p v-if="errorGeneral" class="aviso-form error" role="alert">{{ errorGeneral }}</p>
      <Campo v-slot="{ id, describedby, invalido }" label="Contraseña actual" :error="errores.passwordActual" requerido>
        <input :id="id" v-model="valores.passwordActual" type="password" autocomplete="current-password" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('passwordActual')" />
      </Campo>
      <Campo v-slot="{ id, describedby, invalido }" label="Nueva contraseña" :error="errores.passwordNueva" ayuda="Debe tener al menos 8 caracteres." requerido>
        <input :id="id" v-model="valores.passwordNueva" type="password" autocomplete="new-password" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('passwordNueva')" />
      </Campo>
      <Campo v-slot="{ id, describedby, invalido }" label="Confirmar nueva contraseña" :error="errores.confirmarPassword" requerido>
        <input :id="id" v-model="valores.confirmarPassword" type="password" autocomplete="new-password" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('confirmarPassword')" />
      </Campo>
    </form>
    <template #pie>
      <button type="button" class="btn btn-claro" :disabled="cargando" @click="emit('cerrar')">Cancelar</button>
      <Boton tipo="submit" form="form-password-propia" :cargando="cargando">Actualizar contraseña</Boton>
    </template>
  </Modal>
</template>
