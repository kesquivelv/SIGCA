<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useFormulario, reglas } from '../../utils/validators';
import Campo from '../../components/ui/Campo.vue';
import Boton from '../../components/ui/Boton.vue';
import Logo from '../../components/art/Logo.vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const { valores, errores, errorGeneral, validar, tocar, aplicarErrorApi } = useFormulario(
  { correo: '', password: '' },
  { correo: [reglas.requerido('Escriba su correo'), reglas.correo()], password: [reglas.requerido('Escriba su contraseña')] },
);
const cargando = ref(false);
const ver = ref(false);

async function entrar() {
  if (!validar()) return;
  cargando.value = true;
  try {
    await auth.login(valores.correo, valores.password);
    router.push(route.query.volver && String(route.query.volver).startsWith('/admin') ? String(route.query.volver) : { name: 'dashboard' });
  } catch (e) {
    aplicarErrorApi(e);
  } finally {
    cargando.value = false;
  }
}

const demo = [
  ['Administrador', 'admin@sigca.com', 'Admin123!'],
  ['Recepcionista', 'recepcion1@sigca.com', 'Recep123!'],
  ['Profesional', 'psicologa@sigca.com', 'Prof123!'],
];
const usar = ([, c, p]) => { valores.correo = c; valores.password = p; };
</script>

<template>
  <div class="login-pag">
    <div class="login-caja">
      <p class="centrado"><router-link to="/" class="p-logo" style="justify-content:center"><Logo /> <span>SIGCA</span></router-link></p>
      <div class="tarjeta">
        <h1 style="font-family:var(--f-titulo);font-weight:400;font-size:1.8rem">Ingreso del personal</h1>
        <form novalidate @submit.prevent="entrar">
          <p v-if="errorGeneral" class="aviso-form error" role="alert">{{ errorGeneral }}</p>
          <Campo v-slot="{ id, describedby, invalido }" label="Correo" :error="errores.correo" requerido>
            <input :id="id" v-model="valores.correo" type="email" autocomplete="username" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('correo')" />
          </Campo>
          <Campo v-slot="{ id, describedby, invalido }" label="Contraseña" :error="errores.password" requerido>
            <input :id="id" v-model="valores.password" :type="ver ? 'text' : 'password'" autocomplete="current-password" :aria-describedby="describedby" :aria-invalid="invalido" @blur="tocar('password')" />
          </Campo>
          <label class="check" style="margin-bottom:14px"><input v-model="ver" type="checkbox" /> Mostrar contraseña</label>
          <Boton tipo="submit" :cargando="cargando" style="width:100%">Ingresar</Boton>
        </form>
        <details class="login-demo">
          <summary>Cuentas de demostración</summary>
          <table>
            <tr v-for="d in demo" :key="d[1]"><td>{{ d[0] }}</td><td><button type="button" @click="usar(d)">{{ d[1] }}</button></td></tr>
          </table>
          <p class="texto-suave">Se cargan con <code>npm run seed</code> en el backend. Son datos ficticios.</p>
        </details>
      </div>
    </div>
  </div>
</template>
