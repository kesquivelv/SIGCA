<script setup>
import { ref } from 'vue';
import { serviciosApi } from '../../api';
import { useToastStore } from '../../stores/toast';
import { useCarga } from '../../utils/useCarga';
import { useFormulario, reglas } from '../../utils/validators';
import { Q } from '../../utils/format';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Tabla from '../../components/ui/Tabla.vue';
import Modal from '../../components/ui/Modal.vue';
import Campo from '../../components/ui/Campo.vue';
import Boton from '../../components/ui/Boton.vue';
import ImagenInput from '../../components/ui/ImagenInput.vue';

const toast = useToastStore();
const { datos, cargando, error, cargar } = useCarga(() => serviciosApi.listar(true), { inicial: [] });
const editando = ref(null);
const guardando = ref(false);
const form = useFormulario(
  { nombre: '', descripcion: '', duracionMinutos: 60, precio: '', imagenUrl: '' },
  {
    nombre: [reglas.requerido('Escriba el nombre'), reglas.maximo(100)],
    descripcion: [reglas.requerido('Escriba la descripción'), reglas.maximo(1500)],
    duracionMinutos: [reglas.requerido('Indique la duración'), reglas.enteroEntre(15, 480)],
    precio: [reglas.requerido('Indique el precio'), reglas.monto({ min: 0 })],
  },
);
function abrir(s) {
  editando.value = s || {};
  form.reiniciar(s ? { nombre: s.nombre, descripcion: s.descripcion, duracionMinutos: s.duracionMinutos, precio: s.precio.toFixed(2), imagenUrl: s.imagenUrl || '' }
    : { nombre: '', descripcion: '', duracionMinutos: 60, precio: '', imagenUrl: '' });
}
async function guardar() {
  if (!form.validar()) return;
  guardando.value = true;
  try {
    const d = { ...form.valores, duracionMinutos: Number(form.valores.duracionMinutos), precio: Number(form.valores.precio) };
    if (editando.value.id) await serviciosApi.actualizar(editando.value.id, d); else await serviciosApi.crear(d);
    toast.ok(editando.value.id ? 'Servicio actualizado.' : 'Servicio creado.');
    editando.value = null;
    cargar();
  } catch (e) { form.aplicarErrorApi(e); } finally { guardando.value = false; }
}
async function alternar(s) {
  try {
    await serviciosApi.estado(s.id, s.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO');
    toast.ok(s.estado === 'ACTIVO' ? 'Servicio desactivado: ya no se muestra en el portal.' : 'Servicio activado.');
    cargar();
  } catch (e) { toast.error(e.mensaje); }
}
const columnas = [
  { key: 'nombre', label: 'Servicio' }, { key: 'duracion', label: 'Duración' }, { key: 'precio', label: 'Precio', clase: 'num' }, { key: 'estado', label: 'Estado' },
];
</script>

<template>
  <div class="pag-cab">
    <div><h1>Servicios</h1><p>Catálogo que ve el público y que se usa al programar citas. Los precios están en quetzales.</p></div>
    <button type="button" class="btn" @click="abrir()">Nuevo servicio</button>
  </div>
  <EstadoDatos :cargando="cargando" :error="error" :vacio="!datos.length" texto-vacio="Aún no hay servicios." @reintentar="cargar()">
    <Tabla :columnas="columnas" :filas="datos" con-acciones>
      <template #c-nombre="{ fila }"><strong>{{ fila.nombre }}</strong> <span class="texto-suave">{{ fila.codigo }}</span><br /><span class="texto-suave">{{ fila.descripcion.slice(0, 90) }}{{ fila.descripcion.length > 90 ? '…' : '' }}</span></template>
      <template #c-duracion="{ fila }">{{ fila.duracionMinutos }} min</template>
      <template #c-precio="{ fila }">{{ Q(fila.precio) }}</template>
      <template #c-estado="{ fila }"><span class="badge" :class="fila.estado === 'ACTIVO' ? 'badge-salvia' : 'badge-neutro'">{{ fila.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}</span></template>
      <template #acciones="{ fila }">
        <button type="button" class="btn btn-sm btn-claro" @click="abrir(fila)">Editar</button>
        <button type="button" class="btn btn-sm btn-fantasma" @click="alternar(fila)">{{ fila.estado === 'ACTIVO' ? 'Desactivar' : 'Activar' }}</button>
      </template>
    </Tabla>
  </EstadoDatos>

  <Modal v-if="editando" :titulo="editando.id ? 'Editar servicio' : 'Nuevo servicio'" @cerrar="editando = null">
    <form id="form-serv" novalidate @submit.prevent="guardar">
      <p v-if="form.errorGeneral.value" class="aviso-form error" role="alert">{{ form.errorGeneral.value }}</p>
      <Campo v-slot="{ id, describedby, invalido }" label="Nombre" :error="form.errores.nombre" requerido>
        <input :id="id" v-model="form.valores.nombre" maxlength="100" :aria-describedby="describedby" :aria-invalid="invalido" @blur="form.tocar('nombre')" />
      </Campo>
      <Campo v-slot="{ id, describedby, invalido }" label="Descripción" :error="form.errores.descripcion" requerido>
        <textarea :id="id" v-model="form.valores.descripcion" rows="3" maxlength="1500" :aria-describedby="describedby" :aria-invalid="invalido" @blur="form.tocar('descripcion')" />
      </Campo>
      <div class="rejilla-form">
        <Campo v-slot="{ id, describedby, invalido }" label="Duración (minutos)" :error="form.errores.duracionMinutos" requerido ayuda="Entre 15 y 480.">
          <input :id="id" v-model="form.valores.duracionMinutos" type="number" min="15" max="480" step="5" :aria-describedby="describedby" :aria-invalid="invalido" @blur="form.tocar('duracionMinutos')" />
        </Campo>
        <Campo v-slot="{ id, describedby, invalido }" label="Precio (Q)" :error="form.errores.precio" requerido :ayuda="editando.id ? 'Cambiar el precio no afecta las citas ya programadas.' : ''">
          <input :id="id" v-model="form.valores.precio" inputmode="decimal" :aria-describedby="describedby" :aria-invalid="invalido" @blur="form.tocar('precio')" />
        </Campo>
      </div>
      <ImagenInput v-model="form.valores.imagenUrl" label="Imagen para el portal (opcional)" />
    </form>
    <template #pie><button type="button" class="btn btn-claro" @click="editando = null">Cancelar</button><Boton tipo="submit" form="form-serv" :cargando="guardando">Guardar</Boton></template>
  </Modal>
</template>
