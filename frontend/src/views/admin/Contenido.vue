<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { publicoApi, contenidoApi } from '../../api';
import { usePublicoStore } from '../../stores/publico';
import { useToastStore } from '../../stores/toast';
import { useCarga } from '../../utils/useCarga';
import { useFormulario, reglas } from '../../utils/validators';
import { fecha, soloFecha, TIPOS_PUBLICACION } from '../../utils/format';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Tabla from '../../components/ui/Tabla.vue';
import Modal from '../../components/ui/Modal.vue';
import Campo from '../../components/ui/Campo.vue';
import Boton from '../../components/ui/Boton.vue';
import ImagenInput from '../../components/ui/ImagenInput.vue';

const publico = usePublicoStore();
const toast = useToastStore();
const pestana = ref('general');
const contenido = useCarga(() => publicoApi.contenido());
const guardando = ref(false);
const errorGuardar = ref('');

// ---- Copias editables de cada sección ----
const general = reactive({ nombreCentro: '', eslogan: '', descripcion: '', logoUrl: '', piePagina: '', carrusel: [] });
const mv = reactive({ mision: '', vision: '', valores: [] });
const contacto = reactive({ telefono: '', correo: '', direccion: '', whatsapp: '', facebook: '', instagram: '', mapaUrl: '' });
const errores = reactive({});

watch(() => contenido.datos.value, (d) => {
  if (!d) return;
  Object.assign(general, { nombreCentro: '', eslogan: '', descripcion: '', logoUrl: '', piePagina: '', carrusel: [] }, JSON.parse(JSON.stringify(d.general || {})));
  Object.assign(mv, { mision: '', vision: '', valores: [] }, JSON.parse(JSON.stringify(d.misionVision || {})));
  Object.assign(contacto, { telefono: '', correo: '', direccion: '', whatsapp: '', facebook: '', instagram: '', mapaUrl: '' }, JSON.parse(JSON.stringify(d.contacto || {})));
}, { immediate: true });

async function guardarClave(clave, datos, validaciones = {}) {
  Object.keys(errores).forEach((k) => delete errores[k]);
  errorGuardar.value = '';
  for (const [campo, regla] of Object.entries(validaciones)) {
    const msg = regla(datos[campo]);
    if (msg) errores[campo] = msg;
  }
  if (Object.keys(errores).length) { errorGuardar.value = 'Revise los campos marcados.'; return; }
  guardando.value = true;
  try {
    await contenidoApi.guardar(clave, JSON.parse(JSON.stringify(datos)));
    toast.ok('Cambios guardados. Ya se ven en el portal público.');
    publico.cargar(true);
  } catch (e) { errorGuardar.value = e.mensaje; } finally { guardando.value = false; }
}
const guardarGeneral = () => guardarClave('general', general, { nombreCentro: reglas.requerido('El nombre del centro es obligatorio') });
const guardarMV = () => guardarClave('misionVision', { ...mv, valores: mv.valores.filter((v) => v.trim()) }, { mision: reglas.requerido('Escriba la misión'), vision: reglas.requerido('Escriba la visión') });
const guardarContacto = () => guardarClave('contacto', contacto, { correo: reglas.correo(), telefono: reglas.telefono(), facebook: reglas.url(), instagram: reglas.url(), mapaUrl: reglas.url() });

// ---- Publicaciones ----
const filtroTipo = ref('');
const pubs = useCarga(() => contenidoApi.publicaciones({ tipo: filtroTipo.value }), { inicial: [] });
watch(filtroTipo, () => pubs.cargar());
const editPub = ref(null);
const pubForm = useFormulario(
  { tipo: 'EDUCATIVO', titulo: '', descripcion: '', fechaPublicacion: '', imagenUrl: '', enlace: '' },
  { tipo: [reglas.requerido()], titulo: [reglas.requerido('Escriba el título'), reglas.maximo(150)], descripcion: [reglas.requerido('Escriba el texto'), reglas.maximo(5000)], enlace: [reglas.url()] },
);
function abrirPub(p) {
  editPub.value = p || {};
  pubForm.reiniciar(p ? { tipo: p.tipo, titulo: p.titulo, descripcion: p.descripcion, fechaPublicacion: soloFecha(p.fechaPublicacion), imagenUrl: p.imagenUrl || '', enlace: p.enlace || '' }
    : { tipo: 'EDUCATIVO', titulo: '', descripcion: '', fechaPublicacion: '', imagenUrl: '', enlace: '' });
}
async function guardarPub() {
  if (!pubForm.validar()) return;
  guardando.value = true;
  try {
    const d = { ...pubForm.valores };
    if (!d.fechaPublicacion) delete d.fechaPublicacion;
    if (editPub.value.id) await contenidoApi.actualizarPublicacion(editPub.value.id, d); else await contenidoApi.crearPublicacion(d);
    toast.ok(editPub.value.id ? 'Publicación actualizada.' : 'Publicación creada.');
    editPub.value = null; pubs.cargar();
  } catch (e) { pubForm.aplicarErrorApi(e); } finally { guardando.value = false; }
}
async function alternarPub(p) {
  try { await contenidoApi.estadoPublicacion(p.id, !p.activo); toast.ok(p.activo ? 'Publicación oculta del portal.' : 'Publicación visible en el portal.'); pubs.cargar(); } catch (e) { toast.error(e.mensaje); }
}
const colPubs = [{ key: 'titulo', label: 'Título' }, { key: 'tipo', label: 'Sección' }, { key: 'fecha', label: 'Fecha' }, { key: 'activo', label: 'Visibilidad' }];

// ---- Horarios ----
const horarios = useCarga(() => publicoApi.horarios(), { inicial: [] });
const hor = ref([]);
watch(() => horarios.datos.value, (h) => { hor.value = JSON.parse(JSON.stringify([...h].sort((a, b) => ((a.dia + 6) % 7) - ((b.dia + 6) % 7)))); }, { immediate: true });
const errHor = ref('');
async function guardarHorarios() {
  errHor.value = '';
  for (const h of hor.value) if (h.activo && h.horaInicio >= h.horaFin) { errHor.value = `${h.nombreDia}: la hora de inicio debe ser menor que la de fin.`; return; }
  guardando.value = true;
  try {
    await contenidoApi.guardarHorarios(hor.value.map(({ dia, activo, horaInicio, horaFin }) => ({ dia, activo, horaInicio, horaFin })));
    toast.ok('Horarios guardados. Las nuevas citas usarán este horario.');
    publico.cargar(true);
  } catch (e) { errHor.value = e.mensaje; } finally { guardando.value = false; }
}

onMounted(() => {});
const tabs = [['general', 'General y portada'], ['mision', 'Misión y visión'], ['contacto', 'Contacto'], ['publicaciones', 'Publicaciones'], ['horarios', 'Horarios']];
</script>

<template>
  <div class="pag-cab"><div><h1>Contenido del portal</h1><p>Lo que escriba aquí se muestra en el sitio público.</p></div></div>
  <div class="pestanas" role="tablist">
    <button v-for="t in tabs" :key="t[0]" type="button" role="tab" :aria-selected="pestana === t[0]" @click="pestana = t[0]; errorGuardar = ''">{{ t[1] }}</button>
  </div>
  <p v-if="errorGuardar && ['general', 'mision', 'contacto'].includes(pestana)" class="aviso-form error" role="alert">{{ errorGuardar }}</p>

  <EstadoDatos v-if="['general', 'mision', 'contacto'].includes(pestana)" :cargando="contenido.cargando.value" :error="contenido.error.value" @reintentar="contenido.cargar()">
    <!-- GENERAL -->
    <form v-if="pestana === 'general'" class="panel" novalidate @submit.prevent="guardarGeneral">
      <div class="rejilla-form">
        <Campo v-slot="{ id }" label="Nombre del centro" :error="errores.nombreCentro" requerido><input :id="id" v-model="general.nombreCentro" /></Campo>
        <Campo v-slot="{ id }" label="Eslogan (titular de la portada)"><input :id="id" v-model="general.eslogan" /></Campo>
        <Campo v-slot="{ id }" label="Descripción corta" class="ancho-total"><textarea :id="id" v-model="general.descripcion" rows="3" /></Campo>
        <Campo v-slot="{ id }" label="Texto del pie de página" class="ancho-total"><input :id="id" v-model="general.piePagina" /></Campo>
      </div>
      <h2 style="margin-top:8px">Imágenes de la portada</h2>
      <p v-if="!general.carrusel.length" class="texto-suave">Aún no hay imágenes en el carrusel.</p>
      <div v-for="(it, i) in general.carrusel" :key="i" class="panel" style="margin-bottom:12px">
        <ImagenInput v-model="it.imagenUrl" :label="`Imagen ${i + 1}`" />
        <div class="rejilla-form">
          <Campo v-slot="{ id }" label="Título"><input :id="id" v-model="it.titulo" /></Campo>
          <Campo v-slot="{ id }" label="Subtítulo"><input :id="id" v-model="it.subtitulo" /></Campo>
        </div>
        <button type="button" class="btn btn-sm btn-fantasma" @click="general.carrusel.splice(i, 1)">Quitar imagen</button>
      </div>
      <div class="acciones-fila">
        <button type="button" class="btn btn-sm btn-claro" :disabled="general.carrusel.length >= 8" @click="general.carrusel.push({ imagenUrl: '', titulo: '', subtitulo: '' })">Agregar imagen</button>
        <Boton tipo="submit" :cargando="guardando">Guardar cambios</Boton>
      </div>
    </form>

    <!-- MISIÓN Y VISIÓN -->
    <form v-if="pestana === 'mision'" class="panel" novalidate @submit.prevent="guardarMV">
      <Campo v-slot="{ id }" label="Misión" :error="errores.mision" requerido><textarea :id="id" v-model="mv.mision" rows="4" /></Campo>
      <Campo v-slot="{ id }" label="Visión" :error="errores.vision" requerido><textarea :id="id" v-model="mv.vision" rows="4" /></Campo>
      <h2>Valores</h2>
      <div v-for="(v, i) in mv.valores" :key="i" style="display:flex;gap:8px;margin-bottom:8px">
        <input v-model="mv.valores[i]" class="input" :aria-label="`Valor ${i + 1}`" />
        <button type="button" class="btn btn-sm btn-fantasma" :aria-label="`Quitar valor ${i + 1}`" @click="mv.valores.splice(i, 1)">Quitar</button>
      </div>
      <div class="acciones-fila" style="margin-top:12px">
        <button type="button" class="btn btn-sm btn-claro" @click="mv.valores.push('')">Agregar valor</button>
        <Boton tipo="submit" :cargando="guardando">Guardar cambios</Boton>
      </div>
    </form>

    <!-- CONTACTO -->
    <form v-if="pestana === 'contacto'" class="panel" novalidate @submit.prevent="guardarContacto">
      <div class="rejilla-form">
        <Campo v-slot="{ id }" label="Teléfono" :error="errores.telefono"><input :id="id" v-model="contacto.telefono" type="tel" /></Campo>
        <Campo v-slot="{ id }" label="WhatsApp"><input :id="id" v-model="contacto.whatsapp" type="tel" /></Campo>
        <Campo v-slot="{ id }" label="Correo" :error="errores.correo"><input :id="id" v-model="contacto.correo" type="email" /></Campo>
        <Campo v-slot="{ id }" label="Dirección"><input :id="id" v-model="contacto.direccion" /></Campo>
        <Campo v-slot="{ id }" label="Facebook (enlace)" :error="errores.facebook"><input :id="id" v-model="contacto.facebook" type="url" placeholder="https://…" /></Campo>
        <Campo v-slot="{ id }" label="Instagram (enlace)" :error="errores.instagram"><input :id="id" v-model="contacto.instagram" type="url" placeholder="https://…" /></Campo>
        <Campo v-slot="{ id }" label="Enlace al mapa" :error="errores.mapaUrl" class="ancho-total"><input :id="id" v-model="contacto.mapaUrl" type="url" placeholder="https://maps.google.com/…" /></Campo>
      </div>
      <Boton tipo="submit" :cargando="guardando">Guardar cambios</Boton>
    </form>
  </EstadoDatos>

  <!-- PUBLICACIONES -->
  <template v-if="pestana === 'publicaciones'">
    <div class="barra-filtros">
      <div class="campo"><label for="pb-t">Sección</label><select id="pb-t" v-model="filtroTipo"><option value="">Todas</option><option v-for="(t, k) in TIPOS_PUBLICACION" :key="k" :value="k">{{ t }}</option></select></div>
      <button type="button" class="btn" @click="abrirPub()">Nueva publicación</button>
    </div>
    <EstadoDatos :cargando="pubs.cargando.value" :error="pubs.error.value" :vacio="!pubs.datos.value.length" texto-vacio="No hay publicaciones." @reintentar="pubs.cargar()">
      <Tabla :columnas="colPubs" :filas="pubs.datos.value" con-acciones>
        <template #c-tipo="{ fila }"><span class="badge">{{ TIPOS_PUBLICACION[fila.tipo] }}</span></template>
        <template #c-fecha="{ fila }">{{ fecha(fila.fechaPublicacion, { corta: true }) }}</template>
        <template #c-activo="{ fila }"><span class="badge" :class="fila.activo ? 'badge-salvia' : 'badge-neutro'">{{ fila.activo ? 'Visible' : 'Oculta' }}</span></template>
        <template #acciones="{ fila }"><button type="button" class="btn btn-sm btn-claro" @click="abrirPub(fila)">Editar</button><button type="button" class="btn btn-sm btn-fantasma" @click="alternarPub(fila)">{{ fila.activo ? 'Ocultar' : 'Mostrar' }}</button></template>
      </Tabla>
    </EstadoDatos>
    <Modal v-if="editPub" :titulo="editPub.id ? 'Editar publicación' : 'Nueva publicación'" ancho @cerrar="editPub = null">
      <form id="form-pub" novalidate @submit.prevent="guardarPub">
        <p v-if="pubForm.errorGeneral.value" class="aviso-form error" role="alert">{{ pubForm.errorGeneral.value }}</p>
        <div class="rejilla-form">
          <Campo v-slot="{ id }" label="Sección del portal" requerido ayuda="Contenido educativo aparece en «Aprende»; las demás en «Institucional»."><select :id="id" v-model="pubForm.valores.tipo"><option v-for="(t, k) in TIPOS_PUBLICACION" :key="k" :value="k">{{ t }}</option></select></Campo>
          <Campo v-slot="{ id }" label="Fecha de publicación"><input :id="id" v-model="pubForm.valores.fechaPublicacion" type="date" /></Campo>
        </div>
        <Campo v-slot="{ id }" label="Título" :error="pubForm.errores.titulo" requerido><input :id="id" v-model="pubForm.valores.titulo" maxlength="150" /></Campo>
        <Campo v-slot="{ id }" label="Texto" :error="pubForm.errores.descripcion" requerido><textarea :id="id" v-model="pubForm.valores.descripcion" rows="6" maxlength="5000" /></Campo>
        <ImagenInput v-model="pubForm.valores.imagenUrl" label="Imagen (opcional)" />
        <Campo v-slot="{ id }" label="Enlace externo (opcional)" :error="pubForm.errores.enlace"><input :id="id" v-model="pubForm.valores.enlace" type="url" placeholder="https://…" /></Campo>
      </form>
      <template #pie><button type="button" class="btn btn-claro" @click="editPub = null">Cancelar</button><Boton tipo="submit" form="form-pub" :cargando="guardando">Guardar</Boton></template>
    </Modal>
  </template>

  <!-- HORARIOS -->
  <template v-if="pestana === 'horarios'">
    <EstadoDatos :cargando="horarios.cargando.value" :error="horarios.error.value" @reintentar="horarios.cargar()">
      <form class="panel" novalidate @submit.prevent="guardarHorarios">
        <p class="texto-suave">Define cuándo atiende el centro. Las citas solo se pueden programar dentro de estos horarios.</p>
        <p v-if="errHor" class="aviso-form error" role="alert">{{ errHor }}</p>
        <ul class="lista-simple">
          <li v-for="h in hor" :key="h.dia" style="flex-wrap:wrap">
            <label class="check" style="min-width:150px"><input v-model="h.activo" type="checkbox" /> {{ h.nombreDia }}</label>
            <template v-if="h.activo">
              <label>Abre <input v-model="h.horaInicio" type="time" class="input" style="width:auto" :aria-label="`${h.nombreDia}: hora de apertura`" /></label>
              <label>Cierra <input v-model="h.horaFin" type="time" class="input" style="width:auto" :aria-label="`${h.nombreDia}: hora de cierre`" /></label>
            </template>
            <span v-else class="texto-suave">Cerrado</span>
          </li>
        </ul>
        <Boton tipo="submit" :cargando="guardando">Guardar horarios</Boton>
      </form>
    </EstadoDatos>
  </template>
</template>
