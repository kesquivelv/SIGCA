<script setup>
import { ref, watch } from 'vue';
import { solicitudesApi } from '../../api';
import { useToastStore } from '../../stores/toast';
import { usePanelStore } from '../../stores/panel';
import { useCarga } from '../../utils/useCarga';
import { fecha, fechaHora } from '../../utils/format';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Tabla from '../../components/ui/Tabla.vue';
import Confirmar from '../../components/ui/Confirmar.vue';
import CitaForm from '../../components/admin/CitaForm.vue';

const toast = useToastStore();
const panel = usePanelStore();
const estado = ref('PENDIENTE');
const { datos, cargando, error, cargar } = useCarga(() => solicitudesApi.listar({ estado: estado.value }), { inicial: [] });
watch(estado, () => cargar());

const atendiendo = ref(null);
const rechazando = ref(null);
const trabajando = ref(false);
const ESTADOS = { PENDIENTE: ['Pendiente', 'mostaza'], ATENDIDA: ['Atendida', 'salvia'], RECHAZADA: ['Rechazada', 'terracota'] };

const columnas = [
  { key: 'solicitante', label: 'Solicitante' },
  { key: 'contacto', label: 'Contacto' },
  { key: 'servicio', label: 'Servicio' },
  { key: 'preferida', label: 'Fecha preferida' },
  { key: 'estado', label: 'Estado' },
  { key: 'recibida', label: 'Recibida' },
];

async function rechazar(motivo) {
  trabajando.value = true;
  try {
    await solicitudesApi.rechazar(rechazando.value.id, motivo);
    toast.ok('Solicitud rechazada.');
    rechazando.value = null;
    cargar();
    panel.refrescar();
  } catch (e) {
    toast.error(e.mensaje);
  } finally {
    trabajando.value = false;
  }
}
function atendida() { atendiendo.value = null; cargar(); panel.refrescar(); }
</script>

<template>
  <div class="pag-cab">
    <div><h1>Solicitudes de cita</h1><p>Llegan desde el portal público. No reservan horario hasta que usted las atiende.</p></div>
  </div>
  <div class="pestanas" role="tablist" aria-label="Estado de la solicitud">
    <button v-for="(e, k) in ESTADOS" :key="k" type="button" role="tab" :aria-selected="estado === k" @click="estado = k">{{ e[0] }}</button>
  </div>

  <EstadoDatos :cargando="cargando" :error="error" :vacio="!datos.length" texto-vacio="No hay solicitudes en este estado." @reintentar="cargar()">
    <Tabla :columnas="columnas" :filas="datos" con-acciones>
      <template #c-solicitante="{ fila }"><strong>{{ fila.nombreSolicitante }}</strong><br /><span class="texto-suave">{{ fila.mensaje }}</span></template>
      <template #c-contacto="{ fila }">{{ fila.telefono }}<br /><a :href="`mailto:${fila.correo}`">{{ fila.correo }}</a></template>
      <template #c-servicio="{ fila }">{{ fila.servicio?.nombre }}</template>
      <template #c-preferida="{ fila }">{{ fecha(fila.fechaPreferida, { corta: true }) }}</template>
      <template #c-estado="{ fila }">
        <span class="badge" :class="`badge-${ESTADOS[fila.estado][1]}`">{{ ESTADOS[fila.estado][0] }}</span>
        <div v-if="fila.motivoRechazo" class="texto-suave">{{ fila.motivoRechazo }}</div>
        <div v-if="fila.cita" class="texto-suave">Cita {{ fila.cita.codigo }}</div>
      </template>
      <template #c-recibida="{ fila }">{{ fechaHora(fila.createdAt) }}</template>
      <template #acciones="{ fila }">
        <template v-if="fila.estado === 'PENDIENTE'">
          <button type="button" class="btn btn-sm btn-salvia" @click="atendiendo = fila">Atender</button>
          <button type="button" class="btn btn-sm btn-claro" @click="rechazando = fila">Rechazar</button>
        </template>
      </template>
    </Tabla>
    <p v-if="estado === 'PENDIENTE'" class="texto-suave" style="margin-top:12px">¿La persona aún no es paciente? <router-link :to="{ name: 'pacientes', query: { nuevo: '1' } }">Registre primero al paciente</router-link> y luego atienda la solicitud.</p>
  </EstadoDatos>

  <CitaForm v-if="atendiendo" :solicitud="atendiendo" :prefill="{ fecha: atendiendo.fechaPreferida >= new Date().toISOString().slice(0, 10) ? atendiendo.fechaPreferida : '' }" @cerrar="atendiendo = null" @guardado="atendida" />
  <Confirmar v-if="rechazando" titulo="Rechazar solicitud" :mensaje="`Se rechazará la solicitud de ${rechazando.nombreSolicitante}.`" confirmar="Rechazar solicitud" peligro pedir-motivo etiqueta-motivo="Motivo del rechazo" :cargando="trabajando" @cerrar="rechazando = null" @confirmado="rechazar" />
</template>
