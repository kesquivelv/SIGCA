<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { publicoApi } from '../../api';
import { useCarga } from '../../utils/useCarga';
import { useFormulario, reglas } from '../../utils/validators';
import { Q } from '../../utils/format';
import Campo from '../../components/ui/Campo.vue';
import Boton from '../../components/ui/Boton.vue';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Decoracion from '../../components/art/Decoracion.vue';

const route = useRoute();
const servicios = useCarga(() => publicoApi.servicios(), { inicial: [] });
const hoy = new Date();
const minFecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

const { valores, errores, errorGeneral, validar, tocar, aplicarErrorApi, reiniciar } = useFormulario(
  { nombreSolicitante: '', correo: '', telefono: '', servicio: String(route.query.servicio || ''), fechaPreferida: '', mensaje: '' },
  {
    nombreSolicitante: [reglas.requerido('Escriba su nombre'), reglas.maximo(120)],
    correo: [reglas.requerido('Escriba su correo'), reglas.correo()],
    telefono: [reglas.requerido('Escriba un teléfono'), reglas.telefono()],
    servicio: [reglas.requerido('Elija un servicio')],
    fechaPreferida: [reglas.requerido('Elija la fecha que prefiere'), reglas.fecha(), reglas.noPasada()],
    mensaje: [reglas.maximo(1000)],
  },
);
const enviando = ref(false);
const resultado = ref('');
watch(() => route.query.servicio, (s) => { if (s) valores.servicio = String(s); });

async function enviar() {
  if (!validar()) return;
  enviando.value = true;
  try {
    const r = await publicoApi.solicitarCita({ ...valores });
    resultado.value = r.mensaje;
    reiniciar();
  } catch (e) {
    aplicarErrorApi(e);
  } finally {
    enviando.value = false;
  }
}
const servicioElegido = () => servicios.datos.value.find((s) => s.id === valores.servicio);
</script>

<template>
  <header class="encabezado-pagina">
    <div class="contenedor">
      <h1>Solicitar una cita</h1>
      <p>Déjanos tus datos y la fecha que prefieres. Te contactaremos para confirmar el horario exacto.</p>
    </div>
    <Decoracion tipo="sol" class="deco" />
  </header>

  <section class="seccion">
    <div class="contenedor form-cita">
      <div class="tarjeta">
        <div v-if="resultado" class="exito" role="status">
          <svg viewBox="0 0 120 120" aria-hidden="true" fill="none" stroke="#3a2b22" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="60" cy="60" r="46" fill="#dbe5cf" /><path d="M38 62l16 16 30-34" stroke="#4f6b4a" stroke-width="9" />
          </svg>
          <h2 style="font-family:var(--f-titulo);font-weight:400">¡Solicitud enviada!</h2>
          <p>{{ resultado }}</p>
          <p class="texto-suave">Recuerda que esta solicitud aún no reserva un horario: nuestro equipo te llamará para confirmarlo.</p>
          <div class="acciones-fila" style="justify-content:center">
            <button type="button" class="btn" @click="resultado = ''">Enviar otra solicitud</button>
            <router-link class="btn btn-claro" :to="{ name: 'inicio' }">Volver al inicio</router-link>
          </div>
        </div>

        <EstadoDatos v-else :cargando="servicios.cargando.value" :error="servicios.error.value" :vacio="!servicios.datos.value.length" texto-vacio="No hay servicios disponibles para solicitar." @reintentar="servicios.cargar()">
          <form novalidate @submit.prevent="enviar">
            <p v-if="errorGeneral" class="aviso-form error" role="alert">{{ errorGeneral }}</p>
            <Campo v-slot="{ id, describedby, invalido }" label="Nombre de quien solicita" :error="errores.nombreSolicitante" requerido>
              <input :id="id" v-model="valores.nombreSolicitante" autocomplete="name" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('nombreSolicitante')" />
            </Campo>
            <div class="rejilla-form">
              <Campo v-slot="{ id, describedby, invalido }" label="Correo electrónico" :error="errores.correo" requerido>
                <input :id="id" v-model="valores.correo" type="email" autocomplete="email" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('correo')" />
              </Campo>
              <Campo v-slot="{ id, describedby, invalido }" label="Teléfono" :error="errores.telefono" requerido>
                <input :id="id" v-model="valores.telefono" type="tel" autocomplete="tel" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('telefono')" />
              </Campo>
            </div>
            <Campo v-slot="{ id, describedby, invalido }" label="Servicio" :error="errores.servicio" requerido>
              <select :id="id" v-model="valores.servicio" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('servicio')">
                <option value="" disabled>Elija un servicio</option>
                <option v-for="s in servicios.datos.value" :key="s.id" :value="s.id">{{ s.nombre }} · {{ s.duracionMinutos }} min · {{ Q(s.precio) }}</option>
              </select>
            </Campo>
            <Campo v-slot="{ id, describedby, invalido }" label="Fecha que prefiere" :error="errores.fechaPreferida" requerido ayuda="El horario exacto se acuerda por teléfono.">
              <input :id="id" v-model="valores.fechaPreferida" type="date" :min="minFecha" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('fechaPreferida')" />
            </Campo>
            <Campo v-slot="{ id, describedby, invalido }" label="Cuéntanos un poco (opcional)" :error="errores.mensaje">
              <textarea :id="id" v-model="valores.mensaje" rows="4" maxlength="1000" :aria-describedby="describedby" :aria-invalid="invalido" />
            </Campo>
            <Boton tipo="submit" :cargando="enviando">Enviar solicitud</Boton>
          </form>
        </EstadoDatos>
      </div>

      <aside class="nota-pegada">
        <span class="mano">Antes de enviar</span>
        <p v-if="servicioElegido()"><strong>{{ servicioElegido().nombre }}</strong>: {{ servicioElegido().descripcion }}</p>
        <ul>
          <li>No necesitas crear una cuenta.</li>
          <li>Tu solicitud no reserva el horario hasta que te confirmemos.</li>
          <li>Los precios están en quetzales y se pagan en el centro.</li>
        </ul>
      </aside>
    </div>
  </section>
</template>
