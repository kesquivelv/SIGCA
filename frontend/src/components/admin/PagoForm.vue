<script setup>
import { ref, onMounted } from 'vue';
import { pagosApi, cajaApi } from '../../api';
import { useToastStore } from '../../stores/toast';
import { useFormulario, reglas } from '../../utils/validators';
import { Q, METODOS, nombreCompleto } from '../../utils/format';
import Modal from '../ui/Modal.vue';
import Campo from '../ui/Campo.vue';
import Boton from '../ui/Boton.vue';

/** Registra un pago o abono de una cita. Exige tener la caja abierta (regla del backend). */
const props = defineProps({ cita: { type: Object, required: true } });
const emit = defineEmits(['cerrar', 'guardado']);
const toast = useToastStore();
const saldo = props.cita.finanzas?.saldo ?? props.cita.precio ?? 0;
const cajaAbierta = ref(null);
const guardando = ref(false);

const { valores, errores, errorGeneral, validar, tocar, aplicarErrorApi } = useFormulario(
  { monto: saldo.toFixed(2), metodo: 'EFECTIVO', referencia: '' },
  {
    monto: [reglas.requerido('Escriba el monto'), reglas.monto({ min: 0.01, max: saldo })],
    metodo: [reglas.requerido('Elija el método')],
    referencia: [reglas.maximo(80)],
  },
);

onMounted(async () => {
  try { cajaAbierta.value = !!(await cajaApi.actual()); } catch { cajaAbierta.value = null; }
});

async function guardar() {
  if (!validar()) return;
  guardando.value = true;
  try {
    const p = await pagosApi.registrar({ cita: props.cita.id, monto: Number(valores.monto), metodo: valores.metodo, referencia: valores.referencia });
    toast.ok(`Pago registrado (${p.comprobante}).`);
    emit('guardado', p);
  } catch (e) {
    aplicarErrorApi(e);
  } finally {
    guardando.value = false;
  }
}
</script>

<template>
  <Modal titulo="Registrar pago" @cerrar="emit('cerrar')">
    <p>
      <strong>{{ nombreCompleto(cita.paciente) }}</strong> · {{ cita.codigo }}<br />
      Precio {{ Q(cita.finanzas?.precio ?? cita.precio) }} · Saldo pendiente <strong class="saldo-pos">{{ Q(saldo) }}</strong>
    </p>
    <p v-if="cajaAbierta === false" class="aviso-form error" role="alert">
      No tiene una caja abierta. <router-link :to="{ name: 'caja' }" @click="emit('cerrar')">Abra su caja diaria</router-link> antes de cobrar.
    </p>
    <form id="form-pago" novalidate @submit.prevent="guardar">
      <p v-if="errorGeneral" class="aviso-form error" role="alert">{{ errorGeneral }}</p>
      <div class="rejilla-form">
        <Campo v-slot="{ id, describedby, invalido }" label="Monto (Q)" :error="errores.monto" requerido ayuda="Puede abonar menos del saldo.">
          <input :id="id" v-model="valores.monto" inputmode="decimal" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('monto')" />
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Método de pago" :error="errores.metodo" requerido>
          <select :id="id" v-model="valores.metodo" :aria-describedby="describedby" :aria-invalid="invalido">
            <option v-for="(t, k) in METODOS" :key="k" :value="k">{{ t }}</option>
          </select>
        </Campo>
      </div>
      <Campo v-if="valores.metodo !== 'EFECTIVO'" v-slot="{ id }" label="Referencia" :error="errores.referencia" ayuda="Número de transferencia o voucher (opcional).">
        <input :id="id" v-model="valores.referencia" maxlength="80" />
      </Campo>
    </form>
    <template #pie>
      <button type="button" class="btn btn-claro" @click="emit('cerrar')">Cancelar</button>
      <Boton tipo="submit" form="form-pago" class="btn-salvia" :cargando="guardando" :disabled="cajaAbierta === false">Registrar pago</Boton>
    </template>
  </Modal>
</template>
