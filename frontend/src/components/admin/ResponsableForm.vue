<script setup>
import { ref, computed, onMounted } from 'vue';
import { responsablesApi, pacientesApi } from '../../api';
import { useToastStore } from '../../stores/toast';
import { useFormulario, reglas } from '../../utils/validators';
import { nombreCompleto } from '../../utils/format';
import Modal from '../ui/Modal.vue';
import Campo from '../ui/Campo.vue';
import Boton from '../ui/Boton.vue';
import ImagenInput from '../ui/ImagenInput.vue';

const props = defineProps({ responsable: Object, prefillPacientes: { type: Array, default: () => [] } });
const emit = defineEmits(['cerrar', 'guardado']);
const toast = useToastStore();
const r = props.responsable;
const guardando = ref(false);
const pacientes = ref([]);
const busca = ref('');
const elegidos = ref(new Set([...(r?.pacientes || []).map((p) => p.id), ...props.prefillPacientes]));

const { valores, errores, errorGeneral, validar, tocar, aplicarErrorApi } = useFormulario(
  {
    fotoUrl: r?.fotoUrl || '', nombres: r?.nombres || '', apellidos: r?.apellidos || '', parentesco: r?.parentesco || '',
    telefono: r?.telefono || '', correo: r?.correo || '', direccion: r?.direccion || '',
  },
  {
    nombres: [reglas.requerido('Escriba los nombres')],
    apellidos: [reglas.requerido('Escriba los apellidos')],
    parentesco: [reglas.requerido('Indique el parentesco (madre, padre, tutor…)')],
    telefono: [reglas.requerido('Escriba un teléfono'), reglas.telefono()],
    correo: [reglas.requerido('Escriba el correo'), reglas.correo()],
    direccion: [reglas.requerido('Escriba la dirección')],
  },
);

onMounted(async () => { try { pacientes.value = await pacientesApi.listar(); } catch { /* se muestra vacío */ } });
const visibles = computed(() => {
  const t = busca.value.trim().toLowerCase();
  return pacientes.value.filter((p) => !t || `${p.codigo} ${p.nombres} ${p.apellidos}`.toLowerCase().includes(t)).slice(0, 100);
});
function alternar(id) { const s = new Set(elegidos.value); s.has(id) ? s.delete(id) : s.add(id); elegidos.value = s; }

async function guardar() {
  if (!validar()) return;
  guardando.value = true;
  try {
    const datos = { ...valores, pacientes: [...elegidos.value] };
    const res = r ? await responsablesApi.actualizar(r.id, datos) : await responsablesApi.crear(datos);
    toast.ok(r ? 'Responsable actualizado.' : `Responsable registrado (${res.codigo}).`);
    emit('guardado', res);
  } catch (e) {
    aplicarErrorApi(e);
  } finally {
    guardando.value = false;
  }
}
</script>

<template>
  <Modal :titulo="r ? 'Editar responsable' : 'Nuevo responsable'" ancho @cerrar="emit('cerrar')">
    <form id="form-resp" novalidate @submit.prevent="guardar">
      <p v-if="errorGeneral" class="aviso-form error" role="alert">{{ errorGeneral }}</p>
      <ImagenInput v-model="valores.fotoUrl" label="Fotografía (opcional)" />
      <div class="rejilla-form">
        <Campo v-slot="{ id, describedby, invalido }" label="Nombres" :error="errores.nombres" requerido>
          <input :id="id" v-model="valores.nombres" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('nombres')" />
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Apellidos" :error="errores.apellidos" requerido>
          <input :id="id" v-model="valores.apellidos" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('apellidos')" />
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Parentesco" :error="errores.parentesco" requerido>
          <input :id="id" v-model="valores.parentesco" list="parentescos" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('parentesco')" />
          <datalist id="parentescos"><option>Madre</option><option>Padre</option><option>Abuela</option><option>Abuelo</option><option>Tío/a</option><option>Tutor legal</option></datalist>
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Teléfono" :error="errores.telefono" requerido>
          <input :id="id" v-model="valores.telefono" type="tel" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('telefono')" />
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Correo" :error="errores.correo" requerido>
          <input :id="id" v-model="valores.correo" type="email" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('correo')" />
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Dirección" :error="errores.direccion" requerido>
          <input :id="id" v-model="valores.direccion" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('direccion')" />
        </Campo>
      </div>
      <fieldset style="border:var(--borde-fino);border-radius:12px;padding:12px 14px">
        <legend style="font-weight:800;padding:0 6px">Pacientes a cargo ({{ elegidos.size }})</legend>
        <input v-model="busca" type="search" class="input" placeholder="Buscar paciente…" aria-label="Buscar paciente" style="margin-bottom:8px" />
        <div style="max-height:180px;overflow:auto;display:grid;gap:4px">
          <label v-for="p in visibles" :key="p.id" class="check" style="font-weight:600">
            <input type="checkbox" :checked="elegidos.has(p.id)" @change="alternar(p.id)" /> {{ p.codigo }} · {{ nombreCompleto(p) }}
          </label>
          <span v-if="!visibles.length" class="texto-suave">No hay pacientes que coincidan.</span>
        </div>
      </fieldset>
    </form>
    <template #pie>
      <button type="button" class="btn btn-claro" @click="emit('cerrar')">Cancelar</button>
      <Boton tipo="submit" form="form-resp" :cargando="guardando">{{ r ? 'Guardar cambios' : 'Registrar responsable' }}</Boton>
    </template>
  </Modal>
</template>
