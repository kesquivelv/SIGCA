<script setup>
import { ref, computed, onMounted } from 'vue';
import { citasApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toast';
import { fecha, fechaHora, Q, nombreCompleto, ESTADO_CITA, ESTADO_PAGO } from '../../utils/format';
import Modal from '../ui/Modal.vue';
import Insignia from '../ui/Insignia.vue';
import Confirmar from '../ui/Confirmar.vue';
import CitaForm from './CitaForm.vue';
import PagoForm from './PagoForm.vue';

const props = defineProps({ citaId: { type: String, required: true } });
const emit = defineEmits(['cerrar', 'cambio']);
const auth = useAuthStore();
const toast = useToastStore();

const cita = ref(null);
const error = ref('');
const trabajando = ref(false);
const dialogo = ref('');

async function cargar() {
  error.value = '';
  try { cita.value = await citasApi.obtener(props.citaId); } catch (e) { error.value = e.mensaje; }
}
onMounted(cargar);

const finanzas = computed(() => cita.value?.finanzas);
const puedeGestionar = computed(() => auth.esPersonalAdministrativo);
const abierta = computed(() => ['PENDIENTE', 'CONFIRMADA'].includes(cita.value?.estado));
const yaInicio = computed(() => cita.value && new Date(cita.value.inicio) <= new Date());
const puedeCompletar = computed(() => cita.value?.estado === 'CONFIRMADA' && yaInicio.value);

async function cambiarEstado(estado, motivo) {
  trabajando.value = true;
  try {
    await citasApi.estado(cita.value.id, estado, motivo);
    toast.ok(estado === 'CONFIRMADA' ? 'Cita confirmada.' : estado === 'COMPLETADA' ? 'Cita completada.' : 'Cita cancelada.');
    dialogo.value = '';
    await cargar();
    emit('cambio');
  } catch (e) {
    toast.error(e.mensaje);
    dialogo.value = '';
  } finally {
    trabajando.value = false;
  }
}
async function despuesDe() { dialogo.value = ''; await cargar(); emit('cambio'); }
</script>

<template>
  <Modal titulo="Detalle de la cita" ancho @cerrar="emit('cerrar')">
    <p v-if="error" class="estado-error" role="alert">{{ error }}</p>
    <p v-else-if="!cita" role="status">Cargando…</p>
    <template v-else>
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:14px">
        <strong style="font-size:1.2rem">{{ cita.codigo }}</strong>
        <Insignia :valor="cita.estado" :mapa="ESTADO_CITA" />
        <Insignia v-if="finanzas && puedeGestionar && cita.estado !== 'CANCELADA'" :valor="finanzas.estadoPago" :mapa="ESTADO_PAGO" />
      </div>
      <div class="rejilla-paneles">
        <dl class="dato">
          <dt>Paciente</dt><dd><router-link :to="{ name: 'paciente', params: { id: cita.paciente.id } }" @click="emit('cerrar')">{{ nombreCompleto(cita.paciente) }}</router-link></dd>
          <dt>Servicio</dt><dd>{{ cita.servicio.nombre }}</dd>
          <dt>Profesional</dt><dd>{{ nombreCompleto(cita.profesional) }}</dd>
          <dt>Fecha</dt><dd>{{ fecha(cita.fecha, { conDia: true }) }}</dd>
          <dt>Horario</dt><dd>{{ cita.horaInicio }} a {{ cita.horaFin }} ({{ cita.duracionMinutos }} min)</dd>
          <dt>Observaciones</dt><dd>{{ cita.observaciones || '—' }}</dd>
        </dl>
        <div v-if="finanzas && puedeGestionar" class="totales" style="align-content:start">
          <div><span>Precio</span><b>{{ Q(finanzas.precio) }}</b></div>
          <div><span>Pagado</span><b>{{ Q(finanzas.pagado) }}</b></div>
          <div><span>Saldo</span><b :class="{ 'saldo-pos': finanzas.saldo > 0 }">{{ Q(finanzas.saldo) }}</b></div>
        </div>
      </div>

      <h3 style="margin-top:18px;font-size:1.05rem">Historial</h3>
      <ul class="lista-simple">
        <li v-for="(h, i) in cita.historial" :key="i">
          <span class="badge">{{ h.accion }}</span>
          <span class="crece">{{ h.detalle || '—' }}</span>
          <span class="texto-suave">{{ h.usuario ? nombreCompleto(h.usuario) : '' }} · {{ fechaHora(h.fecha) }}</span>
        </li>
      </ul>
    </template>

    <template v-if="cita" #pie>
      <button v-if="puedeGestionar && abierta" type="button" class="btn btn-sm btn-claro" :disabled="trabajando" @click="dialogo = 'reprogramar'">Reprogramar</button>
      <button v-if="puedeGestionar && cita.estado === 'PENDIENTE'" type="button" class="btn btn-sm btn-salvia" :disabled="trabajando" @click="cambiarEstado('CONFIRMADA')">Confirmar</button>
      <button v-if="puedeCompletar" type="button" class="btn btn-sm btn-salvia" :disabled="trabajando" @click="cambiarEstado('COMPLETADA')">Marcar como completada</button>
      <button v-if="puedeGestionar && abierta" type="button" class="btn btn-sm btn-peligro" @click="dialogo = 'cancelar'">Cancelar cita</button>
      <button v-if="puedeGestionar && cita.estado !== 'CANCELADA' && finanzas?.saldo > 0" type="button" class="btn btn-sm btn-mostaza" @click="dialogo = 'pago'">Registrar pago</button>
    </template>
  </Modal>

  <CitaForm v-if="dialogo === 'reprogramar'" :cita="cita" @cerrar="dialogo = ''" @guardado="despuesDe" />
  <PagoForm v-if="dialogo === 'pago'" :cita="cita" @cerrar="dialogo = ''" @guardado="despuesDe" />
  <Confirmar v-if="dialogo === 'cancelar'" titulo="Cancelar cita" mensaje="La cita dejará de ocupar el horario del profesional. Esta acción no se puede deshacer." confirmar="Sí, cancelar la cita" peligro pedir-motivo etiqueta-motivo="Motivo de la cancelación" :cargando="trabajando" @cerrar="dialogo = ''" @confirmado="(m) => cambiarEstado('CANCELADA', m)" />
</template>
