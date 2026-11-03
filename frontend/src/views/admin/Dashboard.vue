<script setup>
import { ref, computed } from 'vue';
import { dashboardApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
import { useCarga } from '../../utils/useCarga';
import { fecha, Q, nombreCompleto, ESTADO_CITA } from '../../utils/format';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Insignia from '../../components/ui/Insignia.vue';
import CitaDetalle from '../../components/admin/CitaDetalle.vue';

const auth = useAuthStore();
const { datos, cargando, error, cargar } = useCarga(() => dashboardApi.resumen());
const abierta = ref('');
const saludo = computed(() => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
});
</script>

<template>
  <div class="pag-cab">
    <div>
      <h1>{{ saludo }}, {{ auth.usuario.nombres }}</h1>
      <p v-if="datos">Hoy es {{ fecha(datos.hoy, { conDia: true }) }}.</p>
    </div>
    <div v-if="!auth.esProfesional" class="acciones-fila">
      <router-link class="btn" :to="{ name: 'citas', query: { nueva: '1' } }">Nueva cita</router-link>
      <router-link class="btn btn-claro" :to="{ name: 'pacientes', query: { nuevo: '1' } }">Nuevo paciente</router-link>
    </div>
  </div>

  <EstadoDatos :cargando="cargando" :error="error" @reintentar="cargar()">
    <template v-if="datos">
      <div class="indicadores">
        <router-link class="indicador" :to="{ name: 'calendario' }"><span class="valor">{{ datos.citasHoy.length }}</span><span class="etq">Citas hoy</span></router-link>
        <router-link class="indicador" :to="{ name: 'citas' }"><span class="valor">{{ datos.citasProximas }}</span><span class="etq">Próximas citas</span></router-link>
        <template v-if="!auth.esProfesional">
          <router-link class="indicador" :class="{ alerta: datos.solicitudesPendientes }" :to="{ name: 'solicitudes' }"><span class="valor">{{ datos.solicitudesPendientes }}</span><span class="etq">Solicitudes por atender</span></router-link>
          <router-link class="indicador" :to="{ name: 'pacientes' }"><span class="valor">{{ datos.pacientesActivos }}</span><span class="etq">Pacientes activos</span></router-link>
          <router-link class="indicador" :to="{ name: 'pagos' }"><span class="valor">{{ Q(datos.ingresosHoy) }}</span><span class="etq">Ingresos de hoy</span></router-link>
          <router-link class="indicador" :class="{ alerta: !datos.cajaAbierta }" :to="{ name: 'caja' }"><span class="valor">{{ datos.cajaAbierta ? 'Abierta' : 'Cerrada' }}</span><span class="etq">Su caja diaria</span></router-link>
          <router-link class="indicador" :to="{ name: 'mensajes' }"><span class="valor">{{ datos.mensajesSinLeer }}</span><span class="etq">Mensajes sin leer</span></router-link>
        </template>
      </div>

      <section class="panel">
        <h2>{{ auth.esProfesional ? 'Mi agenda de hoy' : 'Citas de hoy' }}</h2>
        <p v-if="!datos.citasHoy.length" class="texto-suave">No hay citas programadas para hoy.</p>
        <ul v-else class="lista-simple">
          <li v-for="c in datos.citasHoy" :key="c.id">
            <strong style="min-width:92px">{{ c.horaInicio }}–{{ c.horaFin }}</strong>
            <span class="crece">{{ nombreCompleto(c.paciente) }}<br /><span class="texto-suave">{{ c.servicio.nombre }}<template v-if="!auth.esProfesional"> · {{ nombreCompleto(c.profesional) }}</template></span></span>
            <Insignia :valor="c.estado" :mapa="ESTADO_CITA" />
            <button type="button" class="btn btn-sm btn-claro" @click="abierta = c.id">Ver</button>
          </li>
        </ul>
      </section>
    </template>
  </EstadoDatos>

  <CitaDetalle v-if="abierta" :cita-id="abierta" @cerrar="abierta = ''" @cambio="cargar()" />
</template>
