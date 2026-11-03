<script setup>
import { ref, watch } from 'vue';
import { responsablesApi } from '../../api';
import { useCarga } from '../../utils/useCarga';
import { nombreCompleto } from '../../utils/format';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Tabla from '../../components/ui/Tabla.vue';
import Avatar from '../../components/ui/Avatar.vue';
import ResponsableForm from '../../components/admin/ResponsableForm.vue';

const q = ref('');
const editando = ref(null);
const { datos, cargando, error, cargar } = useCarga(() => responsablesApi.listar({ q: q.value }), { inicial: [] });
let t;
watch(q, () => { clearTimeout(t); t = setTimeout(cargar, 300); });

const columnas = [
  { key: 'nombre', label: 'Responsable' },
  { key: 'parentesco', label: 'Parentesco' },
  { key: 'contacto', label: 'Contacto' },
  { key: 'pacientes', label: 'Pacientes a cargo' },
];
function guardado() { editando.value = null; cargar(); }
</script>

<template>
  <div class="pag-cab">
    <div><h1>Responsables</h1><p>Padres, madres y tutores. Un responsable puede tener varios pacientes y un paciente varios responsables.</p></div>
    <button type="button" class="btn" @click="editando = {}">Nuevo responsable</button>
  </div>
  <form class="barra-filtros" @submit.prevent>
    <div class="campo busca"><label for="r-q">Buscar</label><input id="r-q" v-model="q" type="search" placeholder="Nombre, código, teléfono o correo" /></div>
  </form>
  <EstadoDatos :cargando="cargando" :error="error" :vacio="!datos.length" texto-vacio="No se encontraron responsables." @reintentar="cargar()">
    <Tabla :columnas="columnas" :filas="datos" con-acciones>
      <template #c-nombre="{ fila }"><span style="display:inline-flex;align-items:center;gap:10px;text-align:left"><Avatar :persona="fila" /><span><strong>{{ nombreCompleto(fila) }}</strong><br /><span class="texto-suave">{{ fila.codigo }}</span></span></span></template>
      <template #c-contacto="{ fila }">{{ fila.telefono }}<br /><a :href="`mailto:${fila.correo}`">{{ fila.correo }}</a></template>
      <template #c-pacientes="{ fila }">
        <span v-if="!fila.pacientes.length" class="texto-suave">Ninguno</span>
        <span v-for="p in fila.pacientes" :key="p.id" style="display:block"><router-link :to="{ name: 'paciente', params: { id: p.id } }">{{ nombreCompleto(p) }}</router-link></span>
      </template>
      <template #acciones="{ fila }"><button type="button" class="btn btn-sm btn-claro" @click="editando = fila">Editar</button></template>
    </Tabla>
  </EstadoDatos>
  <ResponsableForm v-if="editando" :responsable="editando.id ? editando : null" @cerrar="editando = null" @guardado="guardado" />
</template>
