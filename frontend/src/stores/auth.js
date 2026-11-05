import { defineStore } from 'pinia';
import { authApi } from '../api';
import { guardarToken, leerToken } from '../api/http';

/** Permisos de pantalla por rol (el backend los vuelve a verificar en cada petición). */
export const PERMISOS = {
  ADMINISTRADOR: ['dashboard', 'usuarios', 'profesionales', 'pacientes', 'responsables', 'servicios', 'citas', 'solicitudes', 'calendario', 'materiales', 'pagos', 'caja', 'contenido', 'mensajes'],
  RECEPCIONISTA: ['dashboard', 'profesionales', 'pacientes', 'responsables', 'citas', 'solicitudes', 'calendario', 'materiales', 'pagos', 'caja', 'mensajes'],
  PROFESIONAL: ['dashboard', 'pacientes', 'citas', 'calendario', 'materiales'],
};

export const useAuthStore = defineStore('auth', {
    state: () => ({ usuario: null, token: leerToken(), listo: false }),
  getters: {
    autenticado: (s) => !!s.usuario,
    rol: (s) => s.usuario?.rol,
    esAdmin: (s) => s.usuario?.rol === 'ADMINISTRADOR',
    esRecep: (s) => s.usuario?.rol === 'RECEPCIONISTA',
    esProfesional: (s) => s.usuario?.rol === 'PROFESIONAL',
    /** ¿Puede ver la pantalla `modulo`? */
    puede: (s) => (modulo) => !!s.usuario && (PERMISOS[s.usuario.rol] || []).includes(modulo),
    /** Roles con acceso a datos de pacientes/pagos (no profesional) */
    esPersonalAdministrativo: (s) => ['ADMINISTRADOR', 'RECEPCIONISTA'].includes(s.usuario?.rol),
  },
  actions: {
    async login(correo, password) {
      const { token, usuario } = await authApi.login(correo, password);
      this.token = token;
      this.usuario = usuario;
      guardarToken(token);
    },
    async restaurar() {
      if (this.token) {
        try { this.usuario = await authApi.perfil(); } catch { this.cerrar(); }
      }
      this.listo = true;
    },
    cerrar() {
      this.usuario = null;
      this.token = null;
      guardarToken(null);
    },
  },
});
