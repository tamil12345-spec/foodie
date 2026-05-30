import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
//  Default admin credentials (seed these into your DB via your seed script)
//
//    Email   : admin@foodapp.com
//    Password : Admin@1234
//
//  Your backend seed / setup script should create this user with role "admin".
//  Example (Node/Mongoose):
//
//    await User.create({
//      name: 'Super Admin',
//      email: 'admin@foodapp.com',
//      password: await bcrypt.hash('Admin@1234', 10),
//      role: 'admin',
//    });
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_EMAIL_HINT    = 'admin@foodapp.com';
const ADMIN_PASSWORD_HINT = 'Admin@1234';

// ── Validation ───────────────────────────────────────────────────────────────

function validateLogin({ email, password }) {
  const errors = {};

  if (!email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
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

export default function AdminLogin() {
  const navigate  = useNavigate();
  const [form, setForm]           = useState({ email: '', password: '' });
  const [errors, setErrors]       = useState({});
  const [touched, setTouched]     = useState({});
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [attempts, setAttempts]   = useState(0);
  const MAX_ATTEMPTS = 5;

  // Live-validate a single field once it has been touched
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

    if (attempts >= MAX_ATTEMPTS) {
      toast.error('Too many failed attempts. Please wait a moment before trying again.');
      return;
    }

    // Mark all fields as touched and run full validation
    setTouched({ email: true, password: true });
    const errs = validateLogin(form);
    setErrors(errs);

    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const { token, user } = res.data;

      if (user?.role !== 'admin') {
        toast.error('Access denied. Admin accounts only.');
        setAttempts(a => a + 1);
        setLoading(false);
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/admin/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.';
      toast.error(msg);
      setAttempts(a => a + 1);
      // Surface a field-level error so users know what to fix
      setErrors(prev => ({ ...prev, password: 'Incorrect email or password.' }));
    }
    setLoading(false);
  };

  const attemptsLeft = MAX_ATTEMPTS - attempts;
  const locked       = attempts >= MAX_ATTEMPTS;

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

        {/* Credentials hint card (remove in production!) */}
        <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-700">
          <p className="font-bold mb-1">🔑 Default Admin Credentials</p>
          <p>Email: <span className="font-mono font-semibold">{ADMIN_EMAIL_HINT}</span></p>
          <p>Password: <span className="font-mono font-semibold">{ADMIN_PASSWORD_HINT}</span></p>
          <p className="mt-2 text-orange-500 italic">Remove this hint card before going to production.</p>
        </div>

        {/* Lock warning */}
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
                className={inputClass(errors.email)}
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                aria-invalid={!!errors.email}
                disabled={locked}
              />
              <FieldError msg={errors.email} />
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
                  className={`${inputClass(errors.password)} pr-10`}
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  aria-invalid={!!errors.password}
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
              <FieldError msg={errors.password} />
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
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Not an admin? <a href="/" className="text-orange-500 hover:underline">Go to main app</a>
        </p>
      </div>
    </div>
  );
}