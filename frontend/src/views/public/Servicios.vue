<script setup>
import { publicoApi } from '../../api';
import { useCarga } from '../../utils/useCarga';
import ServicioCard from '../../components/ServicioCard.vue';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Decoracion from '../../components/art/Decoracion.vue';

const { datos, cargando, error, cargar } = useCarga(() => publicoApi.servicios(), { inicial: [] });
</script>

<template>
  <header class="encabezado-pagina">
    <div class="contenedor">
      <h1>Servicios</h1>
      <p>Cada sesión se adapta a la edad, el ritmo y las metas de quien la recibe. Los precios están en quetzales.</p>
    </div>
    <Decoracion tipo="globos" class="deco" />
  </header>
  <section class="seccion">
    <div class="contenedor">
      <EstadoDatos :cargando="cargando" :error="error" :vacio="!datos.length" texto-vacio="Por ahora no hay servicios disponibles." detalle-vacio="Vuelve pronto o escríbenos desde la página de contacto." @reintentar="cargar()">
        <div class="servicios-rejilla">
          <ServicioCard v-for="s in datos" :key="s.id" :servicio="s" completo />
        </div>
      </EstadoDatos>
    </div>
  </section>
</template>
