<script setup>
import { ref, watch, onMounted } from 'vue';
import { materialesApi, pacientesApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toast';
import { useCarga } from '../../utils/useCarga';
import { useFormulario, reglas } from '../../utils/validators';
import { nombreCompleto, TIPOS_MATERIAL, fecha } from '../../utils/format';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Tabla from '../../components/ui/Tabla.vue';
import Modal from '../../components/ui/Modal.vue';
import Campo from '../../components/ui/Campo.vue';
import Boton from '../../components/ui/Boton.vue';

const auth = useAuthStore();
const toast = useToastStore();
const filtros = ref({ q: '', tipo: '', estado: auth.esAdmin ? '' : 'ACTIVO' });
const { datos, cargando, error, cargar } = useCarga(() => materialesApi.listar(filtros.value), { inicial: [] });
let t;
watch(() => filtros.value.q, () => { clearTimeout(t); t = setTimeout(cargar, 300); });
watch(() => [filtros.value.tipo, filtros.value.estado], () => cargar());

const editando = ref(null);
const guardando = ref(false);
const form = useFormulario(
  { titulo: '', descripcion: '', tipo: 'DOCUMENTO', enlace: '' },
  {
    titulo: [reglas.requerido('Escriba el título'), reglas.maximo(150)],
    descripcion: [reglas.requerido('Escriba la descripción'), reglas.maximo(1500)],
    tipo: [reglas.requerido('Elija el tipo')],
    enlace: [reglas.requerido('Pegue el enlace del material'), reglas.url()],
  },
);
function abrir(m) {
  editando.value = m || {};
  form.reiniciar(m ? { titulo: m.titulo, descripcion: m.descripcion, tipo: m.tipo, enlace: m.enlace } : { titulo: '', descripcion: '', tipo: 'DOCUMENTO', enlace: '' });
}
async function guardar() {
  if (!form.validar()) return;
  guardando.value = true;
  try {
    if (editando.value.id) await materialesApi.actualizar(editando.value.id, { ...form.valores }); else await materialesApi.crear({ ...form.valores });
    toast.ok(editando.value.id ? 'Material actualizado.' : 'Material creado.');
    editando.value = null; cargar();
  } catch (e) { form.aplicarErrorApi(e); } finally { guardando.value = false; }
}
async function alternar(m) {
  try { await materialesApi.estado(m.id, m.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'); toast.ok('Estado del material actualizado.'); cargar(); } catch (e) { toast.error(e.mensaje); }
}

// ----- Asignaciones -----
const asignando = ref(null);
const asignaciones = ref([]);
const pacientes = ref([]);
const nuevo = ref({ paciente: '', indicaciones: '' });
const errAsig = ref('');
const cargandoAsig = ref(false);
const puedeAsignar = auth.esAdmin || auth.esProfesional;

async function abrirAsignaciones(m) {
  asignando.value = m; errAsig.value = ''; nuevo.value = { paciente: '', indicaciones: '' };
  cargandoAsig.value = true;
  try {
    const [a, p] = await Promise.all([materialesApi.asignaciones(m.id), pacientes.value.length ? pacientes.value : pacientesApi.listar({ estado: 'ACTIVO' })]);
    asignaciones.value = a; pacientes.value = p;
  } catch (e) { errAsig.value = e.mensaje; } finally { cargandoAsig.value = false; }
}
async function asignar() {
  errAsig.value = '';
  if (!nuevo.value.paciente) { errAsig.value = 'Elija un paciente'; return; }
  try {
    await materialesApi.asignar(asignando.value.id, nuevo.value.paciente, nuevo.value.indicaciones);
    toast.ok('Material asignado al paciente.');
    asignaciones.value = await materialesApi.asignaciones(asignando.value.id);
    nuevo.value = { paciente: '', indicaciones: '' };
  } catch (e) { errAsig.value = e.mensaje; }
}
async function quitar(a) {
  try {
    await materialesApi.quitar(asignando.value.id, a.paciente.id);
    toast.ok('Asignación eliminada.');
    asignaciones.value = await materialesApi.asignaciones(asignando.value.id);
  } catch (e) { toast.error(e.mensaje); }
}

const columnas = [{ key: 'titulo', label: 'Material' }, { key: 'tipo', label: 'Tipo' }, { key: 'fecha', label: 'Registro' }, { key: 'estado', label: 'Estado' }];
onMounted(() => {});
</script>

<template>
  <div class="pag-cab">
    <div><h1>Materiales</h1><p>Recursos de apoyo para el trabajo en casa y en sesión. {{ puedeAsignar ? 'Asígnelos a sus pacientes.' : '' }}</p></div>
    <button v-if="auth.esAdmin" type="button" class="btn" @click="abrir()">Nuevo material</button>
  </div>
  <form class="barra-filtros" @submit.prevent>
    <div class="campo busca"><label for="m-q">Buscar</label><input id="m-q" v-model="filtros.q" type="search" placeholder="Título, descripción o código" /></div>
    <div class="campo"><label for="m-t">Tipo</label><select id="m-t" v-model="filtros.tipo"><option value="">Todos</option><option v-for="(t, k) in TIPOS_MATERIAL" :key="k" :value="k">{{ t }}</option></select></div>
    <div class="campo"><label for="m-e">Estado</label><select id="m-e" v-model="filtros.estado"><option value="">Todos</option><option value="ACTIVO">Activos</option><option value="INACTIVO">Inactivos</option></select></div>
  </form>
  <EstadoDatos :cargando="cargando" :error="error" :vacio="!datos.length" texto-vacio="No hay materiales con esos filtros." @reintentar="cargar()">
    <Tabla :columnas="columnas" :filas="datos" con-acciones>
      <template #c-titulo="{ fila }"><strong>{{ fila.titulo }}</strong> <span class="texto-suave">{{ fila.codigo }}</span><br /><span class="texto-suave">{{ fila.descripcion }}</span></template>
      <template #c-tipo="{ fila }"><span class="badge">{{ TIPOS_MATERIAL[fila.tipo] }}</span></template>
      <template #c-fecha="{ fila }">{{ fecha(fila.fechaRegistro, { corta: true }) }}</template>
      <template #c-estado="{ fila }"><span class="badge" :class="fila.estado === 'ACTIVO' ? 'badge-salvia' : 'badge-neutro'">{{ fila.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}</span></template>
      <template #acciones="{ fila }">
        <a class="btn btn-sm btn-claro" :href="fila.enlace" target="_blank" rel="noopener">Abrir</a>
        <button v-if="puedeAsignar && fila.estado === 'ACTIVO'" type="button" class="btn btn-sm btn-salvia" @click="abrirAsignaciones(fila)">Asignar</button>
        <template v-if="auth.esAdmin">
          <button type="button" class="btn btn-sm btn-claro" @click="abrir(fila)">Editar</button>
          <button type="button" class="btn btn-sm btn-fantasma" @click="alternar(fila)">{{ fila.estado === 'ACTIVO' ? 'Desactivar' : 'Activar' }}</button>
        </template>
      </template>
    </Tabla>
  </EstadoDatos>

  <Modal v-if="editando" :titulo="editando.id ? 'Editar material' : 'Nuevo material'" @cerrar="editando = null">
    <form id="form-mat" novalidate @submit.prevent="guardar">
      <p v-if="form.errorGeneral.value" class="aviso-form error" role="alert">{{ form.errorGeneral.value }}</p>
      <Campo v-slot="{ id, describedby, invalido }" label="Título" :error="form.errores.titulo" requerido><input :id="id" v-model="form.valores.titulo" maxlength="150" :aria-describedby="describedby" :aria-invalid="invalido" @blur="form.tocar('titulo')" /></Campo>
      <Campo v-slot="{ id, describedby, invalido }" label="Descripción" :error="form.errores.descripcion" requerido><textarea :id="id" v-model="form.valores.descripcion" rows="3" maxlength="1500" :aria-describedby="describedby" :aria-invalid="invalido" @blur="form.tocar('descripcion')" /></Campo>
      <div class="rejilla-form">
        <Campo v-slot="{ id }" label="Tipo" :error="form.errores.tipo" requerido><select :id="id" v-model="form.valores.tipo"><option v-for="(t, k) in TIPOS_MATERIAL" :key="k" :value="k">{{ t }}</option></select></Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Enlace" :error="form.errores.enlace" requerido><input :id="id" v-model="form.valores.enlace" type="url" placeholder="https://…" :aria-describedby="describedby" :aria-invalid="invalido" @blur="form.tocar('enlace')" /></Campo>
      </div>
    </form>
    <template #pie><button type="button" class="btn btn-claro" @click="editando = null">Cancelar</button><Boton tipo="submit" form="form-mat" :cargando="guardando">Guardar</Boton></template>
  </Modal>

  <Modal v-if="asignando" :titulo="`Asignar: ${asignando.titulo}`" ancho @cerrar="asignando = null">
    <p v-if="errAsig" class="aviso-form error" role="alert">{{ errAsig }}</p>
    <div class="rejilla-form">
      <Campo v-slot="{ id }" label="Paciente"><select :id="id" v-model="nuevo.paciente"><option value="" disabled>Elija un paciente</option><option v-for="p in pacientes" :key="p.id" :value="p.id">{{ p.codigo }} · {{ nombreCompleto(p) }}</option></select></Campo>
      <Campo v-slot="{ id }" label="Indicaciones (opcional)"><input :id="id" v-model="nuevo.indicaciones" maxlength="500" placeholder="Ej. Practicar 10 minutos al día" /></Campo>
    </div>
    <button type="button" class="btn btn-sm btn-salvia" @click="asignar">Asignar al paciente</button>
    <h3 style="margin-top:20px;font-size:1.05rem">Pacientes con este material</h3>
    <p v-if="cargandoAsig" role="status">Cargando…</p>
    <p v-else-if="!asignaciones.length" class="texto-suave">Todavía no está asignado a nadie.</p>
    <ul v-else class="lista-simple">
      <li v-for="a in asignaciones" :key="a.id"><span class="crece"><strong>{{ nombreCompleto(a.paciente) }}</strong><br /><span class="texto-suave">{{ a.indicaciones || 'Sin indicaciones' }} · por {{ nombreCompleto(a.asignadoPor) }}</span></span>
        <button type="button" class="btn btn-sm btn-fantasma" @click="quitar(a)">Quitar</button></li>
    </ul>
  </Modal>
</template>
