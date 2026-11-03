<script setup>
import { ref } from 'vue';
import { archivoAImagen } from '../../utils/imagen';

/** Imagen por URL o subiendo un archivo (se reduce y se guarda como texto). */
const modelo = defineModel({ type: String, default: '' });
defineProps({ label: { type: String, default: 'Imagen' } });
const error = ref('');

async function elegir(e) {
  const archivo = e.target.files?.[0];
  if (!archivo) return;
  error.value = '';
  try { modelo.value = await archivoAImagen(archivo); } catch (err) { error.value = err.message; }
  e.target.value = '';
}
</script>

<template>
  <div class="campo">
    <span class="etiqueta">{{ label }}</span>
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <div class="avatar grande" style="border-radius:12px">
        <img v-if="modelo" :src="modelo" alt="Vista previa" />
        <span v-else aria-hidden="true">📷</span>
      </div>
      <div style="flex:1;min-width:200px;display:grid;gap:8px">
        <input type="url" :value="modelo.startsWith('data:') ? '' : modelo" placeholder="Pegue una dirección https://…" :aria-label="`${label}: dirección web`" @input="modelo = $event.target.value" />
        <div class="acciones-fila">
          <label class="btn btn-sm btn-claro" style="cursor:pointer">
            Subir archivo
            <input type="file" accept="image/*" class="solo-lectores" @change="elegir" />
          </label>
          <button v-if="modelo" type="button" class="btn btn-sm btn-fantasma" @click="modelo = ''">Quitar</button>
        </div>
      </div>
    </div>
    <span v-if="error" class="error-campo" role="alert">{{ error }}</span>
  </div>
</template>
