<script setup>
import { ref } from 'vue';
import { pacientesApi } from '../../api';
import { useToastStore } from '../../stores/toast';
import { useFormulario, reglas } from '../../utils/validators';
import { soloFecha } from '../../utils/format';
import Modal from '../ui/Modal.vue';
import Campo from '../ui/Campo.vue';
import Boton from '../ui/Boton.vue';
import ImagenInput from '../ui/ImagenInput.vue';

const props = defineProps({ paciente: Object });
const emit = defineEmits(['cerrar', 'guardado']);
const toast = useToastStore();
const p = props.paciente;
const guardando = ref(false);

const { valores, errores, errorGeneral, validar, tocar, aplicarErrorApi } = useFormulario(
  {
    fotoUrl: p?.fotoUrl || '',
    nombres: p?.nombres || '',
    apellidos: p?.apellidos || '',
    fechaNacimiento: soloFecha(p?.fechaNacimiento),
    sexo: p?.sexo || '',
    telefono: p?.telefono || '',
    direccion: p?.direccion || '',
    fechaInicioProceso: soloFecha(p?.fechaInicioProceso),
    observaciones: p?.observaciones || '',
  },
  {
    nombres: [reglas.requerido('Escriba los nombres'), reglas.maximo(80)],
    apellidos: [reglas.requerido('Escriba los apellidos'), reglas.maximo(80)],
    fechaNacimiento: [reglas.requerido('Indique la fecha de nacimiento'), reglas.fecha(), reglas.noFutura()],
    sexo: [reglas.requerido('Elija el sexo')],
    telefono: [reglas.requerido('Escriba un teléfono'), reglas.telefono()],
    direccion: [reglas.requerido('Escriba la dirección')],
    observaciones: [reglas.maximo(1000)],
  },
);

async function guardar() {
  if (!validar()) return;
  guardando.value = true;
  try {
    const datos = { ...valores };
    if (!datos.fechaInicioProceso) delete datos.fechaInicioProceso;
    const r = p ? await pacientesApi.actualizar(p.id, datos) : await pacientesApi.crear(datos);
    toast.ok(p ? 'Datos del paciente actualizados.' : `Paciente registrado (${r.codigo}).`);
    emit('guardado', r);
  } catch (e) {
    aplicarErrorApi(e);
  } finally {
    guardando.value = false;
  }
}
</script>

<template>
  <Modal :titulo="p ? 'Editar paciente' : 'Nuevo paciente'" ancho @cerrar="emit('cerrar')">
    <form id="form-paciente" novalidate @submit.prevent="guardar">
      <p v-if="errorGeneral" class="aviso-form error" role="alert">{{ errorGeneral }}</p>
      <ImagenInput v-model="valores.fotoUrl" label="Fotografía (opcional)" />
      <div class="rejilla-form">
        <Campo v-slot="{ id, describedby, invalido }" label="Nombres" :error="errores.nombres" requerido>
          <input :id="id" v-model="valores.nombres" maxlength="80" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('nombres')" />
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Apellidos" :error="errores.apellidos" requerido>
          <input :id="id" v-model="valores.apellidos" maxlength="80" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('apellidos')" />
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Fecha de nacimiento" :error="errores.fechaNacimiento" requerido ayuda="La edad se calcula sola.">
          <input :id="id" v-model="valores.fechaNacimiento" type="date" :max="new Date().toISOString().slice(0, 10)" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('fechaNacimiento')" />
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Sexo" :error="errores.sexo" requerido>
          <select :id="id" v-model="valores.sexo" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('sexo')">
            <option value="" disabled>Elija una opción</option><option value="FEMENINO">Femenino</option><option value="MASCULINO">Masculino</option>
          </select>
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Teléfono" :error="errores.telefono" requerido>
          <input :id="id" v-model="valores.telefono" type="tel" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('telefono')" />
        </Campo>
        <Campo v-slot="{ id }" label="Inicio del proceso" :error="errores.fechaInicioProceso" ayuda="Si lo deja vacío se usa la fecha de hoy.">
          <input :id="id" v-model="valores.fechaInicioProceso" type="date" />
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Dirección" :error="errores.direccion" requerido class="ancho-total">
          <input :id="id" v-model="valores.direccion" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('direccion')" />
        </Campo>
        <Campo v-slot="{ id }" label="Observaciones" :error="errores.observaciones" class="ancho-total">
          <textarea :id="id" v-model="valores.observaciones" rows="3" maxlength="1000" />
        </Campo>
      </div>
    </form>
    <template #pie>
      <button type="button" class="btn btn-claro" @click="emit('cerrar')">Cancelar</button>
      <Boton tipo="submit" form="form-paciente" :cargando="guardando">{{ p ? 'Guardar cambios' : 'Registrar paciente' }}</Boton>
    </template>
  </Modal>
</template>
