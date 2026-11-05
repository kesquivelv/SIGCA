<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { usePanelStore } from '../stores/panel';
import { ROLES } from '../utils/format';
import Logo from '../components/art/Logo.vue';
import Icono from '../components/art/Icono.vue';

const auth = useAuthStore();
const panel = usePanelStore();
const route = useRoute();
const router = useRouter();
const abierto = ref(false);

const grupos = [
  { titulo: 'Atención', items: [
    { modulo: 'dashboard', ruta: 'dashboard', texto: 'Inicio', icono: 'inicio' },
    { modulo: 'calendario', ruta: 'calendario', texto: 'Calendario', icono: 'calendario' },
    { modulo: 'citas', ruta: 'citas', texto: 'Citas', icono: 'citas' },
    { modulo: 'solicitudes', ruta: 'solicitudes', texto: 'Solicitudes', icono: 'solicitudes', cuenta: 'solicitudes' },
  ] },
  { titulo: 'Personas', items: [
    { modulo: 'pacientes', ruta: 'pacientes', texto: 'Pacientes', icono: 'pacientes' },
    { modulo: 'responsables', ruta: 'responsables', texto: 'Responsables', icono: 'responsables' },
    { modulo: 'profesionales', ruta: 'profesionales', texto: 'Profesionales', icono: 'profesionales' },
  ] },
  { titulo: 'Centro', items: [
    { modulo: 'servicios', ruta: 'admin-servicios', texto: 'Servicios', icono: 'servicios' },
    { modulo: 'materiales', ruta: 'materiales', texto: 'Materiales', icono: 'materiales' },
    { modulo: 'pagos', ruta: 'pagos', texto: 'Pagos', icono: 'pagos' },
    { modulo: 'caja', ruta: 'caja', texto: 'Caja diaria', icono: 'caja' },
  ] },
  { titulo: 'Administración', items: [
    { modulo: 'usuarios', ruta: 'usuarios', texto: 'Usuarios y roles', icono: 'usuarios' },
    { modulo: 'contenido', ruta: 'contenido', texto: 'Contenido del portal', icono: 'contenido' },
    { modulo: 'mensajes', ruta: 'mensajes', texto: 'Mensajes', icono: 'mensajes', cuenta: 'mensajes' },
  ] },
];

onMounted(() => { if (!auth.esProfesional) panel.refrescar(); });
watch(() => route.fullPath, () => { abierto.value = false; });

function salir() {
  auth.cerrar();
  router.push({ name: 'login' });
}
</script>

<template>
  <div class="adm">
    <aside class="adm-lado" :class="{ abierto }" aria-label="Menú del panel">
      <router-link to="/" class="adm-marca"><Logo /> SIGCA</router-link>
      <nav class="adm-nav">
        <template v-for="g in grupos" :key="g.titulo">
          <template v-if="g.items.some((i) => auth.puede(i.modulo))">
            <span class="grupo">{{ g.titulo }}</span>
            <template v-for="i in g.items" :key="i.ruta">
              <router-link v-if="auth.puede(i.modulo)" :to="{ name: i.ruta }">
                <Icono :nombre="i.icono" />
                {{ auth.esProfesional && i.modulo === 'calendario' ? 'Mi agenda' : i.texto }}
                <span v-if="i.cuenta && panel[i.cuenta]" class="cuenta" :aria-label="`${panel[i.cuenta]} pendientes`">{{ panel[i.cuenta] }}</span>
              </router-link>
            </template>
          </template>
        </template>
      </nav>
      <div class="sesion">
        <strong>{{ auth.usuario.nombres }} {{ auth.usuario.apellidos }}</strong>
        <span>{{ ROLES[auth.usuario.rol] }}</span>
        <router-link to="/" class="btn btn-sm btn-claro">Ver portal público</router-link>
        <button type="button" class="btn btn-sm btn-mostaza" @click="salir"><Icono nombre="salir" style="width:18px" /> Cerrar sesión</button>
      </div>
    </aside>
    <div class="adm-vel" :class="{ abierto }" @click="abierto = false" />

    <div class="adm-main">
      <div class="adm-top">
        <button type="button" class="btn btn-sm btn-mostaza" :aria-expanded="abierto" @click="abierto = !abierto">Menú</button>
        <strong>{{ route.meta.titulo }}</strong>
      </div>
      <main id="contenido" class="adm-contenido" tabindex="-1">
        <router-view :key="route.fullPath" />
      </main>
    </div>
  </div>
</template>
