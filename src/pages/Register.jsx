import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ── Validation ────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HAS_UPPER   = /[A-Z]/;
const HAS_LOWER   = /[a-z]/;
const HAS_DIGIT   = /[0-9]/;
const HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

function passwordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8)           score++;
  if (pwd.length >= 12)          score++;
  if (HAS_UPPER.test(pwd))       score++;
  if (HAS_DIGIT.test(pwd))       score++;
  if (HAS_SPECIAL.test(pwd))     score++;

  if (score <= 1) return { score, label: 'Weak',   color: 'bg-red-400' };
  if (score <= 3) return { score, label: 'Fair',   color: 'bg-yellow-400' };
  if (score === 4) return { score, label: 'Good',  color: 'bg-blue-400' };
  return              { score, label: 'Strong', color: 'bg-green-500' };
}

function validateRegister(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = 'Full name is required.';
  } else if (form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (form.name.trim().length > 60) {
    errors.name = 'Name must be under 60 characters.';
  } else if (!/^[a-zA-Z\s'-]+$/.test(form.name.trim())) {
    errors.name = 'Name can only contain letters, spaces, hyphens, or apostrophes.';
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!form.password) {
    errors.password = 'Password is required.';
  } else if (form.password.length < 8) {
    // ↑ bumped from 6 → 8 to match AuthContext.validateRegister
    errors.password = 'Password must be at least 8 characters.';
  } else if (form.password.length > 72) {
    errors.password = 'Password must be under 72 characters.';
  } else if (
    !HAS_UPPER.test(form.password) ||
    !HAS_LOWER.test(form.password) ||
    !HAS_DIGIT.test(form.password) ||
    !HAS_SPECIAL.test(form.password)
  ) {
    // ↑ added to match AuthContext's STRONG_PW rule
    errors.password = 'Must include uppercase, lowercase, number & special character.';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
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

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();

  const strength = passwordStrength(form.password);

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) {
      const errs = validateRegister(updated);
      setErrors(prev => ({ ...prev, [field]: errs[field] }));
    }
    // re-validate confirmPassword live when password changes
    if (field === 'password' && touched.confirmPassword) {
      const errs = validateRegister(updated);
      setErrors(prev => ({ ...prev, confirmPassword: errs.confirmPassword }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const errs = validateRegister(form);
    setErrors(prev => ({ ...prev, [field]: errs[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    const errs = validateRegister(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password);
      toast.success('Account created! Welcome 🎉');
      navigate('/');
    } catch (err) {
      // Surface field-level errors thrown by AuthContext.register
      if (err.validationErrors) {
        setErrors(err.validationErrors);
        setTouched({ name: true, email: true, password: true, confirmPassword: true });
      } else if (err.apiError) {
        toast.error(err.apiError); // e.g. "Email already exists"
      } else {
        toast.error('Registration failed. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍕</div>
          <h1 className="text-3xl font-extrabold text-gray-900">Create account</h1>
          <p className="text-gray-500 mt-2">Join FoodRush and start ordering</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={inputClass(touched.name && errors.name)}
                placeholder="John Doe"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                aria-invalid={!!(touched.name && errors.name)}
                autoComplete="name"
              />
              <FieldError msg={touched.name && errors.name} />
            </div>

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
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
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

              {/* Strength meter */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.score ? strength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    strength.score <= 1 ? 'text-red-500'    :
                    strength.score <= 3 ? 'text-yellow-600' :
                    strength.score === 4 ? 'text-blue-500'  : 'text-green-600'
                  }`}>
                    {strength.label} password
                    {strength.score < 4 && (
                      <span className="text-gray-400 font-normal ml-1">
                        — try adding uppercase, numbers or symbols
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={`${inputClass(touched.confirmPassword && errors.confirmPassword)} pr-10`}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={e => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  aria-invalid={!!(touched.confirmPassword && errors.confirmPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium select-none"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
              <FieldError msg={touched.confirmPassword && errors.confirmPassword} />

              {/* Match indicator */}
              {form.confirmPassword && !errors.confirmPassword && form.password === form.confirmPassword && (
                <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                  <span aria-hidden="true">✓</span> Passwords match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base py-3 mt-2"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-500 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}