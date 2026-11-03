<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { citasApi, usuariosApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toast';
import { nombreCompleto, hoyISO } from '../../utils/format';
import CitaDetalle from '../../components/admin/CitaDetalle.vue';
import CitaForm from '../../components/admin/CitaForm.vue';

const auth = useAuthStore();
const toast = useToastStore();
const COLORES = {
  PENDIENTE: { bg: '#f8e3a8', borde: '#c98f17', txt: '#3a2b22' },
  CONFIRMADA: { bg: '#dbe5cf', borde: '#4f6b4a', txt: '#3a2b22' },
  COMPLETADA: { bg: '#e8d6b0', borde: '#6a5445', txt: '#3a2b22' },
  CANCELADA: { bg: '#f0c9b6', borde: '#b8532f', txt: '#6a5445' },
};

const profesionales = ref([]);
const profesional = ref('');
const rango = ref(null);
const citas = ref([]);
const cargando = ref(false);
const error = ref('');
const detalle = ref('');
const nueva = ref(null);
const cal = ref(null);

onMounted(async () => {
  if (!auth.esProfesional) { try { profesionales.value = await usuariosApi.profesionales(true); } catch { /* opcional */ } }
});

async function cargar() {
  if (!rango.value) return;
  cargando.value = true;
  error.value = '';
  try {
    citas.value = await citasApi.listar({ desde: rango.value.desde, hasta: rango.value.hasta, profesional: profesional.value });
  } catch (e) {
    error.value = e.mensaje;
  } finally {
    cargando.value = false;
  }
}
watch(profesional, cargar);

const eventos = computed(() => citas.value.map((c) => ({
  id: c.id,
  title: `${c.horaInicio} ${nombreCompleto(c.paciente)} · ${c.servicio.nombre}`,
  start: `${c.fecha}T${c.horaInicio}`,
  end: `${c.fecha}T${c.horaFin}`,
  backgroundColor: COLORES[c.estado].bg,
  borderColor: COLORES[c.estado].borde,
  textColor: COLORES[c.estado].txt,
  classNames: c.estado === 'CANCELADA' ? ['cancelada'] : [],
})));

const opciones = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  locale: esLocale,
  initialView: window.innerWidth < 700 ? 'timeGridDay' : 'timeGridWeek',
  headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
  buttonText: { today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' },
  slotMinTime: '07:00:00',
  slotMaxTime: '19:00:00',
  allDaySlot: false,
  height: 'auto',
  nowIndicator: true,
  events: eventos.value,
  eventClick: (info) => { detalle.value = info.event.id; },
  dateClick: (info) => {
    if (!auth.esPersonalAdministrativo) return;
    const f = info.dateStr.slice(0, 10);
    if (f < hoyISO()) { toast.aviso('No se pueden programar citas en fechas pasadas.'); return; }
    nueva.value = { fecha: f, profesional: profesional.value };
  },
  datesSet: (arg) => {
    const fin = new Date(arg.end.getTime() - 1);
    const p = (n) => String(n).padStart(2, '0');
    const f = (d) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    rango.value = { desde: f(arg.start), hasta: f(fin) };
    cargar();
  },
}));
function refrescar() { nueva.value = null; cargar(); }
</script>

<template>
  <div class="pag-cab">
    <div><h1>{{ auth.esProfesional ? 'Mi agenda' : 'Calendario' }}</h1><p>{{ auth.esPersonalAdministrativo ? 'Haga clic en un espacio libre para programar una cita, o en una cita para ver su detalle.' : 'Haga clic en una cita para ver su detalle.' }}</p></div>
    <div v-if="!auth.esProfesional" class="campo" style="margin:0;min-width:220px">
      <label for="cal-prof">Profesional</label>
      <select id="cal-prof" v-model="profesional"><option value="">Todos</option><option v-for="p in profesionales" :key="p.id" :value="p.id">{{ nombreCompleto(p) }}</option></select>
    </div>
  </div>
  <div class="leyenda" aria-label="Colores por estado">
    <span><i style="background:#f8e3a8" />Pendiente</span><span><i style="background:#dbe5cf" />Confirmada</span>
    <span><i style="background:#e8d6b0" />Completada</span><span><i style="background:#f0c9b6" />Cancelada</span>
  </div>
  <p v-if="error" class="estado-error" role="alert">{{ error }} <button type="button" class="btn btn-sm btn-claro" @click="cargar">Intentar de nuevo</button></p>
  <div class="cal-marco" :aria-busy="cargando">
    <FullCalendar ref="cal" :options="opciones" />
  </div>
  <CitaDetalle v-if="detalle" :cita-id="detalle" @cerrar="detalle = ''" @cambio="cargar" />
  <CitaForm v-if="nueva" :prefill="nueva" @cerrar="nueva = null" @guardado="refrescar" />
</template>

<style>
.fc .fc-event.cancelada { text-decoration: line-through; opacity: .75; }
</style>
