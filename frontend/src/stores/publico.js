import { defineStore } from 'pinia';
import { publicoApi } from '../api';

const POR_DEFECTO = {
  general: { nombreCentro: 'SIGCA', eslogan: 'Escuchar, comprender y crecer juntos', descripcion: '', carrusel: [], piePagina: '' },
  misionVision: { mision: '', vision: '', valores: [] },
  contacto: {},
};

/** Contenido editable del portal (nombre del centro, contacto, horarios), cargado una sola vez. */
export const usePublicoStore = defineStore('publico', {
  state: () => ({ contenido: POR_DEFECTO, horarios: [], cargado: false, error: '' }),
  getters: {
    general: (s) => ({ ...POR_DEFECTO.general, ...(s.contenido.general || {}) }),
    misionVision: (s) => ({ ...POR_DEFECTO.misionVision, ...(s.contenido.misionVision || {}) }),
    contacto: (s) => s.contenido.contacto || {},
  },
  actions: {
    async cargar(forzar = false) {
      if (this.cargado && !forzar) return;
      try {
        const [contenido, horarios] = await Promise.all([publicoApi.contenido(), publicoApi.horarios()]);
        this.contenido = contenido;
        this.horarios = horarios;
        this.cargado = true;
        this.error = '';
      } catch (e) {
        this.error = e.mensaje;
      }
    },
  },
});
