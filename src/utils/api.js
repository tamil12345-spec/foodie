import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://food-back-0l68.onrender.com/api',
  timeout: 10000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (!err.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    if (err.response.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export default api;