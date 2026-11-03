<script setup>
import { ref, computed } from 'vue';
import { publicoApi } from '../../api';
import { useCarga } from '../../utils/useCarga';
import { usePublicoStore } from '../../stores/publico';
import { TIPOS_PUBLICACION } from '../../utils/format';
import PublicacionCard from '../../components/PublicacionCard.vue';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Decoracion from '../../components/art/Decoracion.vue';

const publico = usePublicoStore();
const { datos, cargando, error, cargar } = useCarga(() => publicoApi.publicaciones('CAPACITACION,ESCUELA_PADRES,ACTIVIDAD'), { inicial: [] });
const filtro = ref('');
const tipos = ['CAPACITACION', 'ESCUELA_PADRES', 'ACTIVIDAD'];
const visibles = computed(() => (filtro.value ? datos.value.filter((p) => p.tipo === filtro.value) : datos.value));
</script>

<template>
  <header class="encabezado-pagina">
    <div class="contenedor">
      <h1>Información institucional</h1>
      <p>{{ publico.general.nombreCentro }} también forma a docentes, empresas y familias. Conoce nuestras capacitaciones, la escuela para padres y nuestras actividades.</p>
    </div>
    <Decoracion tipo="sol" class="deco" />
  </header>
  <section class="seccion">
    <div class="contenedor">
      <div class="filtro-tipos" role="group" aria-label="Filtrar por tipo">
        <button type="button" class="chip" :aria-pressed="filtro === ''" @click="filtro = ''">Todo</button>
        <button v-for="t in tipos" :key="t" type="button" class="chip" :aria-pressed="filtro === t" @click="filtro = t">{{ TIPOS_PUBLICACION[t] }}</button>
      </div>
      <EstadoDatos :cargando="cargando" :error="error" :vacio="!visibles.length" texto-vacio="No hay publicaciones en esta categoría." @reintentar="cargar()">
        <div class="pubs"><PublicacionCard v-for="p in visibles" :key="p.id" :pub="p" mostrar-tipo /></div>
      </EstadoDatos>
    </div>
  </section>
</template>
