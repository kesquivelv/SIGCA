<script setup>
import { publicoApi } from '../../api';
import { useCarga } from '../../utils/useCarga';
import PublicacionCard from '../../components/PublicacionCard.vue';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Decoracion from '../../components/art/Decoracion.vue';

const { datos, cargando, error, cargar } = useCarga(() => publicoApi.publicaciones('EDUCATIVO'), { inicial: [] });
</script>

<template>
  <header class="encabezado-pagina">
    <div class="contenedor">
      <h1>Contenido educativo</h1>
      <p>Guías y consejos escritos por nuestro equipo sobre lenguaje, audición y bienestar emocional.</p>
    </div>
    <Decoracion tipo="libro" class="deco" />
  </header>
  <section class="seccion">
    <div class="contenedor">
      <EstadoDatos :cargando="cargando" :error="error" :vacio="!datos.length" texto-vacio="Todavía no hay artículos." detalle-vacio="Estamos preparando contenido nuevo." @reintentar="cargar()">
        <div class="pubs"><PublicacionCard v-for="p in datos" :key="p.id" :pub="p" /></div>
      </EstadoDatos>
    </div>
  </section>
</template>
