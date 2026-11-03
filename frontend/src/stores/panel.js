import { defineStore } from 'pinia';
import { dashboardApi } from '../api';

/** Contadores que se muestran en el menú del panel (solicitudes pendientes, mensajes sin leer). */
export const usePanelStore = defineStore('panel', {
  state: () => ({ solicitudes: 0, mensajes: 0, cajaAbierta: false }),
  actions: {
    async refrescar() {
      try {
        const r = await dashboardApi.resumen();
        this.solicitudes = r.solicitudesPendientes || 0;
        this.mensajes = r.mensajesSinLeer || 0;
        this.cajaAbierta = !!r.cajaAbierta;
      } catch { /* los contadores son opcionales */ }
    },
  },
});
