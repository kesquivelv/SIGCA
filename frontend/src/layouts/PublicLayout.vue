<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { usePublicoStore } from '../stores/publico';
import { useAuthStore } from '../stores/auth';
import Logo from '../components/art/Logo.vue';

const publico = usePublicoStore();
const auth = useAuthStore();
const route = useRoute();
const menu = ref(false);
publico.cargar();

watch(() => route.fullPath, () => { menu.value = false; });
const nombre = computed(() => publico.general.nombreCentro || 'SIGCA');
const anio = new Date().getFullYear();
</script>

<template>
  <div class="portal">
    <header class="p-cab">
      <div class="contenedor p-cab-in">
        <router-link to="/" class="p-logo" aria-label="Ir al inicio">
          <Logo />
          <span>{{ nombre }}<small>atención psicológica y auditiva</small></span>
        </router-link>
        <button type="button" class="btn btn-sm btn-claro p-menu-btn" :aria-expanded="menu" aria-controls="menu-principal" @click="menu = !menu">
          {{ menu ? 'Cerrar' : 'Menú' }}
        </button>
        <nav id="menu-principal" class="p-nav" :class="{ abierto: menu }" aria-label="Principal">
          <router-link :to="{ name: 'inicio' }">Inicio</router-link>
          <router-link :to="{ name: 'nosotros' }">Misión y visión</router-link>
          <router-link :to="{ name: 'servicios' }">Servicios</router-link>
          <router-link :to="{ name: 'educativo' }">Aprende</router-link>
          <router-link :to="{ name: 'institucional' }">Institucional</router-link>
          <router-link :to="{ name: 'contacto' }">Contacto</router-link>
          <router-link :to="{ name: 'solicitar-cita' }" class="btn btn-sm">Pedir cita</router-link>
          <router-link :to="{ name: auth.autenticado ? 'dashboard' : 'login' }" class="btn btn-sm btn-fantasma">{{ auth.autenticado ? 'Mi panel' : 'Personal' }}</router-link>
        </nav>
      </div>
    </header>

    <main id="contenido" tabindex="-1">
      <router-view />
    </main>

    <footer class="p-pie">
      <div class="contenedor p-pie-in">
        <div>
          <h2>{{ nombre }}</h2>
          <p>{{ publico.general.eslogan }}</p>
          <p v-if="publico.contacto.direccion">{{ publico.contacto.direccion }}</p>
        </div>
        <div>
          <h2>Visítanos</h2>
          <ul>
            <li><router-link :to="{ name: 'servicios' }">Servicios</router-link></li>
            <li><router-link :to="{ name: 'educativo' }">Contenido educativo</router-link></li>
            <li><router-link :to="{ name: 'solicitar-cita' }">Solicitar una cita</router-link></li>
          </ul>
        </div>
        <div>
          <h2>Contacto</h2>
          <ul>
            <li v-if="publico.contacto.telefono">Tel. {{ publico.contacto.telefono }}</li>
            <li v-if="publico.contacto.whatsapp">WhatsApp {{ publico.contacto.whatsapp }}</li>
            <li v-if="publico.contacto.correo"><a :href="`mailto:${publico.contacto.correo}`">{{ publico.contacto.correo }}</a></li>
            <li v-if="publico.contacto.facebook"><a :href="publico.contacto.facebook" target="_blank" rel="noopener">Facebook</a></li>
            <li v-if="publico.contacto.instagram"><a :href="publico.contacto.instagram" target="_blank" rel="noopener">Instagram</a></li>
          </ul>
        </div>
        <p class="copy">{{ publico.general.piePagina || `© ${anio} ${nombre}. Todos los derechos reservados.` }}</p>
      </div>
    </footer>
  </div>
</template>
