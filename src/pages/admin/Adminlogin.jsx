import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ADMIN_CREDENTIALS } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ── Validation ────────────────────────────────────────────────────────────────
// Min-length 8 to match AuthContext.validateLogin (was 6)
function validateLogin({ email, password }) {
  const errors = {};

  if (!email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  return errors;
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
      <span aria-hidden="true">⚠</span> {msg}
    </p>
  );
}

function inputClass(hasError) {
  return `input ${hasError ? 'border-red-400 focus:ring-red-400' : ''}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;

export default function AdminLogin() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const locked       = attempts >= MAX_ATTEMPTS;
  const attemptsLeft = MAX_ATTEMPTS - attempts;

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) {
      const errs = validateLogin(updated);
      setErrors(prev => ({ ...prev, [field]: errs[field] }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const errs = validateLogin(form);
    setErrors(prev => ({ ...prev, [field]: errs[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;

    setTouched({ email: true, password: true });
    const errs = validateLogin(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const data = await login(form.email.trim().toLowerCase(), form.password);

      if (data.user?.role !== 'admin') {
        toast.error('Access denied. Admin accounts only.');
        setAttempts(a => a + 1);
        setLoading(false);
        return;
      }

      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/admin/dashboard');

    } catch (err) {
      setAttempts(a => a + 1);

      // Route field-level errors from AuthContext to inline fields
      if (err.validationErrors) {
        setErrors(err.validationErrors);
        setTouched({ email: true, password: true });
      } else {
        // Use normalised err.message from api.js interceptor
        const msg = err.apiError || err.message || 'Invalid credentials. Please try again.';
        toast.error(msg);
        setErrors(prev => ({ ...prev, password: 'Incorrect email or password.' }));
      }
    }

    setLoading(false);
  };

  // One-click fill from the single source of truth in AuthContext
  const fillAdminCredentials = () => {
    setForm({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });
    setErrors({});
    setTouched({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 text-white text-3xl mb-4 shadow-lg">
            🍽️
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Admin Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to manage your food delivery platform</p>
        </div>

        {/* Lockout warning */}
        {locked && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
            ⛔ Account temporarily locked after {MAX_ATTEMPTS} failed attempts. Please refresh the page to try again.
          </div>
        )}

        {/* Form card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                autoComplete="username"
                placeholder="admin@foodapp.com"
                className={inputClass(touched.email && errors.email)}
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                aria-invalid={!!(touched.email && errors.email)}
                disabled={locked}
              />
              <FieldError msg={touched.email && errors.email} />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`${inputClass(touched.password && errors.password)} pr-10`}
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  aria-invalid={!!(touched.password && errors.password)}
                  disabled={locked}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              <FieldError msg={touched.password && errors.password} />
            </div>

            {/* Attempt counter */}
            {attempts > 0 && !locked && (
              <p className="text-xs text-amber-600">
                ⚠ {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining before lockout.
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || locked}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials — sourced from ADMIN_CREDENTIALS, no hardcoded strings */}
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm">
            <p className="font-bold text-orange-700 mb-2 flex items-center gap-1">
              🔑 Demo Admin Credentials
            </p>
            <div className="space-y-1 text-gray-700">
              <p>Email:{' '}
                <span className="font-mono font-semibold text-gray-900">{ADMIN_CREDENTIALS.email}</span>
              </p>
              <p>Password:{' '}
                <span className="font-mono font-semibold text-gray-900">{ADMIN_CREDENTIALS.password}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={fillAdminCredentials}
              disabled={locked}
              className="mt-3 w-full text-xs font-semibold text-orange-600 border border-orange-300 rounded-lg py-1.5 hover:bg-orange-100 transition disabled:opacity-50"
            >
              Fill admin credentials
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Not an admin?{' '}
          <a href="/" className="text-orange-500 hover:underline">Go to main app</a>
        </p>
      </div>
    </div>
  );
}