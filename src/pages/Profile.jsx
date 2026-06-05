import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ─── Validation rules ──────────────────────────────────────────────────────────
const validate = (form) => {
  const errors = {};

  if (!form.name.trim())
    errors.name = 'Name is required';
  else if (form.name.trim().length < 2)
    errors.name = 'Name must be at least 2 characters';
  else if (/[^a-zA-Z\s\-']/.test(form.name))
    errors.name = 'Name contains invalid characters';

  if (!form.phone.trim())
    errors.phone = 'Phone number is required';
  else if (!/^[\+]?[\d\s\-\(\)]{7,15}$/.test(form.phone.trim()))
    errors.phone = 'Enter a valid phone (e.g. +1 234 567 8900)';

  if (form.street.trim() && form.street.trim().length < 5)
    errors.street = 'Enter a valid street address';

  if (form.city.trim() && form.city.trim().length < 2)
    errors.city = 'Enter a valid city name';

  if (form.state.trim() && !/^[a-zA-Z]{2,3}$/.test(form.state.trim()))
    errors.state = 'Use a 2–3 letter state code (e.g. CA)';

  if (form.zip.trim() && !/^\d{4,10}$/.test(form.zip.trim()))
    errors.zip = 'ZIP must be 4–10 digits';

  return errors;
};

// ─── Reusable error message ────────────────────────────────────────────────────
const FieldError = ({ msg }) =>
  msg ? <p className="mt-1 text-xs text-red-500 font-medium">⚠ {msg}</p> : null;

// ─── Component ────────────────────────────────────────────────────────────────
export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name:   user?.name || '',
    phone:  user?.phone || '',
    street: user?.address?.street || '',
    city:   user?.address?.city || '',
    state:  user?.address?.state || '',
    zip:    user?.address?.zip || '',
  });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  // Mark field as touched on blur → trigger inline error
  const handleBlur = (field) =>
    setTouched((t) => ({ ...t, [field]: true }));

  // Update value and re-validate touched fields live
  const handleChange = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) setErrors(validate(next));
  };

  const inputClass = (field) =>
    `input ${touched[field] && errors[field] ? 'border-red-400 focus:ring-red-300' : ''}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Touch all fields so every error surfaces
    setTouched({ name:1, phone:1, street:1, city:1, state:1, zip:1 });
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await api.put('/auth/profile', {
        name: form.name,
        phone: form.phone,
        address: { street: form.street, city: form.city, state: form.state, zip: form.zip },
      });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Profile</h1>
      <div className="card p-8">

        {/* ── Avatar / meta ── */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-orange-500">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              user?.role === 'admin'
                ? 'bg-purple-100 text-purple-600'
                : 'bg-orange-100 text-orange-600'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass('name')}
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
              />
              <FieldError msg={touched.name && errors.name} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass('phone')}
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder="+1 234 567 8900"
              />
              <FieldError msg={touched.phone && errors.phone} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Street Address</label>
            <input
              className={inputClass('street')}
              value={form.street}
              onChange={e => handleChange('street', e.target.value)}
              onBlur={() => handleBlur('street')}
              placeholder="123 Main St"
            />
            <FieldError msg={touched.street && errors.street} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
              <input
                className={inputClass('city')}
                value={form.city}
                onChange={e => handleChange('city', e.target.value)}
                onBlur={() => handleBlur('city')}
              />
              <FieldError msg={touched.city && errors.city} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
              <input
                className={inputClass('state')}
                value={form.state}
                onChange={e => handleChange('state', e.target.value)}
                onBlur={() => handleBlur('state')}
                placeholder="CA"
              />
              <FieldError msg={touched.state && errors.state} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">ZIP</label>
              <input
                className={inputClass('zip')}
                value={form.zip}
                onChange={e => handleChange('zip', e.target.value)}
                onBlur={() => handleBlur('zip')}
                placeholder="12345"
              />
              <FieldError msg={touched.zip && errors.zip} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}