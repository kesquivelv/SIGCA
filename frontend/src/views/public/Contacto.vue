<script setup>
import { computed, ref } from 'vue';
import { publicoApi } from '../../api';
import { usePublicoStore } from '../../stores/publico';
import { useToastStore } from '../../stores/toast';
import { useFormulario, reglas } from '../../utils/validators';
import Campo from '../../components/ui/Campo.vue';
import Boton from '../../components/ui/Boton.vue';
import Decoracion from '../../components/art/Decoracion.vue';

const publico = usePublicoStore();
const toast = useToastStore();
const hoy = new Date().getDay();
const horarios = computed(() => [...publico.horarios].sort((a, b) => ((a.dia + 6) % 7) - ((b.dia + 6) % 7)));
const c = computed(() => publico.contacto);

const { valores, errores, errorGeneral, validar, tocar, aplicarErrorApi, reiniciar } = useFormulario(
  { nombre: '', correo: '', telefono: '', asunto: '', mensaje: '' },
  {
    nombre: [reglas.requerido('Escriba su nombre'), reglas.maximo(120)],
    correo: [reglas.requerido('Escriba su correo'), reglas.correo()],
    telefono: [reglas.requerido('Escriba un teléfono'), reglas.telefono()],
    asunto: [reglas.requerido('Indique el asunto'), reglas.maximo(150)],
    mensaje: [reglas.requerido('Escriba su mensaje'), reglas.minimo(10), reglas.maximo(2000)],
  },
);
const enviando = ref(false);
const enviado = ref(false);

async function enviar() {
  if (!validar()) return;
  enviando.value = true;
  try {
    const r = await publicoApi.enviarMensaje({ ...valores });
    toast.ok(r.mensaje);
    enviado.value = true;
    reiniciar();
  } catch (e) {
    aplicarErrorApi(e);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <header class="encabezado-pagina">
    <div class="contenedor">
      <h1>Horarios y contacto</h1>
      <p>Escríbenos o llámanos. Con gusto resolvemos tus dudas antes de tu primera visita.</p>
    </div>
    <Decoracion tipo="globos" class="deco" />
  </header>

  <section class="seccion">
    <div class="contenedor dos-col">
      <div>
        <h2 class="sec-tit" style="font-size:1.9rem">Horario de atención</h2>
        <p v-if="publico.error && !horarios.length" class="estado-error" role="alert">{{ publico.error }}</p>
        <ul class="horario-lista">
          <li v-for="h in horarios" :key="h.dia" :class="{ hoy: h.dia === hoy }">
            <span>{{ h.nombreDia }}<template v-if="h.dia === hoy"> (hoy)</template></span>
            <span v-if="h.activo">{{ h.horaInicio }} a {{ h.horaFin }}</span>
            <span v-else class="cerrado">Cerrado</span>
          </li>
        </ul>

        <h2 class="sec-tit" style="font-size:1.9rem;margin-top:34px">Dónde encontrarnos</h2>
        <ul class="datos-contacto">
          <li v-if="c.direccion"><span aria-hidden="true">📍</span><span>{{ c.direccion }}</span></li>
          <li v-if="c.telefono"><span aria-hidden="true">📞</span><span>Teléfono: <a :href="`tel:${c.telefono}`">{{ c.telefono }}</a></span></li>
          <li v-if="c.whatsapp"><span aria-hidden="true">💬</span><span>WhatsApp: {{ c.whatsapp }}</span></li>
          <li v-if="c.correo"><span aria-hidden="true">✉️</span><a :href="`mailto:${c.correo}`">{{ c.correo }}</a></li>
        </ul>
        <p v-if="c.mapaUrl"><a class="btn btn-sm btn-claro" :href="c.mapaUrl" target="_blank" rel="noopener">Abrir mapa en otra pestaña</a></p>
      </div>

      <div class="tarjeta">
        <h2 style="font-family:var(--f-titulo);font-weight:400;font-size:1.7rem">Envíanos un mensaje</h2>
        <p v-if="enviado" class="aviso-form info" role="status">¡Gracias! Recibimos tu mensaje y te responderemos pronto.</p>
        <form novalidate @submit.prevent="enviar">
          <p v-if="errorGeneral" class="aviso-form error" role="alert">{{ errorGeneral }}</p>
          <Campo v-slot="{ id, describedby, invalido }" label="Nombre completo" :error="errores.nombre" requerido>
            <input :id="id" v-model="valores.nombre" autocomplete="name" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('nombre')" />
          </Campo>
          <div class="rejilla-form">
            <Campo v-slot="{ id, describedby, invalido }" label="Correo electrónico" :error="errores.correo" requerido>
              <input :id="id" v-model="valores.correo" type="email" autocomplete="email" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('correo')" />
            </Campo>
            <Campo v-slot="{ id, describedby, invalido }" label="Teléfono" :error="errores.telefono" requerido>
              <input :id="id" v-model="valores.telefono" type="tel" autocomplete="tel" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('telefono')" />
            </Campo>
          </div>
          <Campo v-slot="{ id, describedby, invalido }" label="Asunto" :error="errores.asunto" requerido>
            <input :id="id" v-model="valores.asunto" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('asunto')" />
          </Campo>
          <Campo v-slot="{ id, describedby, invalido }" label="Mensaje" :error="errores.mensaje" requerido ayuda="Mínimo 10 caracteres.">
            <textarea :id="id" v-model="valores.mensaje" rows="5" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('mensaje')" />
          </Campo>
          <Boton tipo="submit" :cargando="enviando">Enviar mensaje</Boton>
        </form>
      </div>
    </div>
  </section>
</template>
