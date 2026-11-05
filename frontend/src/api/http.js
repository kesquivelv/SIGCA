import axios from 'axios';

const TOKEN_KEY = 'sigca_token';

export const guardarToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* almacenamiento no disponible */ }
};
export const leerToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = leerToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normaliza los errores del backend ({ mensaje, detalles }) y los de red.
http.interceptors.response.use(
  (r) => r.data,
  (error) => {
    const res = error.response;
    const err = new Error();
    if (!res) {
      err.mensaje = error.code === 'ECONNABORTED'
        ? 'El servidor tardó demasiado en responder. Intente de nuevo.'
        : 'No se pudo conectar con el servidor. Revise su conexión o que el backend esté encendido.';
      err.red = true;
    } else {
      err.status = res.status;
      err.mensaje = res.data?.mensaje || 'Ocurrió un error inesperado';
      err.detalles = res.data?.detalles || [];
    }
    err.message = err.mensaje;
    // Sesión vencida: el store de sesión escucha este evento
    if (res?.status === 401 && leerToken()) window.dispatchEvent(new CustomEvent('sigca:sesion-vencida'));
    return Promise.reject(err);
  },
);

export default http;
