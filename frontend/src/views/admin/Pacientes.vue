<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { pacientesApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toast';
import { useCarga } from '../../utils/useCarga';
import { nombreCompleto, fecha } from '../../utils/format';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Tabla from '../../components/ui/Tabla.vue';
import Avatar from '../../components/ui/Avatar.vue';
import Confirmar from '../../components/ui/Confirmar.vue';
import PacienteForm from '../../components/admin/PacienteForm.vue';

const auth = useAuthStore();
const toast = useToastStore();
const route = useRoute();
const router = useRouter();
const q = ref('');
const estado = ref('ACTIVO');
const editando = ref(route.query.nuevo === '1' ? {} : null);
const cambiando = ref(null);
const trabajando = ref(false);

const { datos, cargando, error, cargar } = useCarga(() => pacientesApi.listar({ q: q.value, estado: estado.value }), { inicial: [] });
let t;
watch(q, () => { clearTimeout(t); t = setTimeout(cargar, 300); });
watch(estado, () => cargar());

const columnas = computed(() => [
  { key: 'nombre', label: 'Paciente' },
  { key: 'edad', label: 'Edad' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'inicio', label: 'Inicio del proceso' },
  { key: 'estado', label: 'Estado' },
]);
function cerrarForm() { editando.value = null; if (route.query.nuevo) router.replace({ query: {} }); }
function guardado(p) {
  const eraNuevo = !editando.value?.id;
  cerrarForm();
  if (eraNuevo) router.push({ name: 'paciente', params: { id: p.id } }); else cargar();
}

async function alternarEstado() {
  trabajando.value = true;
  const nuevo = cambiando.value.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  try {
    await pacientesApi.estado(cambiando.value.id, nuevo);
    toast.ok(nuevo === 'ACTIVO' ? 'Paciente reactivado.' : 'Paciente desactivado. Su historial se conserva.');
    cambiando.value = null;
    cargar();
  } catch (e) {
    toast.error(e.mensaje);
  } finally {
    trabajando.value = false;
  }
}
</script>

<template>
  <div class="pag-cab">
    <div><h1>{{ auth.esProfesional ? 'Mis pacientes' : 'Pacientes' }}</h1><p>{{ auth.esProfesional ? 'Pacientes con citas asignadas a usted.' : 'Registro y seguimiento de las personas atendidas.' }}</p></div>
    <button v-if="auth.esPersonalAdministrativo" type="button" class="btn" @click="editando = {}">Nuevo paciente</button>
  </div>
  <form class="barra-filtros" @submit.prevent>
    <div class="campo busca"><label for="p-q">Buscar</label><input id="p-q" v-model="q" type="search" placeholder="Nombre, código o teléfono" /></div>
    <div class="campo"><label for="p-e">Estado</label>
      <select id="p-e" v-model="estado"><option value="ACTIVO">Activos</option><option value="INACTIVO">Inactivos</option><option value="">Todos</option></select>
    </div>
  </form>

  <EstadoDatos :cargando="cargando" :error="error" :vacio="!datos.length" texto-vacio="No se encontraron pacientes." :detalle-vacio="q ? 'Pruebe con otra búsqueda.' : ''" @reintentar="cargar()">
    <Tabla :columnas="columnas" :filas="datos" con-acciones>
      <template #c-nombre="{ fila }">
        <span style="display:inline-flex;align-items:center;gap:10px;text-align:left"><Avatar :persona="fila" />
          <span><router-link :to="{ name: 'paciente', params: { id: fila.id } }"><strong>{{ nombreCompleto(fila) }}</strong></router-link><br /><span class="texto-suave">{{ fila.codigo }}</span></span></span>
      </template>
      <template #c-edad="{ fila }">{{ fila.edad }} años</template>
      <template #c-inicio="{ fila }">{{ fecha(fila.fechaInicioProceso, { corta: true }) }}</template>
      <template #c-estado="{ fila }"><span class="badge" :class="fila.estado === 'ACTIVO' ? 'badge-salvia' : 'badge-neutro'">{{ fila.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}</span></template>
      <template #acciones="{ fila }">
        <router-link class="btn btn-sm btn-claro" :to="{ name: 'paciente', params: { id: fila.id } }">Ver ficha</router-link>
        <template v-if="auth.esPersonalAdministrativo">
          <button type="button" class="btn btn-sm btn-claro" @click="editando = fila">Editar</button>
          <button type="button" class="btn btn-sm btn-fantasma" @click="cambiando = fila">{{ fila.estado === 'ACTIVO' ? 'Desactivar' : 'Reactivar' }}</button>
        </template>
      </template>
    </Tabla>
  </EstadoDatos>

  <PacienteForm v-if="editando" :paciente="editando.id ? editando : null" @cerrar="cerrarForm" @guardado="guardado" />
  <Confirmar v-if="cambiando" :titulo="cambiando.estado === 'ACTIVO' ? 'Desactivar paciente' : 'Reactivar paciente'"
    :mensaje="cambiando.estado === 'ACTIVO' ? `${nombreCompleto(cambiando)} no podrá recibir nuevas citas, pero su historial se conserva.` : `${nombreCompleto(cambiando)} volverá a poder recibir citas.`"
    :confirmar="cambiando.estado === 'ACTIVO' ? 'Desactivar' : 'Reactivar'" :peligro="cambiando.estado === 'ACTIVO'" :cargando="trabajando" @cerrar="cambiando = null" @confirmado="alternarEstado" />
</template>
