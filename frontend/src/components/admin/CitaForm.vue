<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { citasApi, pacientesApi, serviciosApi, usuariosApi, solicitudesApi } from '../../api';
import { useToastStore } from '../../stores/toast';
import { useFormulario, reglas } from '../../utils/validators';
import { nombreCompleto, Q } from '../../utils/format';
import Modal from '../ui/Modal.vue';
import Campo from '../ui/Campo.vue';
import Boton from '../ui/Boton.vue';

/**
 * Programar o reprogramar una cita.
 *  - `cita`: si viene, se reprograma (fecha, hora y profesional).
 *  - `solicitud`: si viene, la cita nace de una solicitud del portal (el servicio ya está definido).
 *  - `prefill`: valores iniciales (por ejemplo { paciente, fecha }).
 */
const props = defineProps({ cita: Object, solicitud: Object, prefill: { type: Object, default: () => ({}) } });
const emit = defineEmits(['cerrar', 'guardado']);
const toast = useToastStore();

const reprogramando = computed(() => !!props.cita);
const servicioFijo = computed(() => props.cita?.servicio?.id || props.solicitud?.servicio?.id || '');

const pacientes = ref([]);
const servicios = ref([]);
const profesionales = ref([]);
const busca = ref('');
const cargandoCat = ref(true);
const errorCat = ref('');
const horas = ref(null);
const cargandoHoras = ref(false);
const guardando = ref(false);

const { valores, errores, errorGeneral, validar, tocar, aplicarErrorApi } = useFormulario(
  {
    paciente: props.cita?.paciente?.id || props.prefill.paciente || '',
    servicio: servicioFijo.value || props.prefill.servicio || '',
    profesional: props.cita?.profesional?.id || props.prefill.profesional || '',
    fecha: props.cita?.fecha || props.prefill.fecha || '',
    horaInicio: props.cita?.horaInicio || '',
    observaciones: props.cita?.observaciones || '',
  },
  {
    paciente: [reglas.requerido('Elija un paciente')],
    servicio: [reglas.requerido('Elija un servicio')],
    profesional: [reglas.requerido('Elija un profesional')],
    fecha: [reglas.requerido('Elija la fecha'), reglas.fecha(), reglas.noPasada()],
    horaInicio: [reglas.requerido('Elija la hora')],
    observaciones: [reglas.maximo(1000)],
  },
);

const pacientesFiltrados = computed(() => {
  const t = busca.value.trim().toLowerCase();
  const lista = t ? pacientes.value.filter((p) => `${p.codigo} ${p.nombres} ${p.apellidos}`.toLowerCase().includes(t)) : pacientes.value;
  return lista.slice(0, 200);
});
const servicioSel = computed(() => servicios.value.find((s) => s.id === valores.servicio));

onMounted(async () => {
  try {
    const [p, s, pr] = await Promise.all([
      reprogramando.value ? [] : pacientesApi.listar({ estado: 'ACTIVO' }),
      serviciosApi.listar(false),
      usuariosApi.profesionales(false),
    ]);
    pacientes.value = p;
    servicios.value = s;
    profesionales.value = pr;
  } catch (e) {
    errorCat.value = e.mensaje;
  } finally {
    cargandoCat.value = false;
  }
  if (valores.profesional && valores.fecha && valores.servicio) cargarHoras();
});

async function cargarHoras() {
  horas.value = null;
  if (!valores.profesional || !valores.fecha || !valores.servicio || reglas.fecha()(valores.fecha) || reglas.noPasada()(valores.fecha)) return;
  cargandoHoras.value = true;
  try {
    horas.value = await citasApi.disponibilidad({
      profesional: valores.profesional, fecha: valores.fecha, servicio: valores.servicio, excluir: props.cita?.id,
    });
    // si el horario actual ya no está disponible, se limpia
    const actualOk = props.cita && valores.fecha === props.cita.fecha && valores.profesional === props.cita.profesional.id;
    if (valores.horaInicio && !horas.value.libres.includes(valores.horaInicio) && !actualOk) valores.horaInicio = '';
  } catch (e) {
    errorGeneral.value = e.mensaje;
  } finally {
    cargandoHoras.value = false;
  }
}
watch(() => [valores.profesional, valores.fecha, valores.servicio], cargarHoras);

const opcionesHora = computed(() => {
  const libres = horas.value?.libres || [];
  const actual = props.cita && valores.fecha === props.cita.fecha && valores.profesional === props.cita.profesional.id ? [props.cita.horaInicio] : [];
  return [...new Set([...actual, ...libres])].sort();
});

async function guardar() {
  if (!validar()) return;
  guardando.value = true;
  try {
    if (reprogramando.value) {
      await citasApi.actualizar(props.cita.id, {
        fecha: valores.fecha, horaInicio: valores.horaInicio, profesional: valores.profesional, observaciones: valores.observaciones,
      });
      toast.ok('Cita reprogramada.');
    } else if (props.solicitud) {
      await solicitudesApi.atender(props.solicitud.id, {
        paciente: valores.paciente, profesional: valores.profesional, fecha: valores.fecha, horaInicio: valores.horaInicio, observaciones: valores.observaciones,
      });
      toast.ok('Solicitud atendida: la cita quedó programada.');
    } else {
      await citasApi.crear({ ...valores });
      toast.ok('Cita programada.');
    }
    emit('guardado');
  } catch (e) {
    aplicarErrorApi(e);
  } finally {
    guardando.value = false;
  }
}
</script>

<template>
  <Modal :titulo="reprogramando ? 'Reprogramar cita' : solicitud ? 'Atender solicitud: programar cita' : 'Nueva cita'" @cerrar="emit('cerrar')">
    <p v-if="cargandoCat" role="status">Cargando opciones…</p>
    <p v-else-if="errorCat" class="estado-error" role="alert">{{ errorCat }}</p>
    <form v-else id="form-cita" novalidate @submit.prevent="guardar">
      <p v-if="errorGeneral" class="aviso-form error" role="alert">{{ errorGeneral }}</p>
      <p v-if="solicitud" class="aviso-form info">
        Solicita <strong>{{ solicitud.nombreSolicitante }}</strong> · {{ solicitud.servicio?.nombre }} · fecha preferida {{ solicitud.fechaPreferida }}.
        Elija el paciente (debe estar registrado) y el horario.
      </p>

      <template v-if="!reprogramando">
        <Campo v-slot="{ id }" label="Buscar paciente" ayuda="Escriba nombre o código para filtrar la lista.">
          <input :id="id" v-model="busca" type="search" placeholder="Ej. PAC-0003 o Mateo" />
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Paciente" :error="errores.paciente" requerido>
          <select :id="id" v-model="valores.paciente" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('paciente')">
            <option value="" disabled>Elija un paciente</option>
            <option v-for="p in pacientesFiltrados" :key="p.id" :value="p.id">{{ p.codigo }} · {{ nombreCompleto(p) }}</option>
          </select>
        </Campo>
      </template>
      <p v-else><strong>Paciente:</strong> {{ nombreCompleto(cita.paciente) }}</p>

      <Campo v-if="!servicioFijo" v-slot="{ id, describedby, invalido }" label="Servicio" :error="errores.servicio" requerido>
        <select :id="id" v-model="valores.servicio" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('servicio')">
          <option value="" disabled>Elija un servicio</option>
          <option v-for="s in servicios" :key="s.id" :value="s.id">{{ s.nombre }} · {{ s.duracionMinutos }} min · {{ Q(s.precio) }}</option>
        </select>
      </Campo>
      <p v-else><strong>Servicio:</strong> {{ cita?.servicio?.nombre || solicitud?.servicio?.nombre }}
        <span v-if="reprogramando" class="texto-suave">(conserva su duración y precio originales)</span></p>

      <div class="rejilla-form">
        <Campo v-slot="{ id, describedby, invalido }" label="Profesional" :error="errores.profesional" requerido>
          <select :id="id" v-model="valores.profesional" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('profesional')">
            <option value="" disabled>Elija un profesional</option>
            <option v-for="p in profesionales" :key="p.id" :value="p.id">{{ nombreCompleto(p) }}{{ p.especialidad ? ` · ${p.especialidad}` : '' }}</option>
          </select>
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Fecha" :error="errores.fecha" requerido>
          <input :id="id" v-model="valores.fecha" type="date" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('fecha')" />
        </Campo>
      </div>

      <Campo v-slot="{ id, describedby, invalido }" label="Hora de inicio" :error="errores.horaInicio" requerido
        :ayuda="servicioSel ? `Duración: ${servicioSel.duracionMinutos} minutos. Solo se muestran horas libres del profesional.` : 'Elija profesional, servicio y fecha para ver las horas libres.'">
        <select :id="id" v-model="valores.horaInicio" :disabled="cargandoHoras || !horas" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('horaInicio')">
          <option value="" disabled>{{ cargandoHoras ? 'Buscando horas…' : 'Elija una hora' }}</option>
          <option v-for="h in opcionesHora" :key="h" :value="h">{{ h }}</option>
        </select>
      </Campo>
      <p v-if="horas && !horas.atiende" class="aviso-form error" role="alert">El centro no atiende en esa fecha.</p>
      <p v-else-if="horas && !opcionesHora.length" class="aviso-form error" role="alert">No quedan horas libres ese día para este profesional. Pruebe otra fecha.</p>

      <Campo v-slot="{ id }" label="Observaciones" :error="errores.observaciones">
        <textarea :id="id" v-model="valores.observaciones" rows="3" maxlength="1000" />
      </Campo>
    </form>
    <template #pie>
      <button type="button" class="btn btn-claro" @click="emit('cerrar')">Cancelar</button>
      <Boton tipo="submit" form="form-cita" :cargando="guardando" :disabled="cargandoCat || !!errorCat">{{ reprogramando ? 'Guardar cambios' : 'Programar cita' }}</Boton>
    </template>
  </Modal>
</template>
