<template>
  <section class="seccion">
    <div class="contenedor estado">
      <h1 class="sec-tit">No encontramos esa página</h1>
      <p>La dirección no existe o fue movida.</p>
      <router-link class="btn" :to="{ name: 'inicio' }">Volver al inicio</router-link>
    </div>
  </section>
</template>
