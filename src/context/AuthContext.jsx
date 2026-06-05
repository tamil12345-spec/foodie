import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

// ─── Validation helpers ────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PW = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;

export const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!email.trim())                     errors.email    = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email    = 'Enter a valid email address';
  if (!password)                         errors.password = 'Password is required';
  else if (password.length < 8)          errors.password = 'Password must be at least 8 characters';
  return errors;
};

export const validateRegister = ({ name, email, password }) => {
  const errors = {};
  if (!name.trim())
    errors.name = 'Name is required';
  else if (name.trim().length < 2)
    errors.name = 'Name must be at least 2 characters';
  else if (/[^a-zA-Z\s\-']/.test(name))
    errors.name = 'Name contains invalid characters';

  if (!email.trim())                     errors.email    = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email    = 'Enter a valid email address';

  if (!password)
    errors.password = 'Password is required';
  else if (password.length < 8)
    errors.password = 'Password must be at least 8 characters';
  else if (!STRONG_PW.test(password))
    errors.password = 'Must include uppercase, lowercase, number & special character';

  return errors;
};

// ─── Admin seed credentials ────────────────────────────────────────────────────
export const ADMIN_CREDENTIALS = {
  email:    'admin@foodapp.com',
  password: 'Admin@1234',
  role:     'admin',
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null); // last API-level auth error

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setAuthError(null);

    // 1. Client-side validation — throws so the calling form can catch cleanly
    const errors = validateLogin({ email, password });
    if (Object.keys(errors).length > 0) {
      const err = Object.assign(new Error('Validation failed'), { validationErrors: errors });
      throw err;
    }

    // 2. API call
    try {
      const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.status === 401 ? 'Invalid email or password' : 'Login failed. Please try again.');
      setAuthError(message);
      throw Object.assign(new Error(message), { apiError: message });
    }
  }, []);

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    setAuthError(null);

    const errors = validateRegister({ name, email, password });
    if (Object.keys(errors).length > 0) {
      const err = Object.assign(new Error('Validation failed'), { validationErrors: errors });
      throw err;
    }

    try {
      const res = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.status === 409 ? 'An account with this email already exists' : 'Registration failed. Please try again.');
      setAuthError(message);
      throw Object.assign(new Error(message), { apiError: message });
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);