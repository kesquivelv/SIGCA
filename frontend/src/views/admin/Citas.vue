<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { citasApi, usuariosApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
import { useCarga } from '../../utils/useCarga';
import { fecha, hoyISO, sumarDias, Q, nombreCompleto, ESTADO_CITA, ESTADO_PAGO } from '../../utils/format';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Tabla from '../../components/ui/Tabla.vue';
import Insignia from '../../components/ui/Insignia.vue';
import CitaDetalle from '../../components/admin/CitaDetalle.vue';
import CitaForm from '../../components/admin/CitaForm.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const filtros = ref({ desde: hoyISO(), hasta: sumarDias(hoyISO(), 30), estado: '', profesional: '' });
const texto = ref('');
const profesionales = ref([]);
const detalle = ref('');
const nueva = ref(route.query.nueva === '1');

const { datos, cargando, error, cargar } = useCarga(() => citasApi.listar(filtros.value), { inicial: [] });
watch(filtros, () => cargar(), { deep: true });
onMounted(async () => {
  if (!auth.esProfesional) { try { profesionales.value = await usuariosApi.profesionales(true); } catch { /* opcional */ } }
});

const filas = computed(() => {
  const t = texto.value.trim().toLowerCase();
  return t ? datos.value.filter((c) => `${c.codigo} ${nombreCompleto(c.paciente)} ${c.servicio.nombre}`.toLowerCase().includes(t)) : datos.value;
});
const columnas = computed(() => [
  { key: 'fecha', label: 'Fecha y hora' },
  { key: 'paciente', label: 'Paciente' },
  { key: 'servicio', label: 'Servicio' },
  ...(auth.esProfesional ? [] : [{ key: 'profesional', label: 'Profesional' }]),
  { key: 'estado', label: 'Estado' },
  ...(auth.esProfesional ? [] : [{ key: 'pago', label: 'Pago' }, { key: 'saldo', label: 'Saldo', clase: 'num' }]),
]);
function cerrarNueva() { nueva.value = false; if (route.query.nueva) router.replace({ query: {} }); }
function guardada() { cerrarNueva(); cargar(); }
</script>

<template>
  <div class="pag-cab">
    <div><h1>{{ auth.esProfesional ? 'Mis citas' : 'Citas' }}</h1><p>Programe, confirme y dé seguimiento a las citas del centro.</p></div>
    <button v-if="auth.esPersonalAdministrativo" type="button" class="btn" @click="nueva = true">Nueva cita</button>
  </div>

  <form class="barra-filtros" @submit.prevent>
    <div class="campo busca"><label for="f-q">Buscar</label><input id="f-q" v-model="texto" type="search" placeholder="Paciente, servicio o código" /></div>
    <div class="campo"><label for="f-d">Desde</label><input id="f-d" v-model="filtros.desde" type="date" /></div>
    <div class="campo"><label for="f-h">Hasta</label><input id="f-h" v-model="filtros.hasta" type="date" /></div>
    <div class="campo"><label for="f-e">Estado</label>
      <select id="f-e" v-model="filtros.estado"><option value="">Todos</option><option v-for="(e, k) in ESTADO_CITA" :key="k" :value="k">{{ e.texto }}</option></select>
    </div>
    <div v-if="!auth.esProfesional" class="campo"><label for="f-p">Profesional</label>
      <select id="f-p" v-model="filtros.profesional"><option value="">Todos</option><option v-for="p in profesionales" :key="p.id" :value="p.id">{{ nombreCompleto(p) }}</option></select>
    </div>
  </form>

  <EstadoDatos :cargando="cargando" :error="error" :vacio="!filas.length" texto-vacio="No hay citas con esos filtros." detalle-vacio="Amplíe el rango de fechas o cambie el estado." @reintentar="cargar()">
    <Tabla :columnas="columnas" :filas="filas" con-acciones>
      <template #c-fecha="{ fila }"><strong>{{ fecha(fila.fecha, { corta: true }) }}</strong> {{ fila.horaInicio }}–{{ fila.horaFin }}</template>
      <template #c-paciente="{ fila }">{{ nombreCompleto(fila.paciente) }}</template>
      <template #c-servicio="{ fila }">{{ fila.servicio.nombre }}</template>
      <template #c-profesional="{ fila }">{{ nombreCompleto(fila.profesional) }}</template>
      <template #c-estado="{ fila }"><Insignia :valor="fila.estado" :mapa="ESTADO_CITA" /></template>
      <template #c-pago="{ fila }"><Insignia v-if="fila.estado !== 'CANCELADA'" :valor="fila.finanzas.estadoPago" :mapa="ESTADO_PAGO" /><span v-else>—</span></template>
      <template #c-saldo="{ fila }"><span :class="{ 'saldo-pos': fila.finanzas.saldo > 0 }">{{ Q(fila.finanzas.saldo) }}</span></template>
      <template #acciones="{ fila }"><button type="button" class="btn btn-sm btn-claro" @click="detalle = fila.id">Ver detalle</button></template>
    </Tabla>
  </EstadoDatos>

  <CitaDetalle v-if="detalle" :cita-id="detalle" @cerrar="detalle = ''" @cambio="cargar()" />
  <CitaForm v-if="nueva" @cerrar="cerrarNueva" @guardado="guardada" />
</template>
