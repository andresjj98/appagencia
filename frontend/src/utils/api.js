import axios from 'axios';

// Configuración base de axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
});

// Interceptor de peticiones: Agrega el token JWT automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas: Maneja errores de autenticación
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      const status = error.response.status;

      if (status === 401) {
        // Token inválido o expirado
        console.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('token');

        // Redirigir al login (puedes personalizar esto según tu app)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (status === 403) {
        // Acceso denegado (sin permisos)
        console.error('No tienes permisos para realizar esta acción.');
      }
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('No se pudo conectar con el servidor');
    } else {
      // Algo pasó al configurar la petición
      console.error('Error al realizar la petición:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
