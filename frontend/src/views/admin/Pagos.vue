<script setup>
import { ref, computed, watch } from 'vue';
import { pagosApi, citasApi } from '../../api';
import { useToastStore } from '../../stores/toast';
import { useCarga } from '../../utils/useCarga';
import { fechaHora, hoyISO, sumarDias, Q, METODOS, nombreCompleto } from '../../utils/format';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Tabla from '../../components/ui/Tabla.vue';
import Modal from '../../components/ui/Modal.vue';
import Confirmar from '../../components/ui/Confirmar.vue';
import PagoForm from '../../components/admin/PagoForm.vue';

const toast = useToastStore();
const filtros = ref({ desde: sumarDias(hoyISO(), -7), hasta: hoyISO(), estado: '', metodo: '' });
const texto = ref('');
const { datos, cargando, error, cargar } = useCarga(() => pagosApi.listar(filtros.value), { inicial: [] });
watch(filtros, () => cargar(), { deep: true });

const filas = computed(() => {
  const t = texto.value.trim().toLowerCase();
  return t ? datos.value.filter((p) => `${p.comprobante} ${nombreCompleto(p.paciente)} ${p.cita?.codigo}`.toLowerCase().includes(t)) : datos.value;
});
const total = computed(() => filas.value.filter((p) => p.estado === 'REGISTRADO').reduce((s, p) => s + p.montoCentavos, 0) / 100);

// ----- Nuevo pago: primero se elige la cita con saldo -----
const elegir = ref(false);
const pendientes = ref([]);
const cargandoCitas = ref(false);
const errCitas = ref('');
const busca = ref('');
const citaPago = ref(null);
async function abrirNuevo() {
  elegir.value = true; cargandoCitas.value = true; errCitas.value = '';
  try {
    const lista = await citasApi.listar({ desde: sumarDias(hoyISO(), -90), hasta: sumarDias(hoyISO(), 60) });
    pendientes.value = lista.filter((c) => c.estado !== 'CANCELADA' && c.finanzas.saldo > 0);
  } catch (e) { errCitas.value = e.mensaje; } finally { cargandoCitas.value = false; }
}
const citasFiltradas = computed(() => {
  const t = busca.value.trim().toLowerCase();
  return pendientes.value.filter((c) => !t || `${c.codigo} ${nombreCompleto(c.paciente)}`.toLowerCase().includes(t)).slice(0, 60);
});
function elegida(c) { citaPago.value = c; elegir.value = false; }
function pagado() { citaPago.value = null; cargar(); }

// ----- Anular -----
const anulando = ref(null);
const trabajando = ref(false);
async function anular(motivo) {
  trabajando.value = true;
  try { await pagosApi.anular(anulando.value.id, motivo); toast.ok('Pago anulado. Queda en el historial y el saldo se recalcula.'); anulando.value = null; cargar(); }
  catch (e) { toast.error(e.mensaje); anulando.value = null; } finally { trabajando.value = false; }
}

const columnas = [
  { key: 'comprobante', label: 'Comprobante' }, { key: 'fecha', label: 'Fecha' }, { key: 'paciente', label: 'Paciente' },
  { key: 'metodo', label: 'Método' }, { key: 'monto', label: 'Monto', clase: 'num' }, { key: 'estado', label: 'Estado' },
];
</script>

<template>
  <div class="pag-cab">
    <div><h1>Pagos</h1><p>Cada abono es un registro independiente. Los pagos no se borran: se anulan con un motivo.</p></div>
    <button type="button" class="btn" @click="abrirNuevo">Registrar pago</button>
  </div>
  <form class="barra-filtros" @submit.prevent>
    <div class="campo busca"><label for="g-q">Buscar</label><input id="g-q" v-model="texto" type="search" placeholder="Comprobante, paciente o cita" /></div>
    <div class="campo"><label for="g-d">Desde</label><input id="g-d" v-model="filtros.desde" type="date" /></div>
    <div class="campo"><label for="g-h">Hasta</label><input id="g-h" v-model="filtros.hasta" type="date" /></div>
    <div class="campo"><label for="g-m">Método</label><select id="g-m" v-model="filtros.metodo"><option value="">Todos</option><option v-for="(t, k) in METODOS" :key="k" :value="k">{{ t }}</option></select></div>
    <div class="campo"><label for="g-e">Estado</label><select id="g-e" v-model="filtros.estado"><option value="">Todos</option><option value="REGISTRADO">Válidos</option><option value="ANULADO">Anulados</option></select></div>
  </form>
  <div class="totales" style="margin-bottom:14px"><div><span>Total de pagos válidos en la lista</span><b>{{ Q(total) }}</b></div></div>

  <EstadoDatos :cargando="cargando" :error="error" :vacio="!filas.length" texto-vacio="No hay pagos en ese rango." detalle-vacio="Cambie las fechas o registre un pago nuevo." @reintentar="cargar()">
    <Tabla :columnas="columnas" :filas="filas" con-acciones>
      <template #c-fecha="{ fila }">{{ fechaHora(fila.fechaHora) }}</template>
      <template #c-paciente="{ fila }">{{ nombreCompleto(fila.paciente) }}<br /><span class="texto-suave">{{ fila.cita?.codigo }} · {{ fila.cita?.servicio?.nombre }}</span></template>
      <template #c-metodo="{ fila }">{{ METODOS[fila.metodo] }}<span v-if="fila.referencia" class="texto-suave"><br />Ref. {{ fila.referencia }}</span></template>
      <template #c-monto="{ fila }"><span :style="fila.estado === 'ANULADO' ? 'text-decoration:line-through' : ''" :class="{ neg: fila.estado === 'ANULADO' }">{{ Q(fila.monto) }}</span></template>
      <template #c-estado="{ fila }"><span class="badge" :class="fila.estado === 'ANULADO' ? 'badge-terracota' : 'badge-salvia'">{{ fila.estado === 'ANULADO' ? 'Anulado' : 'Válido' }}</span><div v-if="fila.motivoAnulacion" class="texto-suave">{{ fila.motivoAnulacion }}</div></template>
      <!-- TODO(tercer-integrante): botón "Anular" (abre el diálogo Confirmar de abajo; solo si fila.estado === 'REGISTRADO' y la caja está ABIERTA). -->
    </Tabla>
  </EstadoDatos>

  <Modal v-if="elegir" titulo="¿De qué cita es el pago?" ancho @cerrar="elegir = false">
    <p v-if="errCitas" class="estado-error" role="alert">{{ errCitas }}</p>
    <p v-else-if="cargandoCitas" role="status">Buscando citas con saldo…</p>
    <template v-else>
      <div class="campo"><label for="busca-cita">Buscar</label><input id="busca-cita" v-model="busca" type="search" placeholder="Paciente o código de cita" /></div>
      <p v-if="!citasFiltradas.length" class="texto-suave">No hay citas con saldo pendiente.</p>
      <ul class="lista-simple">
        <li v-for="c in citasFiltradas" :key="c.id">
          <span class="crece"><strong>{{ nombreCompleto(c.paciente) }}</strong> · {{ c.servicio.nombre }}<br /><span class="texto-suave">{{ c.codigo }} · {{ c.fecha }} {{ c.horaInicio }}</span></span>
          <span class="saldo-pos">{{ Q(c.finanzas.saldo) }}</span>
          <button type="button" class="btn btn-sm btn-salvia" @click="elegida(c)">Cobrar</button>
        </li>
      </ul>
    </template>
  </Modal>
  <PagoForm v-if="citaPago" :cita="citaPago" @cerrar="citaPago = null" @guardado="pagado" />
  <Confirmar v-if="anulando" titulo="Anular pago" :mensaje="`Se anulará el pago ${anulando.comprobante} por ${Q(anulando.monto)}. Seguirá visible en el historial.`" confirmar="Anular pago" peligro pedir-motivo etiqueta-motivo="Motivo de la anulación" :cargando="trabajando" @cerrar="anulando = null" @confirmado="anular" />
</template>
