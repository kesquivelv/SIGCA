import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';
import PublicLayout from '../layouts/PublicLayout.vue';
import AdminLayout from '../layouts/AdminLayout.vue';

// Las vistas se cargan bajo demanda para que el portal público pese poco.
const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'inicio', component: () => import('../views/public/Inicio.vue'), meta: { titulo: 'Inicio' } },
      { path: 'nosotros', name: 'nosotros', component: () => import('../views/public/Nosotros.vue'), meta: { titulo: 'Misión y visión' } },
      { path: 'servicios', name: 'servicios', component: () => import('../views/public/Servicios.vue'), meta: { titulo: 'Servicios' } },
      { path: 'educativo', name: 'educativo', component: () => import('../views/public/Educativo.vue'), meta: { titulo: 'Contenido educativo' } },
      { path: 'institucional', name: 'institucional', component: () => import('../views/public/Institucional.vue'), meta: { titulo: 'Información institucional' } },
      { path: 'contacto', name: 'contacto', component: () => import('../views/public/Contacto.vue'), meta: { titulo: 'Horarios y contacto' } },
      { path: 'solicitar-cita', name: 'solicitar-cita', component: () => import('../views/public/SolicitarCita.vue'), meta: { titulo: 'Solicitar cita' } },
    ],
  },
  { path: '/admin/login', name: 'login', component: () => import('../views/admin/Login.vue'), meta: { titulo: 'Ingresar', soloVisitante: true } },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiereSesion: true },
    children: [
      { path: '', redirect: { name: 'dashboard' } },
      { path: 'inicio', name: 'dashboard', component: () => import('../views/admin/Dashboard.vue'), meta: { titulo: 'Inicio', modulo: 'dashboard' } },
      { path: 'calendario', name: 'calendario', component: () => import('../views/admin/Calendario.vue'), meta: { titulo: 'Calendario', modulo: 'calendario' } },
      { path: 'citas', name: 'citas', component: () => import('../views/admin/Citas.vue'), meta: { titulo: 'Citas', modulo: 'citas' } },
      { path: 'solicitudes', name: 'solicitudes', component: () => import('../views/admin/Solicitudes.vue'), meta: { titulo: 'Solicitudes de cita', modulo: 'solicitudes' } },
      { path: 'pacientes', name: 'pacientes', component: () => import('../views/admin/Pacientes.vue'), meta: { titulo: 'Pacientes', modulo: 'pacientes' } },
      { path: 'pacientes/:id', name: 'paciente', component: () => import('../views/admin/PacienteDetalle.vue'), meta: { titulo: 'Ficha del paciente', modulo: 'pacientes' } },
      { path: 'responsables', name: 'responsables', component: () => import('../views/admin/Responsables.vue'), meta: { titulo: 'Responsables', modulo: 'responsables' } },
      { path: 'profesionales', name: 'profesionales', component: () => import('../views/admin/Profesionales.vue'), meta: { titulo: 'Profesionales', modulo: 'profesionales' } },
      { path: 'servicios', name: 'admin-servicios', component: () => import('../views/admin/ServiciosAdmin.vue'), meta: { titulo: 'Servicios', modulo: 'servicios' } },
      { path: 'materiales', name: 'materiales', component: () => import('../views/admin/Materiales.vue'), meta: { titulo: 'Materiales', modulo: 'materiales' } },
      { path: 'pagos', name: 'pagos', component: () => import('../views/admin/Pagos.vue'), meta: { titulo: 'Pagos', modulo: 'pagos' } },
      { path: 'caja', name: 'caja', component: () => import('../views/admin/Caja.vue'), meta: { titulo: 'Caja diaria', modulo: 'caja' } },
      { path: 'usuarios', name: 'usuarios', component: () => import('../views/admin/Usuarios.vue'), meta: { titulo: 'Usuarios y roles', modulo: 'usuarios' } },
      { path: 'contenido', name: 'contenido', component: () => import('../views/admin/Contenido.vue'), meta: { titulo: 'Contenido del portal', modulo: 'contenido' } },
      { path: 'mensajes', name: 'mensajes', component: () => import('../views/admin/Mensajes.vue'), meta: { titulo: 'Mensajes de contacto', modulo: 'mensajes' } },
    ],
  },
  { path: '/:rutaNoEncontrada(.*)*', name: 'no-encontrada', component: () => import('../views/public/NoEncontrada.vue'), meta: { titulo: 'Página no encontrada' } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => saved || (to.hash ? { el: to.hash } : { top: 0 }),
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.matched.some((r) => r.meta.requiereSesion) && !auth.autenticado) {
    return { name: 'login', query: { volver: to.fullPath } };
  }
  if (to.meta.soloVisitante && auth.autenticado) return { name: 'dashboard' };
  if (to.meta.modulo && !auth.puede(to.meta.modulo)) {
    useToastStore().error('No tiene permisos para entrar a esa sección.');
    return { name: 'dashboard' };
  }
  return true;
});

router.afterEach((to) => {
  document.title = to.meta.titulo ? `${to.meta.titulo} · SIGCA` : 'SIGCA · Atención psicológica y estimulación auditiva';
});

// Si el backend responde 401 (sesión vencida), se cierra la sesión y se vuelve al ingreso
window.addEventListener('sigca:sesion-vencida', () => {
  const auth = useAuthStore();
  if (!auth.autenticado) return;
  auth.cerrar();
  useToastStore().aviso('Su sesión venció. Inicie sesión nuevamente.');
  router.push({ name: 'login', query: { volver: router.currentRoute.value.fullPath } });
});

export default router;
