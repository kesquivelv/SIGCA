<script setup>
import { computed } from 'vue';
import { publicoApi } from '../../api';
import { usePublicoStore } from '../../stores/publico';
import { useCarga } from '../../utils/useCarga';
import Mascota from '../../components/art/Mascota.vue';
import Colinas from '../../components/art/Colinas.vue';
import Carrusel from '../../components/Carrusel.vue';
import ServicioCard from '../../components/ServicioCard.vue';
import PublicacionCard from '../../components/PublicacionCard.vue';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';

const publico = usePublicoStore();
const g = computed(() => publico.general);
const servicios = useCarga(() => publicoApi.servicios(), { inicial: [] });
const pubs = useCarga(() => publicoApi.publicaciones('EDUCATIVO'), { inicial: [] });
</script>

<template>
  <section class="hero">
    <div class="contenedor hero-in">
      <div>
        <span class="hero-nota">¡qué bueno verte por aquí!</span>
        <h1>{{ g.eslogan || 'Escuchar, comprender y crecer juntos' }}</h1>
        <p class="lead">{{ g.descripcion || 'Atención psicológica y estimulación auditiva verbal para niños, adolescentes, adultos y sus familias.' }}</p>
        <div class="hero-acciones">
          <router-link class="btn" :to="{ name: 'solicitar-cita' }">Pedir una cita</router-link>
          <router-link class="btn btn-claro" :to="{ name: 'servicios' }">Ver servicios</router-link>
        </div>
      </div>
      <div class="hero-arte"><Mascota /></div>
    </div>
    <Colinas />
  </section>

  <section v-if="g.carrusel?.length" class="seccion">
    <div class="contenedor"><Carrusel :items="g.carrusel" /></div>
  </section>

  <section class="seccion salvia">
    <div class="contenedor">
      <div class="sec-cab">
        <h2 class="sec-tit">Lo que hacemos</h2>
        <p class="sec-sub">Acompañamos cada proceso con cercanía, paciencia y mucho oficio.</p>
      </div>
      <EstadoDatos :cargando="servicios.cargando.value" :error="servicios.error.value" :vacio="!servicios.datos.value.length" texto-vacio="Pronto publicaremos nuestros servicios." @reintentar="servicios.cargar()">
        <div class="servicios-rejilla">
          <ServicioCard v-for="s in servicios.datos.value.slice(0, 3)" :key="s.id" :servicio="s" />
        </div>
        <p class="centrado" style="margin-top:30px"><router-link class="btn btn-claro" :to="{ name: 'servicios' }">Ver los {{ servicios.datos.value.length }} servicios</router-link></p>
      </EstadoDatos>
    </div>
  </section>

  <section class="seccion">
    <div class="contenedor">
      <div class="sec-cab centro">
        <h2 class="sec-tit">Pedir tu cita es sencillo</h2>
        <p class="sec-sub">Tres pasos y listo. No necesitas crear una cuenta.</p>
      </div>
      <ol class="pasos">
        <li><h3>Cuéntanos qué necesitas</h3><p>Llena el formulario con tu nombre, teléfono, el servicio y la fecha que prefieres.</p></li>
        <li><h3>Te llamamos para confirmar</h3><p>Nuestro equipo revisa la agenda y se comunica contigo para acordar el horario exacto.</p></li>
        <li><h3>Vienes a tu sesión</h3><p>Te esperamos en el horario acordado. Los pagos se realizan en el centro.</p></li>
      </ol>
    </div>
  </section>

  <section class="seccion mostaza">
    <div class="contenedor">
      <div class="sec-cab">
        <h2 class="sec-tit">Para aprender en casa</h2>
        <p class="sec-sub">Lecturas breves de nuestro equipo para acompañar el desarrollo de tu familia.</p>
      </div>
      <EstadoDatos :cargando="pubs.cargando.value" :error="pubs.error.value" :vacio="!pubs.datos.value.length" texto-vacio="Aún no hay artículos publicados." @reintentar="pubs.cargar()">
        <div class="pubs"><PublicacionCard v-for="p in pubs.datos.value.slice(0, 3)" :key="p.id" :pub="p" /></div>
        <p style="margin-top:28px"><router-link class="btn btn-claro" :to="{ name: 'educativo' }">Más contenido educativo</router-link></p>
      </EstadoDatos>
    </div>
  </section>
</template>
