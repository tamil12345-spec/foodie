import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, ADMIN_CREDENTIALS } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ── Validation ────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLogin(form) {
  const errors = {};

  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!form.password) {
    errors.password = 'Password is required.';
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  return errors;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
      <span aria-hidden="true">⚠</span> {msg}
    </p>
  );
}

function inputClass(error) {
  return `input ${error ? 'border-red-400 focus:ring-red-400' : ''}`;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

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
    setTouched({ email: true, password: true });
    const errs = validateLogin(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await login(form.email.trim().toLowerCase(), form.password);
      toast.success('Welcome back! 👋');
      navigate('/');
    } catch (err) {
      if (err.validationErrors) {
        setErrors(err.validationErrors);
        setTouched({ email: true, password: true });
      } else if (err.apiError) {
        toast.error(err.apiError);
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍔</div>
          <h1 className="text-3xl font-extrabold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-2">Sign in to your FoodRush account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className={inputClass(touched.email && errors.email)}
                placeholder="you@example.com"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                aria-invalid={!!(touched.email && errors.email)}
                autoComplete="email"
              />
              <FieldError msg={touched.email && errors.email} />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className={`${inputClass(touched.password && errors.password)} pr-10`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  aria-invalid={!!(touched.password && errors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium select-none"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
              <FieldError msg={touched.password && errors.password} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base py-3 mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-orange-500 font-semibold hover:underline">
              Sign up
            </Link>
          </p>

          {/* Admin credentials — for demo/evaluation */}
          <div className="mt-5 p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm">
            <p className="font-bold text-orange-700 mb-2 flex items-center gap-1">
              <span>🔑</span> Demo Admin Credentials
            </p>
            <div className="space-y-1 text-gray-700">
              <p>Email:{' '}
                <span className="font-mono font-semibold text-gray-900">
                  {ADMIN_CREDENTIALS.email}
                </span>
              </p>
              <p>Password:{' '}
                <span className="font-mono font-semibold text-gray-900">
                  {ADMIN_CREDENTIALS.password}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setForm({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });
                setErrors({});
                setTouched({});
              }}
              className="mt-3 w-full text-xs font-semibold text-orange-600 border border-orange-300 rounded-lg py-1.5 hover:bg-orange-100 transition"
            >
              Fill admin credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}