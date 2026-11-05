<script setup>
import { ref, watch } from 'vue';
import { usuariosApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toast';
import { useCarga } from '../../utils/useCarga';
import { useFormulario, reglas } from '../../utils/validators';
import { nombreCompleto, ROLES } from '../../utils/format';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Tabla from '../../components/ui/Tabla.vue';
import Modal from '../../components/ui/Modal.vue';
import Campo from '../../components/ui/Campo.vue';
import Boton from '../../components/ui/Boton.vue';
import Confirmar from '../../components/ui/Confirmar.vue';
import UsuarioForm from '../../components/admin/UsuarioForm.vue';

const auth = useAuthStore();
const toast = useToastStore();
const filtros = ref({ q: '', rol: '', activo: '' });
const editando = ref(null);
const cambiando = ref(null);
const clave = ref(null);
const trabajando = ref(false);
const { datos, cargando, error, cargar } = useCarga(() => usuariosApi.listar(filtros.value), { inicial: [] });
let t;
watch(() => filtros.value.q, () => { clearTimeout(t); t = setTimeout(cargar, 300); });
watch(() => [filtros.value.rol, filtros.value.activo], () => cargar());

const columnas = [
  { key: 'nombre', label: 'Usuario' }, { key: 'rol', label: 'Rol' }, { key: 'contacto', label: 'Teléfono' }, { key: 'activo', label: 'Estado' },
];

async function alternar() {
  trabajando.value = true;
  try {
    await usuariosApi.estado(cambiando.value.id, !cambiando.value.activo);
    toast.ok(cambiando.value.activo ? 'Usuario desactivado: ya no puede ingresar.' : 'Usuario activado.');
    cambiando.value = null;
    cargar();
  } catch (e) { toast.error(e.mensaje); cambiando.value = null; } finally { trabajando.value = false; }
}

const form = useFormulario({ passwordNueva: '' }, { passwordNueva: [reglas.requerido('Escriba la contraseña nueva'), reglas.minimo(8)] });
async function restablecer() {
  if (!form.validar()) return;
  trabajando.value = true;
  try {
    const r = await usuariosApi.password(clave.value.id, form.valores.passwordNueva);
    toast.ok(r.mensaje);
    clave.value = null; form.reiniciar();
  } catch (e) { form.aplicarErrorApi(e); } finally { trabajando.value = false; }
}
</script>

<template>
  <div class="pag-cab">
    <div><h1>Usuarios y roles</h1><p>Quién puede entrar al panel y qué puede hacer. Los usuarios desactivados pierden el acceso de inmediato.</p></div>
    <button type="button" class="btn" @click="editando = {}">Nuevo usuario</button>
  </div>
  <form class="barra-filtros" @submit.prevent>
    <div class="campo busca"><label for="u-q">Buscar</label><input id="u-q" v-model="filtros.q" type="search" placeholder="Nombre o correo" /></div>
    <div class="campo"><label for="u-r">Rol</label><select id="u-r" v-model="filtros.rol"><option value="">Todos</option><option v-for="(t, k) in ROLES" :key="k" :value="k">{{ t }}</option></select></div>
    <div class="campo"><label for="u-a">Estado</label><select id="u-a" v-model="filtros.activo"><option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select></div>
  </form>
  <EstadoDatos :cargando="cargando" :error="error" :vacio="!datos.length" texto-vacio="No hay usuarios con esos filtros." @reintentar="cargar()">
    <Tabla :columnas="columnas" :filas="datos" con-acciones>
      <template #c-nombre="{ fila }"><strong>{{ nombreCompleto(fila) }}</strong><span v-if="fila.id === auth.usuario.id" class="badge" style="margin-left:6px">Usted</span><br /><span class="texto-suave">{{ fila.correo }}</span></template>
      <template #c-rol="{ fila }">{{ ROLES[fila.rol] }}<br /><span class="texto-suave">{{ fila.especialidad }}</span></template>
      <template #c-contacto="{ fila }">{{ fila.telefono || '—' }}</template>
      <template #c-activo="{ fila }"><span class="badge" :class="fila.activo ? 'badge-salvia' : 'badge-terracota'">{{ fila.activo ? 'Activo' : 'Inactivo' }}</span></template>
      <template #acciones="{ fila }">
        <button type="button" class="btn btn-sm btn-claro" @click="editando = fila">Editar</button>
        <button type="button" class="btn btn-sm btn-claro" @click="clave = fila">Restablecer clave</button>
        <button v-if="fila.id !== auth.usuario.id" type="button" class="btn btn-sm btn-fantasma" @click="cambiando = fila">{{ fila.activo ? 'Desactivar' : 'Activar' }}</button>
      </template>
    </Tabla>
  </EstadoDatos>

  <UsuarioForm v-if="editando" :usuario="editando.id ? editando : null" @cerrar="editando = null" @guardado="editando = null; cargar()" />
  <Confirmar v-if="cambiando" :titulo="cambiando.activo ? 'Desactivar usuario' : 'Activar usuario'" :mensaje="cambiando.activo ? `${nombreCompleto(cambiando)} no podrá iniciar sesión, aunque tenga una sesión abierta.` : `${nombreCompleto(cambiando)} podrá volver a iniciar sesión.`" :confirmar="cambiando.activo ? 'Desactivar' : 'Activar'" :peligro="cambiando.activo" :cargando="trabajando" @cerrar="cambiando = null" @confirmado="alternar" />
  <Modal v-if="clave" :titulo="`Restablecer contraseña de ${nombreCompleto(clave)}`" @cerrar="clave = null; form.reiniciar()">
    <form id="form-clave" novalidate @submit.prevent="restablecer">
      <p v-if="form.errorGeneral.value" class="aviso-form error" role="alert">{{ form.errorGeneral.value }}</p>
      <Campo v-slot="{ id, describedby, invalido }" label="Contraseña nueva" :error="form.errores.passwordNueva" requerido ayuda="Mínimo 8 caracteres. Comuníquela a la persona por un medio seguro.">
        <input :id="id" v-model="form.valores.passwordNueva" type="password" autocomplete="new-password" :aria-describedby="describedby" :aria-invalid="invalido" @blur="form.tocar('passwordNueva')" />
      </Campo>
    </form>
    <template #pie><button type="button" class="btn btn-claro" @click="clave = null; form.reiniciar()">Cancelar</button><Boton tipo="submit" form="form-clave" :cargando="trabajando">Restablecer</Boton></template>
  </Modal>
</template>
