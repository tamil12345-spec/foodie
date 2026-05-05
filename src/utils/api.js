import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://food-back-0l68.onrender.com/api',
  timeout: 60000,
});

// Request interceptor — attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — retry once on network error (cold start)
api.interceptors.response.use(
  res => res,
  async err => {
    const config = err.config;

    // Retry once if it's a network error and hasn't been retried yet
    if (!err.response && !config._retried) {
      config._retried = true;
      console.warn('Network error — retrying after cold start...');
      await new Promise(res => setTimeout(res, 3000)); // wait 3s then retry
      return api(config);
    }

    if (!err.response) {
      return Promise.reject(new Error('Server is unavailable. Please try again in a moment.'));
    }

    if (err.response.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export default api;