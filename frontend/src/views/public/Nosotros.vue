<script setup>
import { usePublicoStore } from '../../stores/publico';
import Decoracion from '../../components/art/Decoracion.vue';

const publico = usePublicoStore();
</script>

<template>
  <header class="encabezado-pagina">
    <div class="contenedor">
      <h1>Misión y visión</h1>
      <p>{{ publico.general.descripcion || 'Quiénes somos y hacia dónde caminamos.' }}</p>
    </div>
    <Decoracion tipo="sol" class="deco" />
  </header>

  <section class="seccion">
    <div class="contenedor">
      <p v-if="publico.error && !publico.cargado" class="estado-error" role="alert">{{ publico.error }}</p>
      <div class="mv">
        <article class="mv-card m">
          <h2>Misión</h2>
          <p>{{ publico.misionVision.mision || 'Pronto compartiremos nuestra misión.' }}</p>
        </article>
        <article class="mv-card v">
          <h2>Visión</h2>
          <p>{{ publico.misionVision.vision || 'Pronto compartiremos nuestra visión.' }}</p>
        </article>
      </div>
    </div>
  </section>

  <section v-if="publico.misionVision.valores?.length" class="seccion beige">
    <div class="contenedor">
      <h2 class="sec-tit">Lo que nos guía</h2>
      <ul class="valores">
        <li v-for="v in publico.misionVision.valores" :key="v">{{ v }}</li>
      </ul>
    </div>
  </section>
</template>
