<script setup>
import { ref, computed } from 'vue';
import { cajaApi } from '../../api';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toast';
import { usePanelStore } from '../../stores/panel';
import { useCarga } from '../../utils/useCarga';
import { useFormulario, reglas } from '../../utils/validators';
import { fechaHora, Q, METODOS, nombreCompleto } from '../../utils/format';
import EstadoDatos from '../../components/ui/EstadoDatos.vue';
import Tabla from '../../components/ui/Tabla.vue';
import Modal from '../../components/ui/Modal.vue';
import Campo from '../../components/ui/Campo.vue';
import Boton from '../../components/ui/Boton.vue';

const auth = useAuthStore();
const toast = useToastStore();
const panel = usePanelStore();
const actual = useCarga(() => cajaApi.actual());
const historial = useCarga(() => cajaApi.listar({ estado: 'CERRADA' }), { inicial: [] });
const trabajando = ref(false);
const cierre = ref(false);
const detalle = ref(null);

const abrirForm = useFormulario({ montoInicial: '0.00' }, { montoInicial: [reglas.requerido('Indique el monto inicial'), reglas.monto({ min: 0 })] });
const cerrarForm = useFormulario({ efectivoContado: '', observaciones: '' }, {
  efectivoContado: [reglas.requerido('Escriba el efectivo contado'), reglas.monto({ min: 0 })],
  observaciones: [reglas.maximo(500)],
});
const caja = computed(() => actual.datos.value);
const diferencia = computed(() => (cerrarForm.valores.efectivoContado === '' || !caja.value ? null : Number(cerrarForm.valores.efectivoContado) - caja.value.efectivoEsperado));

async function abrir() {
  if (!abrirForm.validar()) return;
  trabajando.value = true;
  try {
    await cajaApi.abrir(Number(abrirForm.valores.montoInicial));
    toast.ok('Caja abierta. Ya puede registrar pagos.');
    await actual.cargar(); panel.refrescar();
  } catch (e) { abrirForm.aplicarErrorApi(e); } finally { trabajando.value = false; }
}
async function cerrar() {
  if (!cerrarForm.validar()) return;
  // TODO(tercer-integrante): validar aquí que las observaciones sean obligatorias si hay diferencia.
  // El backend ya lo exige (422), pero falta el aviso en el campo antes de enviar.
  trabajando.value = true;
  try {
    const c = await cajaApi.cerrar(Number(cerrarForm.valores.efectivoContado), cerrarForm.valores.observaciones);
    toast.ok('Caja cerrada.');
    cierre.value = false; cerrarForm.reiniciar(); detalle.value = c;
    await Promise.all([actual.cargar(), historial.cargar()]); panel.refrescar();
  } catch (e) { cerrarForm.aplicarErrorApi(e); } finally { trabajando.value = false; }
}
async function ver(c) {
  try { detalle.value = await cajaApi.obtener(c.id); } catch (e) { toast.error(e.mensaje); }
}

const colPagos = [{ key: 'comprobante', label: 'Comprobante' }, { key: 'hora', label: 'Hora' }, { key: 'paciente', label: 'Paciente' }, { key: 'metodo', label: 'Método' }, { key: 'monto', label: 'Monto', clase: 'num' }];
const colHist = [{ key: 'codigo', label: 'Caja' }, { key: 'fecha', label: 'Apertura' }, { key: 'usuario', label: 'Responsable' }, { key: 'ingresos', label: 'Ingresos', clase: 'num' }, { key: 'dif', label: 'Diferencia', clase: 'num' }];
</script>

<template>
  <div class="pag-cab"><div><h1>Caja diaria</h1><p>Abra su caja al empezar el día, registre los cobros y ciérrela al terminar. Los montos están en quetzales.</p></div></div>

  <EstadoDatos :cargando="actual.cargando.value" :error="actual.error.value" @reintentar="actual.cargar()">
    <section v-if="!caja" class="panel">
      <h2>No tiene una caja abierta</h2>
      <p>Para registrar pagos, primero abra su caja indicando el efectivo con el que empieza.</p>
      <form novalidate style="max-width:340px" @submit.prevent="abrir">
        <p v-if="abrirForm.errorGeneral.value" class="aviso-form error" role="alert">{{ abrirForm.errorGeneral.value }}</p>
        <Campo v-slot="{ id, describedby, invalido }" label="Monto inicial en efectivo (Q)" :error="abrirForm.errores.montoInicial" requerido>
          <input :id="id" v-model="abrirForm.valores.montoInicial" inputmode="decimal" :aria-describedby="describedby" :aria-invalid="invalido" @blur="abrirForm.tocar('montoInicial')" />
        </Campo>
        <Boton tipo="submit" class="btn-salvia" :cargando="trabajando">Abrir caja</Boton>
      </form>
    </section>

    <section v-else class="panel">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">
        <div><h2 style="margin:0">Caja {{ caja.codigo }} <span class="badge badge-salvia">Abierta</span></h2><span class="texto-suave">Abierta el {{ fechaHora(caja.fechaApertura) }}</span></div>
        <button type="button" class="btn btn-mostaza" @click="cierre = true">Cerrar caja</button>
      </div>
      <div class="totales" style="margin:16px 0">
        <div><span>Monto inicial</span><b>{{ Q(caja.montoInicial) }}</b></div>
        <div><span>Efectivo</span><b>{{ Q(caja.totalEfectivo) }}</b></div>
        <div><span>Transferencias</span><b>{{ Q(caja.totalTransferencia) }}</b></div>
        <div><span>Tarjeta</span><b>{{ Q(caja.totalTarjeta) }}</b></div>
        <div><span>Total de ingresos ({{ caja.cantidadPagos }} pagos)</span><b>{{ Q(caja.totalIngresos) }}</b></div>
        <div><span>Efectivo esperado en caja</span><b>{{ Q(caja.efectivoEsperado) }}</b></div>
      </div>
      <h3 style="font-size:1.05rem">Pagos de esta caja</h3>
      <EstadoDatos :vacio="!caja.pagos.length" texto-vacio="Todavía no hay pagos en esta caja." detalle-vacio="Registre cobros desde la sección Pagos.">
        <Tabla :columnas="colPagos" :filas="caja.pagos">
          <template #c-hora="{ fila }">{{ fechaHora(fila.fechaHora) }}</template>
          <template #c-paciente="{ fila }">{{ nombreCompleto(fila.paciente) }}</template>
          <template #c-metodo="{ fila }">{{ METODOS[fila.metodo] }}</template>
          <template #c-monto="{ fila }"><span :class="{ neg: fila.estado === 'ANULADO' }" :style="fila.estado === 'ANULADO' ? 'text-decoration:line-through' : ''">{{ Q(fila.monto) }}</span><span v-if="fila.estado === 'ANULADO'" class="badge badge-terracota" style="margin-left:6px">Anulado</span></template>
        </Tabla>
      </EstadoDatos>
    </section>
  </EstadoDatos>

  <section class="panel" style="margin-top:22px">
    <h2>{{ auth.esAdmin ? 'Cierres de caja (todos)' : 'Mis cierres anteriores' }}</h2>
    <EstadoDatos :cargando="historial.cargando.value" :error="historial.error.value" :vacio="!historial.datos.value.length" texto-vacio="Aún no hay cajas cerradas." @reintentar="historial.cargar()">
      <Tabla :columnas="colHist" :filas="historial.datos.value" con-acciones>
        <template #c-fecha="{ fila }">{{ fechaHora(fila.fechaApertura) }}</template>
        <template #c-usuario="{ fila }">{{ nombreCompleto(fila.usuario) }}</template>
        <template #c-ingresos="{ fila }">{{ Q(fila.totalIngresos) }}</template>
        <template #c-dif="{ fila }"><span :class="{ neg: fila.diferenciaCentavos !== 0 }">{{ Q(fila.diferencia) }}</span></template>
        <template #acciones="{ fila }"><button type="button" class="btn btn-sm btn-claro" @click="ver(fila)">Ver cierre</button></template>
      </Tabla>
    </EstadoDatos>
  </section>

  <Modal v-if="cierre" titulo="Cerrar caja" @cerrar="cierre = false">
    <p>Cuente el efectivo que hay en la caja. Debería haber <strong>{{ Q(caja.efectivoEsperado) }}</strong> (monto inicial más cobros en efectivo).</p>
    <form id="form-cierre" novalidate @submit.prevent="cerrar">
      <p v-if="cerrarForm.errorGeneral.value" class="aviso-form error" role="alert">{{ cerrarForm.errorGeneral.value }}</p>
      <Campo v-slot="{ id, describedby, invalido }" label="Efectivo contado (Q)" :error="cerrarForm.errores.efectivoContado" requerido>
        <input :id="id" v-model="cerrarForm.valores.efectivoContado" inputmode="decimal" :aria-describedby="describedby" :aria-invalid="invalido" @blur="cerrarForm.tocar('efectivoContado')" />
      </Campo>
      <p v-if="diferencia !== null" class="aviso-form" :class="Math.abs(diferencia) > 0.004 ? 'error' : 'info'" role="status">
        {{ Math.abs(diferencia) <= 0.004 ? 'La caja cuadra.' : diferencia < 0 ? `Faltan ${Q(-diferencia)}.` : `Sobran ${Q(diferencia)}.` }}
      </p>
      <Campo v-slot="{ id }" label="Observaciones" :error="cerrarForm.errores.observaciones" ayuda="Obligatorias si hay diferencia.">
        <textarea :id="id" v-model="cerrarForm.valores.observaciones" rows="3" maxlength="500" />
      </Campo>
    </form>
    <template #pie><button type="button" class="btn btn-claro" @click="cierre = false">Volver</button><Boton tipo="submit" form="form-cierre" class="btn-mostaza" :cargando="trabajando">Cerrar caja</Boton></template>
  </Modal>

  <Modal v-if="detalle" :titulo="`Caja ${detalle.codigo}`" ancho @cerrar="detalle = null">
    <p class="texto-suave">{{ nombreCompleto(detalle.usuario) }} · {{ fechaHora(detalle.fechaApertura) }} a {{ fechaHora(detalle.fechaCierre) }}</p>
    <div class="totales" style="margin-bottom:14px">
      <div><span>Monto inicial</span><b>{{ Q(detalle.montoInicial) }}</b></div>
      <div><span>Efectivo</span><b>{{ Q(detalle.totalEfectivo) }}</b></div>
      <div><span>Transferencias</span><b>{{ Q(detalle.totalTransferencia) }}</b></div>
      <div><span>Tarjeta</span><b>{{ Q(detalle.totalTarjeta) }}</b></div>
      <div><span>Total ingresos</span><b>{{ Q(detalle.totalIngresos) }}</b></div>
      <div><span>Efectivo esperado</span><b>{{ Q(detalle.efectivoEsperado) }}</b></div>
      <div><span>Efectivo contado</span><b>{{ Q(detalle.efectivoContado) }}</b></div>
      <div :class="{ 'dif-mal': detalle.diferenciaCentavos !== 0 }"><span>Diferencia</span><b>{{ Q(detalle.diferencia) }}</b></div>
    </div>
    <p v-if="detalle.observacionesCierre"><strong>Observaciones:</strong> {{ detalle.observacionesCierre }}</p>
    <Tabla :columnas="colPagos" :filas="detalle.pagos">
      <template #c-hora="{ fila }">{{ fechaHora(fila.fechaHora) }}</template>
      <template #c-paciente="{ fila }">{{ nombreCompleto(fila.paciente) }}</template>
      <template #c-metodo="{ fila }">{{ METODOS[fila.metodo] }}</template>
      <template #c-monto="{ fila }"><span :class="{ neg: fila.estado === 'ANULADO' }" :style="fila.estado === 'ANULADO' ? 'text-decoration:line-through' : ''">{{ Q(fila.monto) }}</span></template>
    </Tabla>
  </Modal>
</template>
