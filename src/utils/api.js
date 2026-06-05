import axios from 'axios';

const PUBLIC_ROUTES = ['/auth/login', '/auth/register'];

// ── Cold-start constants ──────────────────────────────────────────────────────
const COLD_START_DELAY_MS = 15_000;
const COLD_START_TIMEOUT  = 90_000; // extended timeout for retry

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://food-back-0l68.onrender.com/api',
  timeout: 60_000,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const isPublicRoute  = (url) => PUBLIC_ROUTES.some(route => url?.includes(route));
const delay          = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ── Request interceptor — attach Bearer token for protected routes ────────────
api.interceptors.request.use(
  config => {
    if (!isPublicRoute(config.url)) {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  err => Promise.reject(err)
);

// ── Response interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  res => res,
  async err => {
    const config    = err.config;
    const isPublic  = isPublicRoute(config?.url);
    const status    = err.response?.status;

    // ── 1. Cold-start retry — network errors only, once, non-public routes ──
    if (!err.response && !config?._retried) {
      config._retried = true;
      config.timeout  = COLD_START_TIMEOUT; // give the waking server more time
      console.warn('[api] Network error — retrying after cold-start delay…');
      await delay(COLD_START_DELAY_MS);
      return api(config);
    }

    // ── 2. No response after retry ──────────────────────────────────────────
    if (!err.response) {
      return Promise.reject(
        Object.assign(new Error('Server is waking up. Please wait a moment and try again.'), {
          isNetworkError: true,
        })
      );
    }

    // ── 3. 401 on protected route → clear session and redirect ──────────────
    if (status === 401 && !isPublic) {
      localStorage.removeItem('token');
      // Use replace so the login page isn't added to browser history
      window.location.replace('/login');
      // Return a pending promise so no downstream .catch fires during redirect
      return new Promise(() => {});
    }

    // ── 4. Normalise error shape for UI consumers ────────────────────────────
    //    Attach a human-readable `message` so callers can do err.message
    //    without digging into err.response.data.message every time.
    const serverMessage = err.response?.data?.message;
    if (serverMessage && !err.message) {
      err.message = serverMessage;
    }

    // ── 5. 5xx — tag as server error so UI can show a generic banner ─────────
    if (status >= 500) {
      err.isServerError = true;
    }

    return Promise.reject(err);
  }
);

export default api;