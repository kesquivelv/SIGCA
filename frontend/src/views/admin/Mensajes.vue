<script setup>
import { ref, watch } from 'vue';
import { contenidoApi } from '../../api';
import { usePanelStore } from '../../stores/panel';
import { useToastStore } from '../../stores/toast';
import { useCarga } from '../../utils/useCarga';
import { fechaHora } from '../../utils/format';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';

const panel = usePanelStore();
const toast = useToastStore();
const leido = ref('false');
const abierto = ref('');
const { datos, cargando, error, cargar } = useCarga(() => contenidoApi.mensajes({ leido: leido.value }), { inicial: [] });
watch(leido, () => cargar());

async function marcar(m, valor) {
  try { await contenidoApi.marcarMensaje(m.id, valor); toast.ok(valor ? 'Marcado como leído.' : 'Marcado como no leído.'); await cargar(); panel.refrescar(); }
  catch (e) { toast.error(e.mensaje); }
}
function alternar(m) { abierto.value = abierto.value === m.id ? '' : m.id; }
</script>

<template>
  <div class="pag-cab"><div><h1>Mensajes de contacto</h1><p>Mensajes enviados desde el formulario del portal.</p></div></div>
  <div class="pestanas" role="tablist">
    <button type="button" role="tab" :aria-selected="leido === 'false'" @click="leido = 'false'">Sin leer</button>
    <button type="button" role="tab" :aria-selected="leido === 'true'" @click="leido = 'true'">Leídos</button>
    <button type="button" role="tab" :aria-selected="leido === ''" @click="leido = ''">Todos</button>
  </div>
  <EstadoDatos :cargando="cargando" :error="error" :vacio="!datos.length" texto-vacio="No hay mensajes aquí." @reintentar="cargar()">
    <ul class="lista-simple panel" style="padding:6px 18px">
      <li v-for="m in datos" :key="m.id" style="align-items:flex-start">
        <span class="crece">
          <button type="button" class="btn-enlace" :aria-expanded="abierto === m.id" style="background:none;border:0;padding:0;cursor:pointer;text-align:left;font-weight:800" @click="alternar(m)">
            {{ m.asunto }} <span v-if="!m.leido" class="badge badge-mostaza">Nuevo</span>
          </button><br />
          <span class="texto-suave">{{ m.nombre }} · {{ fechaHora(m.createdAt) }}</span>
          <div v-if="abierto === m.id" style="margin-top:8px">
            <p style="white-space:pre-line">{{ m.mensaje }}</p>
            <p class="texto-suave">Responder a <a :href="`mailto:${m.correo}?subject=Re: ${encodeURIComponent(m.asunto)}`">{{ m.correo }}</a> · {{ m.telefono }}</p>
          </div>
        </span>
        <button type="button" class="btn btn-sm btn-claro" @click="marcar(m, !m.leido)">{{ m.leido ? 'Marcar como no leído' : 'Marcar como leído' }}</button>
      </li>
    </ul>
  </EstadoDatos>
</template>
