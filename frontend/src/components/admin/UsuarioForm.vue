<script setup>
import { ref } from 'vue';
import { usuariosApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toast';
import { useFormulario, reglas } from '../../utils/validators';
import { ROLES } from '../../utils/format';
import Modal from '../ui/Modal.vue';
import Campo from '../ui/Campo.vue';
import Boton from '../ui/Boton.vue';

/** Crear o editar un usuario del sistema. Con `rolFijo` el rol no se puede cambiar (Profesionales). */
const props = defineProps({ usuario: Object, rolFijo: String });
const emit = defineEmits(['cerrar', 'guardado']);
const auth = useAuthStore();
const toast = useToastStore();
const u = props.usuario;
const guardando = ref(false);
const esYo = u && u.id === auth.usuario.id;

const { valores, errores, errorGeneral, validar, tocar, aplicarErrorApi } = useFormulario(
  {
    nombres: u?.nombres || '', apellidos: u?.apellidos || '', correo: u?.correo || '', rol: u?.rol || props.rolFijo || '',
    telefono: u?.telefono || '', especialidad: u?.especialidad || '', password: '',
  },
  {
    nombres: [reglas.requerido('Escriba los nombres'), reglas.maximo(80)],
    apellidos: [reglas.requerido('Escriba los apellidos'), reglas.maximo(80)],
    correo: [reglas.requerido('Escriba el correo'), reglas.correo()],
    rol: [reglas.requerido('Elija un rol')],
    telefono: [reglas.telefono()],
    password: u ? [] : [reglas.requerido('Escriba una contraseña'), reglas.minimo(8)],
  },
);

async function guardar() {
  if (!validar()) return;
  guardando.value = true;
  try {
    const datos = { nombres: valores.nombres, apellidos: valores.apellidos, correo: valores.correo, rol: valores.rol, telefono: valores.telefono, especialidad: valores.rol === 'PROFESIONAL' ? valores.especialidad : '' };
    if (u) await usuariosApi.actualizar(u.id, datos); else await usuariosApi.crear({ ...datos, password: valores.password });
    toast.ok(u ? 'Usuario actualizado.' : 'Usuario creado.');
    emit('guardado');
  } catch (e) {
    aplicarErrorApi(e);
  } finally {
    guardando.value = false;
  }
}
</script>

<template>
  <Modal :titulo="u ? 'Editar usuario' : rolFijo === 'PROFESIONAL' ? 'Nuevo profesional' : 'Nuevo usuario'" @cerrar="emit('cerrar')">
    <form id="form-usuario" novalidate @submit.prevent="guardar">
      <p v-if="errorGeneral" class="aviso-form error" role="alert">{{ errorGeneral }}</p>
      <div class="rejilla-form">
        <Campo v-slot="{ id, describedby, invalido }" label="Nombres" :error="errores.nombres" requerido>
          <input :id="id" v-model="valores.nombres" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('nombres')" />
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Apellidos" :error="errores.apellidos" requerido>
          <input :id="id" v-model="valores.apellidos" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('apellidos')" />
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Correo (será su usuario)" :error="errores.correo" requerido class="ancho-total">
          <input :id="id" v-model="valores.correo" type="email" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('correo')" />
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Rol" :error="errores.rol" requerido :ayuda="esYo ? 'No puede cambiar su propio rol.' : ''">
          <select :id="id" v-model="valores.rol" :disabled="!!rolFijo || esYo" :aria-describedby="describedby" :aria-invalid="invalido">
            <option value="" disabled>Elija un rol</option><option v-for="(t, k) in ROLES" :key="k" :value="k">{{ t }}</option>
          </select>
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Teléfono" :error="errores.telefono">
          <input :id="id" v-model="valores.telefono" type="tel" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('telefono')" />
        </Campo>
        <Campo v-if="valores.rol === 'PROFESIONAL'" v-slot="{ id }" label="Especialidad" class="ancho-total">
          <input :id="id" v-model="valores.especialidad" placeholder="Ej. Terapia de lenguaje" />
        </Campo>
        <Campo v-if="!u" v-slot="{ id, describedby, invalido }" label="Contraseña inicial" :error="errores.password" requerido ayuda="Mínimo 8 caracteres. La persona podrá cambiarla después." class="ancho-total">
          <input :id="id" v-model="valores.password" type="password" autocomplete="new-password" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('password')" />
        </Campo>
      </div>
    </form>
    <template #pie>
      <button type="button" class="btn btn-claro" @click="emit('cerrar')">Cancelar</button>
      <Boton tipo="submit" form="form-usuario" :cargando="guardando">{{ u ? 'Guardar cambios' : 'Crear' }}</Boton>
    </template>
  </Modal>
</template>
