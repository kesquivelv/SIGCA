<script setup>
import { ref } from 'vue';
import { usuariosApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toast';
import { useCarga } from '../../utils/useCarga';
import { nombreCompleto } from '../../utils/format';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Confirmar from '../../components/ui/Confirmar.vue';
import UsuarioForm from '../../components/admin/UsuarioForm.vue';

const auth = useAuthStore();
const toast = useToastStore();
const { datos, cargando, error, cargar } = useCarga(() => usuariosApi.profesionales(true), { inicial: [] });
const editando = ref(null);
const cambiando = ref(null);

async function alternar() {
  try {
    await usuariosApi.estado(cambiando.value.id, !cambiando.value.activo);
    toast.ok(cambiando.value.activo ? 'Profesional desactivado.' : 'Profesional activado.');
    cambiando.value = null;
    cargar();
  } catch (e) { toast.error(e.mensaje); cambiando.value = null; }
}
</script>

<template>
  <div class="pag-cab">
    <div><h1>Profesionales</h1><p>Equipo que atiende en el centro. Solo los profesionales activos aparecen al programar citas.</p></div>
    <button v-if="auth.esAdmin" type="button" class="btn" @click="editando = {}">Nuevo profesional</button>
  </div>
  <EstadoDatos :cargando="cargando" :error="error" :vacio="!datos.length" texto-vacio="Aún no hay profesionales registrados." @reintentar="cargar()">
    <div class="rejilla-paneles">
      <article v-for="p in datos" :key="p.id" class="panel" :style="p.activo ? '' : 'opacity:.75'">
        <div style="display:flex;gap:12px;align-items:center">
          <span class="avatar grande" aria-hidden="true">{{ (p.nombres[0] + p.apellidos[0]).toUpperCase() }}</span>
          <div>
            <h2 style="margin:0">{{ nombreCompleto(p) }}</h2>
            <span class="badge" :class="p.activo ? 'badge-salvia' : 'badge-terracota'">{{ p.activo ? 'Activo' : 'Inactivo' }}</span>
          </div>
        </div>
        <p style="margin:12px 0 4px"><strong>{{ p.especialidad || 'Sin especialidad registrada' }}</strong></p>
        <p class="texto-suave" style="margin:0 0 12px">{{ p.correo }}<br />{{ p.telefono || 'Sin teléfono' }}</p>
        <div class="acciones-fila">
          <router-link class="btn btn-sm btn-claro" :to="{ name: 'calendario' }">Ver calendario</router-link>
          <template v-if="auth.esAdmin">
            <button type="button" class="btn btn-sm btn-claro" @click="editando = p">Editar</button>
            <button type="button" class="btn btn-sm btn-fantasma" @click="cambiando = p">{{ p.activo ? 'Desactivar' : 'Activar' }}</button>
          </template>
        </div>
      </article>
    </div>
  </EstadoDatos>
  <UsuarioForm v-if="editando" :usuario="editando.id ? editando : null" rol-fijo="PROFESIONAL" @cerrar="editando = null" @guardado="editando = null; cargar()" />
  <Confirmar v-if="cambiando" :titulo="cambiando.activo ? 'Desactivar profesional' : 'Activar profesional'" :mensaje="cambiando.activo ? `${nombreCompleto(cambiando)} no podrá ingresar ni recibir nuevas citas. Sus citas anteriores se conservan.` : `${nombreCompleto(cambiando)} volverá a estar disponible.`" :confirmar="cambiando.activo ? 'Desactivar' : 'Activar'" :peligro="cambiando.activo" @cerrar="cambiando = null" @confirmado="alternar" />
</template>
