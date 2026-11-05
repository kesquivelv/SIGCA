import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

// En desarrollo, Vite reenvía /api al backend (por defecto http://localhost:4000),
// así no hay problemas de CORS. Cambie el destino con VITE_PROXY_TARGET.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: env.VITE_PROXY_TARGET || 'http://localhost:4000', changeOrigin: true },
      },
    },
  };
});
