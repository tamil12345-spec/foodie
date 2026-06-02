import axios from 'axios';

const PUBLIC_ROUTES = ['/auth/login', '/auth/register'];

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://food-back-0l68.onrender.com/api',
  timeout: 60000,
});

// Request interceptor — skip token for public routes
api.interceptors.request.use(config => {
  const isPublic = PUBLIC_ROUTES.some(route => config.url?.includes(route));
  if (!isPublic) {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — retry once on network error (cold start)
api.interceptors.response.use(
  res => res,
  async err => {
    const config = err.config;
    const isPublic = PUBLIC_ROUTES.some(route => config.url?.includes(route));

    // Cold-start retry — network errors only, not 4xx
    if (!err.response && !config._retried) {
      config._retried = true;
      console.warn('Network error — retrying after cold start delay...');
      await new Promise(res => setTimeout(res, 15000));
      return api(config);
    }

    if (!err.response) {
      return Promise.reject(
        new Error('Server is waking up. Please wait a moment and try again.')
      );
    }

    // Only redirect on 401 for protected routes, never for login/register
    if (err.response.status === 401 && !isPublic) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(err); // always propagate so UI can handle it
  }
);

export default api;