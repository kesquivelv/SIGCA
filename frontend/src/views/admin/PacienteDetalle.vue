<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { pacientesApi, responsablesApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toast';
import { fecha, Q, nombreCompleto, ESTADO_CITA, ESTADO_PAGO, METODOS, TIPOS_MATERIAL, fechaHora } from '../../utils/format';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Tabla from '../../components/ui/Tabla.vue';
import Avatar from '../../components/ui/Avatar.vue';
import Insignia from '../../components/ui/Insignia.vue';
import Confirmar from '../../components/ui/Confirmar.vue';
import PacienteForm from '../../components/admin/PacienteForm.vue';
import ResponsableForm from '../../components/admin/ResponsableForm.vue';
import CitaForm from '../../components/admin/CitaForm.vue';
import CitaDetalle from '../../components/admin/CitaDetalle.vue';

const route = useRoute();
const auth = useAuthStore();
const toast = useToastStore();
const id = route.params.id;

const paciente = ref(null);
const citas = ref([]);
const materiales = ref([]);
const pagos = ref(null);
const cargando = ref(true);
const error = ref('');
const pestana = ref('resumen');
const dialogo = ref('');
const citaAbierta = ref('');
const quitando = ref(null);
const candidatos = ref([]);
const aAsociar = ref('');

async function cargar() {
  cargando.value = true;
  error.value = '';
  try {
    const [p, c, m] = await Promise.all([pacientesApi.obtener(id), pacientesApi.citas(id), pacientesApi.materiales(id)]);
    paciente.value = p; citas.value = c; materiales.value = m;
    if (auth.esPersonalAdministrativo) pagos.value = await pacientesApi.pagos(id);
  } catch (e) {
    error.value = e.mensaje;
  } finally {
    cargando.value = false;
  }
}
onMounted(cargar);

const menorSinResponsable = computed(() => paciente.value && paciente.value.edad < 18 && auth.esPersonalAdministrativo && !paciente.value.responsables?.length);
const puedeEditar = computed(() => auth.esPersonalAdministrativo);

async function prepararAsociar() {
  dialogo.value = 'asociar';
  try {
    const todos = await responsablesApi.listar();
    const ya = new Set((paciente.value.responsables || []).map((r) => r.id));
    candidatos.value = todos.filter((r) => !ya.has(r.id));
  } catch (e) { toast.error(e.mensaje); }
}
async function asociar() {
  if (!aAsociar.value) return;
  try {
    await responsablesApi.asociar(aAsociar.value, id);
    toast.ok('Responsable asociado.');
    dialogo.value = ''; aAsociar.value = '';
    cargar();
  } catch (e) { toast.error(e.mensaje); }
}
async function quitar() {
  try {
    await responsablesApi.desasociar(quitando.value.id, id);
    toast.ok('Responsable desvinculado del paciente.');
    quitando.value = null;
    cargar();
  } catch (e) { toast.error(e.mensaje); quitando.value = null; }
}

const colCitas = computed(() => [
  { key: 'fecha', label: 'Fecha y hora' }, { key: 'servicio', label: 'Servicio' }, { key: 'profesional', label: 'Profesional' }, { key: 'estado', label: 'Estado' },
  ...(auth.esProfesional ? [] : [{ key: 'saldo', label: 'Saldo', clase: 'num' }]),
]);
const colPagos = [
  { key: 'comprobante', label: 'Comprobante' }, { key: 'fecha', label: 'Fecha' }, { key: 'cita', label: 'Cita' },
  { key: 'metodo', label: 'Método' }, { key: 'monto', label: 'Monto', clase: 'num' }, { key: 'estado', label: 'Estado' },
];
</script>

<template>
  <p><router-link :to="{ name: 'pacientes' }">← Volver a pacientes</router-link></p>
  <EstadoDatos :cargando="cargando" :error="error" @reintentar="cargar">
    <template v-if="paciente">
      <div class="pag-cab">
        <div style="display:flex;gap:16px;align-items:center">
          <Avatar :persona="paciente" grande />
          <div>
            <h1>{{ nombreCompleto(paciente) }}</h1>
            <p>{{ paciente.codigo }} · {{ paciente.edad }} años · <span class="badge" :class="paciente.estado === 'ACTIVO' ? 'badge-salvia' : 'badge-neutro'">{{ paciente.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}</span></p>
          </div>
        </div>
        <div v-if="puedeEditar" class="acciones-fila">
          <button v-if="paciente.estado === 'ACTIVO'" type="button" class="btn" @click="dialogo = 'cita'">Programar cita</button>
          <button type="button" class="btn btn-claro" @click="dialogo = 'editar'">Editar datos</button>
        </div>
      </div>

      <p v-if="menorSinResponsable" class="aviso-form info" role="status">Este paciente es menor de edad y no tiene un responsable asociado. Asocie o registre uno en la pestaña Resumen.</p>

      <div class="pestanas" role="tablist">
        <button type="button" role="tab" :aria-selected="pestana === 'resumen'" @click="pestana = 'resumen'">Resumen</button>
        <button type="button" role="tab" :aria-selected="pestana === 'citas'" @click="pestana = 'citas'">Citas ({{ citas.length }})</button>
        <button v-if="pagos" type="button" role="tab" :aria-selected="pestana === 'pagos'" @click="pestana = 'pagos'">Pagos</button>
        <button type="button" role="tab" :aria-selected="pestana === 'materiales'" @click="pestana = 'materiales'">Materiales ({{ materiales.length }})</button>
      </div>

      <div v-if="pestana === 'resumen'" class="rejilla-paneles">
        <section class="panel">
          <h2>Datos personales</h2>
          <dl class="dato">
            <dt>Fecha de nacimiento</dt><dd>{{ fecha(paciente.fechaNacimiento) }}</dd>
            <dt>Sexo</dt><dd>{{ paciente.sexo === 'FEMENINO' ? 'Femenino' : 'Masculino' }}</dd>
            <dt>Teléfono</dt><dd>{{ paciente.telefono }}</dd>
            <dt v-if="paciente.direccion">Dirección</dt><dd v-if="paciente.direccion">{{ paciente.direccion }}</dd>
            <dt>Inicio del proceso</dt><dd>{{ fecha(paciente.fechaInicioProceso) }}</dd>
            <dt v-if="paciente.observaciones !== undefined">Observaciones</dt><dd v-if="paciente.observaciones !== undefined">{{ paciente.observaciones || '—' }}</dd>
          </dl>
        </section>
        <section v-if="puedeEditar" class="panel">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
            <h2 style="margin:0">Responsables</h2>
            <div class="acciones-fila">
              <button type="button" class="btn btn-sm btn-claro" @click="prepararAsociar">Asociar existente</button>
              <button type="button" class="btn btn-sm" @click="dialogo = 'nuevo-resp'">Registrar nuevo</button>
            </div>
          </div>
          <p v-if="!paciente.responsables?.length" class="texto-suave">Sin responsables asociados.</p>
          <ul v-else class="lista-simple">
            <li v-for="r in paciente.responsables" :key="r.id">
              <Avatar :persona="r" />
              <span class="crece"><strong>{{ nombreCompleto(r) }}</strong> <span class="badge">{{ r.parentesco }}</span><br /><span class="texto-suave">{{ r.telefono }} · {{ r.correo }}</span></span>
              <button type="button" class="btn btn-sm btn-fantasma" @click="quitando = r">Desvincular</button>
            </li>
          </ul>
        </section>
      </div>

      <EstadoDatos v-if="pestana === 'citas'" :vacio="!citas.length" texto-vacio="Este paciente aún no tiene citas.">
        <Tabla :columnas="colCitas" :filas="citas" con-acciones>
          <template #c-fecha="{ fila }"><strong>{{ fecha(fila.fecha, { corta: true }) }}</strong> {{ fila.horaInicio }}</template>
          <template #c-servicio="{ fila }">{{ fila.servicio?.nombre }}</template>
          <template #c-profesional="{ fila }">{{ nombreCompleto(fila.profesional) }}</template>
          <template #c-estado="{ fila }"><Insignia :valor="fila.estado" :mapa="ESTADO_CITA" /></template>
          <template #c-saldo="{ fila }"><span :class="{ 'saldo-pos': fila.finanzas?.saldo > 0 }">{{ Q(fila.finanzas?.saldo) }}</span></template>
          <template #acciones="{ fila }"><button type="button" class="btn btn-sm btn-claro" @click="citaAbierta = fila.id">Ver</button></template>
        </Tabla>
      </EstadoDatos>

      <template v-if="pestana === 'pagos' && pagos">
        <div class="totales" style="margin-bottom:14px">
          <div><span>Total pagado</span><b>{{ Q(pagos.totalPagado) }}</b></div>
          <div><span>Saldo pendiente</span><b :class="{ 'saldo-pos': pagos.saldoPendiente > 0 }">{{ Q(pagos.saldoPendiente) }}</b></div>
        </div>
        <EstadoDatos :vacio="!pagos.pagos.length" texto-vacio="Sin pagos registrados.">
          <Tabla :columnas="colPagos" :filas="pagos.pagos">
            <template #c-fecha="{ fila }">{{ fechaHora(fila.fechaHora) }}</template>
            <template #c-cita="{ fila }">{{ fila.cita?.codigo }}</template>
            <template #c-metodo="{ fila }">{{ METODOS[fila.metodo] }}</template>
            <template #c-monto="{ fila }"><span :class="{ neg: fila.estado === 'ANULADO' }" :style="fila.estado === 'ANULADO' ? 'text-decoration:line-through' : ''">{{ Q(fila.monto) }}</span></template>
            <template #c-estado="{ fila }"><span class="badge" :class="fila.estado === 'ANULADO' ? 'badge-terracota' : 'badge-salvia'">{{ fila.estado === 'ANULADO' ? 'Anulado' : 'Válido' }}</span><div v-if="fila.motivoAnulacion" class="texto-suave">{{ fila.motivoAnulacion }}</div></template>
          </Tabla>
        </EstadoDatos>
      </template>

      <EstadoDatos v-if="pestana === 'materiales'" :vacio="!materiales.length" texto-vacio="No hay materiales asignados.">
        <ul class="lista-simple panel">
          <li v-for="a in materiales" :key="a.id">
            <span class="crece"><strong>{{ a.material.titulo }}</strong> <span class="badge">{{ TIPOS_MATERIAL[a.material.tipo] }}</span><br />
              <span class="texto-suave">{{ a.indicaciones || 'Sin indicaciones' }} · asignado por {{ nombreCompleto(a.asignadoPor) }}</span></span>
            <a class="btn btn-sm btn-claro" :href="a.material.enlace" target="_blank" rel="noopener">Abrir</a>
          </li>
        </ul>
      </EstadoDatos>
    </template>
  </EstadoDatos>

  <PacienteForm v-if="dialogo === 'editar'" :paciente="paciente" @cerrar="dialogo = ''" @guardado="dialogo = ''; cargar()" />
  <CitaForm v-if="dialogo === 'cita'" :prefill="{ paciente: id }" @cerrar="dialogo = ''" @guardado="dialogo = ''; cargar()" />
  <ResponsableForm v-if="dialogo === 'nuevo-resp'" :prefill-pacientes="[id]" @cerrar="dialogo = ''" @guardado="dialogo = ''; cargar()" />
  <CitaDetalle v-if="citaAbierta" :cita-id="citaAbierta" @cerrar="citaAbierta = ''" @cambio="cargar" />
  <Confirmar v-if="quitando" titulo="Desvincular responsable" :mensaje="`${nombreCompleto(quitando)} dejará de figurar como responsable de ${nombreCompleto(paciente)}. El responsable no se elimina.`" confirmar="Desvincular" peligro @cerrar="quitando = null" @confirmado="quitar" />

  <Teleport to="body">
    <div v-if="dialogo === 'asociar'" class="modal-fondo" @mousedown.self="dialogo = ''">
      <div class="modal" role="dialog" aria-modal="true" aria-label="Asociar responsable">
        <header class="modal-cab"><h2>Asociar responsable existente</h2><button type="button" class="cerrar" aria-label="Cerrar ventana" @click="dialogo = ''">×</button></header>
        <div class="modal-cuerpo">
          <p v-if="!candidatos.length" class="texto-suave">No hay otros responsables registrados. Use «Registrar nuevo».</p>
          <div v-else class="campo">
            <label for="sel-resp">Responsable</label>
            <select id="sel-resp" v-model="aAsociar"><option value="" disabled>Elija un responsable</option><option v-for="r in candidatos" :key="r.id" :value="r.id">{{ r.codigo }} · {{ nombreCompleto(r) }} ({{ r.parentesco }})</option></select>
          </div>
        </div>
        <footer class="modal-pie"><button type="button" class="btn btn-claro" @click="dialogo = ''">Cancelar</button><button type="button" class="btn" :disabled="!aAsociar" @click="asociar">Asociar</button></footer>
      </div>
    </div>
  </Teleport>
</template>
