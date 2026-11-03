import { defineStore } from 'pinia';

let contador = 0;

/** Mensajes breves de éxito, error o aviso. */
export const useToastStore = defineStore('toast', {
  state: () => ({ items: [] }),
  actions: {
    mostrar(texto, tipo = 'ok', ms = 4500) {
      const id = ++contador;
      this.items.push({ id, texto, tipo });
      if (ms) setTimeout(() => this.quitar(id), ms);
    },
    ok(texto) { this.mostrar(texto, 'ok'); },
    error(texto) { this.mostrar(texto, 'error', 7000); },
    aviso(texto) { this.mostrar(texto, 'aviso'); },
    quitar(id) { this.items = this.items.filter((t) => t.id !== id); },
  },
});
