import { createApp } from 'vue';
import { createPinia } from 'pinia';
import '@fontsource/bagel-fat-one/400.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/caveat/600.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';
import './styles/portal.css';
import './styles/admin.css';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// Restaura la sesión (si hay token guardado) antes de resolver la primera ruta
useAuthStore().restaurar().finally(() => {
  app.use(router);
  app.mount('#app');
});
