import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const emptyRestaurant = {
  name: '', description: '', image: '', cuisine: '', address: '',
  rating: 4.0, deliveryTime: '30-45 min', deliveryFee: 2.99, minOrder: 10,
};

const emptyMenuItem = {
  name: '', description: '', price: '', category: '', image: '',
};

// ── Validation helpers ──────────────────────────────────────────────────────

const URL_RE = /^(https?:\/\/).+\..+/i;
const DELIVERY_TIME_RE = /^\d{1,3}-\d{1,3}\s*(min|mins|minutes)?$/i;

function validateRestaurant(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = 'Restaurant name is required.';
  } else if (form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (form.name.trim().length > 100) {
    errors.name = 'Name must be under 100 characters.';
  }

  if (!form.address.trim()) {
    errors.address = 'Address is required.';
  } else if (form.address.trim().length < 5) {
    errors.address = 'Please enter a valid address.';
  }

  if (form.description && form.description.length > 500) {
    errors.description = 'Description must be under 500 characters.';
  }

  if (form.image && !URL_RE.test(form.image)) {
    errors.image = 'Please enter a valid URL starting with http:// or https://';
  }

  if (!form.cuisine.trim()) {
    errors.cuisine = 'At least one cuisine type is required.';
  }

  const rating = parseFloat(form.rating);
  if (isNaN(rating) || rating < 0 || rating > 5) {
    errors.rating = 'Rating must be between 0 and 5.';
  }

  if (!DELIVERY_TIME_RE.test(form.deliveryTime.trim())) {
    errors.deliveryTime = 'Use format like "30-45 min".';
  }

  const fee = parseFloat(form.deliveryFee);
  if (isNaN(fee) || fee < 0) {
    errors.deliveryFee = 'Delivery fee must be 0 or more.';
  } else if (fee > 50) {
    errors.deliveryFee = 'Delivery fee seems too high (max $50).';
  }

  const min = parseFloat(form.minOrder);
  if (isNaN(min) || min < 0) {
    errors.minOrder = 'Minimum order must be 0 or more.';
  } else if (min > 500) {
    errors.minOrder = 'Minimum order seems too high (max $500).';
  }

  return errors;
}

function validateMenuItem(menuForm) {
  const errors = {};

  if (!menuForm.name.trim()) {
    errors.name = 'Item name is required.';
  } else if (menuForm.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (menuForm.name.trim().length > 100) {
    errors.name = 'Name must be under 100 characters.';
  }

  const price = parseFloat(menuForm.price);
  if (!menuForm.price) {
    errors.price = 'Price is required.';
  } else if (isNaN(price) || price <= 0) {
    errors.price = 'Price must be a positive number.';
  } else if (price > 999) {
    errors.price = 'Price seems too high (max $999).';
  }

  if (!menuForm.category.trim()) {
    errors.category = 'Category is required.';
  } else if (menuForm.category.trim().length < 2) {
    errors.category = 'Category must be at least 2 characters.';
  }

  if (menuForm.description && menuForm.description.length > 300) {
    errors.description = 'Description must be under 300 characters.';
  }

  if (menuForm.image && !URL_RE.test(menuForm.image)) {
    errors.image = 'Please enter a valid URL starting with http:// or https://';
  }

  return errors;
}

// ── Reusable field error component ──────────────────────────────────────────

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

// ── Main component ──────────────────────────────────────────────────────────

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyRestaurant);
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuForm, setMenuForm] = useState(emptyMenuItem);
  const [menuErrors, setMenuErrors] = useState({});
  const [menuTouched, setMenuTouched] = useState({});
  const [addingMenu, setAddingMenu] = useState(false);

  useEffect(() => { fetchRestaurants(); }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/restaurants');
      setRestaurants(res.data.restaurants || []);
    } catch {}
    setLoading(false);
  };

  // ── Restaurant form handlers ──

  const handleRestaurantChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) {
      const errs = validateRestaurant(updated);
      setFormErrors(prev => ({ ...prev, [field]: errs[field] }));
    }
  };

  const handleRestaurantBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const errs = validateRestaurant(form);
    setFormErrors(prev => ({ ...prev, [field]: errs[field] }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    // Mark all fields touched and validate
    const allTouched = Object.keys(emptyRestaurant).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    const errs = validateRestaurant(form);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the errors before submitting.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        cuisine: form.cuisine.split(',').map(c => c.trim()).filter(Boolean),
        rating: parseFloat(form.rating),
        deliveryFee: parseFloat(form.deliveryFee),
        minOrder: parseFloat(form.minOrder),
      };
      await api.post('/admin/restaurants', payload);
      toast.success('Restaurant created!');
      setShowForm(false);
      setForm(emptyRestaurant);
      setFormErrors({});
      setTouched({});
      fetchRestaurants();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create restaurant.');
    }
    setSaving(false);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setForm(emptyRestaurant);
    setFormErrors({});
    setTouched({});
  };

  // ── Menu item form handlers ──

  const handleMenuChange = (field, value) => {
    const updated = { ...menuForm, [field]: value };
    setMenuForm(updated);
    if (menuTouched[field]) {
      const errs = validateMenuItem(updated);
      setMenuErrors(prev => ({ ...prev, [field]: errs[field] }));
    }
  };

  const handleMenuBlur = (field) => {
    setMenuTouched(prev => ({ ...prev, [field]: true }));
    const errs = validateMenuItem(menuForm);
    setMenuErrors(prev => ({ ...prev, [field]: errs[field] }));
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    const allTouched = Object.keys(emptyMenuItem).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setMenuTouched(allTouched);
    const errs = validateMenuItem(menuForm);
    setMenuErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the errors before submitting.');
      return;
    }

    setAddingMenu(true);
    try {
      await api.post(`/admin/restaurants/${selectedRestaurant._id}/menu`, {
        ...menuForm,
        name: menuForm.name.trim(),
        category: menuForm.category.trim(),
        description: menuForm.description.trim(),
        price: parseFloat(menuForm.price),
      });
      toast.success('Menu item added!');
      setMenuForm(emptyMenuItem);
      setMenuErrors({});
      setMenuTouched({});
      fetchRestaurants();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item.');
    }
    setAddingMenu(false);
  };

  // ── Render ──

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Manage Restaurants</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Restaurant'}
        </button>
      </div>

      {/* ── Create Restaurant Form ── */}
      {showForm && (
        <div className="card p-6 mb-8">
          <h2 className="font-bold text-lg mb-5">New Restaurant</h2>
          <form onSubmit={handleCreate} className="space-y-4" noValidate>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputClass(formErrors.name)}
                  value={form.name}
                  onChange={e => handleRestaurantChange('name', e.target.value)}
                  onBlur={() => handleRestaurantBlur('name')}
                  aria-invalid={!!formErrors.name}
                  placeholder="e.g. The Burger House"
                />
                <FieldError msg={formErrors.name} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputClass(formErrors.address)}
                  value={form.address}
                  onChange={e => handleRestaurantChange('address', e.target.value)}
                  onBlur={() => handleRestaurantBlur('address')}
                  aria-invalid={!!formErrors.address}
                  placeholder="e.g. 123 Main St, New York, NY"
                />
                <FieldError msg={formErrors.address} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <input
                className={inputClass(formErrors.description)}
                value={form.description}
                onChange={e => handleRestaurantChange('description', e.target.value)}
                onBlur={() => handleRestaurantBlur('description')}
                placeholder="Short description (max 500 characters)"
              />
              <div className="flex justify-between">
                <FieldError msg={formErrors.description} />
                <span className={`text-xs mt-1 ${form.description.length > 480 ? 'text-red-400' : 'text-gray-400'}`}>
                  {form.description.length}/500
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
              <input
                className={inputClass(formErrors.image)}
                placeholder="https://..."
                value={form.image}
                onChange={e => handleRestaurantChange('image', e.target.value)}
                onBlur={() => handleRestaurantBlur('image')}
                aria-invalid={!!formErrors.image}
              />
              <FieldError msg={formErrors.image} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Cuisines <span className="text-red-500">*</span>
                <span className="font-normal text-gray-400 ml-1">(comma-separated)</span>
              </label>
              <input
                className={inputClass(formErrors.cuisine)}
                placeholder="Italian, Pizza, Pasta"
                value={form.cuisine}
                onChange={e => handleRestaurantChange('cuisine', e.target.value)}
                onBlur={() => handleRestaurantBlur('cuisine')}
                aria-invalid={!!formErrors.cuisine}
              />
              <FieldError msg={formErrors.cuisine} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
                <input
                  type="number" step="0.1" min="0" max="5"
                  className={inputClass(formErrors.rating)}
                  value={form.rating}
                  onChange={e => handleRestaurantChange('rating', e.target.value)}
                  onBlur={() => handleRestaurantBlur('rating')}
                  aria-invalid={!!formErrors.rating}
                />
                <FieldError msg={formErrors.rating} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Time</label>
                <input
                  className={inputClass(formErrors.deliveryTime)}
                  placeholder="30-45 min"
                  value={form.deliveryTime}
                  onChange={e => handleRestaurantChange('deliveryTime', e.target.value)}
                  onBlur={() => handleRestaurantBlur('deliveryTime')}
                  aria-invalid={!!formErrors.deliveryTime}
                />
                <FieldError msg={formErrors.deliveryTime} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Fee ($)</label>
                <input
                  type="number" step="0.01" min="0"
                  className={inputClass(formErrors.deliveryFee)}
                  value={form.deliveryFee}
                  onChange={e => handleRestaurantChange('deliveryFee', e.target.value)}
                  onBlur={() => handleRestaurantBlur('deliveryFee')}
                  aria-invalid={!!formErrors.deliveryFee}
                />
                <FieldError msg={formErrors.deliveryFee} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Min Order ($)</label>
                <input
                  type="number" min="0"
                  className={inputClass(formErrors.minOrder)}
                  value={form.minOrder}
                  onChange={e => handleRestaurantChange('minOrder', e.target.value)}
                  onBlur={() => handleRestaurantBlur('minOrder')}
                  aria-invalid={!!formErrors.minOrder}
                />
                <FieldError msg={formErrors.minOrder} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Creating…' : 'Create Restaurant'}
              </button>
              <button type="button" onClick={handleCancelForm} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Restaurants List ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {restaurants.map(r => (
          <div key={r._id} className="card overflow-hidden">
            <div className="h-36 overflow-hidden relative">
              <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              <div className="absolute bottom-3 left-3 text-white">
                <h3 className="font-bold text-lg">{r.name}</h3>
                <p className="text-white/70 text-xs">{r.cuisine?.join(', ')}</p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                <span>⭐ {r.rating}</span>
                <span>•</span>
                <span>🕐 {r.deliveryTime}</span>
                <span>•</span>
                <span>🚚 ${r.deliveryFee}</span>
                <span>•</span>
                <span>{r.menu?.length || 0} items</span>
              </div>

              <button
                onClick={() => {
                  setSelectedRestaurant(selectedRestaurant?._id === r._id ? null : r);
                  setMenuForm(emptyMenuItem);
                  setMenuErrors({});
                  setMenuTouched({});
                }}
                className="text-sm text-orange-500 font-semibold hover:underline"
              >
                {selectedRestaurant?._id === r._id ? '▲ Hide menu editor' : '▼ Add menu item'}
              </button>

              {/* ── Add Menu Item Form ── */}
              {selectedRestaurant?._id === r._id && (
                <form onSubmit={handleAddMenuItem} className="mt-4 space-y-3 pt-4 border-t" noValidate>
                  <h4 className="font-semibold text-sm text-gray-700">Add Menu Item</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        className={`${inputClass(menuErrors.name)} text-sm py-2`}
                        placeholder="Item name *"
                        value={menuForm.name}
                        onChange={e => handleMenuChange('name', e.target.value)}
                        onBlur={() => handleMenuBlur('name')}
                        aria-invalid={!!menuErrors.name}
                      />
                      <FieldError msg={menuErrors.name} />
                    </div>
                    <div>
                      <input
                        type="number" step="0.01" min="0"
                        className={`${inputClass(menuErrors.price)} text-sm py-2`}
                        placeholder="Price *"
                        value={menuForm.price}
                        onChange={e => handleMenuChange('price', e.target.value)}
                        onBlur={() => handleMenuBlur('price')}
                        aria-invalid={!!menuErrors.price}
                      />
                      <FieldError msg={menuErrors.price} />
                    </div>
                  </div>

                  <div>
                    <input
                      className={`${inputClass(menuErrors.category)} text-sm py-2`}
                      placeholder="Category * (e.g. Burgers, Drinks)"
                      value={menuForm.category}
                      onChange={e => handleMenuChange('category', e.target.value)}
                      onBlur={() => handleMenuBlur('category')}
                      aria-invalid={!!menuErrors.category}
                    />
                    <FieldError msg={menuErrors.category} />
                  </div>

                  <div>
                    <input
                      className={`${inputClass(menuErrors.description)} text-sm py-2`}
                      placeholder="Description (max 300 characters)"
                      value={menuForm.description}
                      onChange={e => handleMenuChange('description', e.target.value)}
                      onBlur={() => handleMenuBlur('description')}
                    />
                    <div className="flex justify-between">
                      <FieldError msg={menuErrors.description} />
                      {menuForm.description && (
                        <span className={`text-xs mt-1 ${menuForm.description.length > 280 ? 'text-red-400' : 'text-gray-400'}`}>
                          {menuForm.description.length}/300
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      className={`${inputClass(menuErrors.image)} text-sm py-2`}
                      placeholder="Image URL (https://...)"
                      value={menuForm.image}
                      onChange={e => handleMenuChange('image', e.target.value)}
                      onBlur={() => handleMenuBlur('image')}
                      aria-invalid={!!menuErrors.image}
                    />
                    <FieldError msg={menuErrors.image} />
                  </div>

                  <button type="submit" disabled={addingMenu} className="btn-primary text-sm py-2">
                    {addingMenu ? 'Adding…' : '+ Add Item'}
                  </button>
                </form>
              )}

              {/* Menu items preview */}
              {r.menu && r.menu.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-semibold text-gray-500 mb-2">MENU ITEMS</p>
                  <div className="space-y-1">
                    {r.menu.slice(0, 4).map(item => (
                      <div key={item._id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="font-semibold text-orange-500">${item.price?.toFixed(2)}</span>
                      </div>
                    ))}
                    {r.menu.length > 4 && (
                      <p className="text-xs text-gray-400">+{r.menu.length - 4} more items</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {restaurants.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-xl font-semibold">No restaurants yet</p>
          <p className="text-sm mt-2">Click "Add Restaurant" to create one</p>
        </div>
      )}
    </div>
  );
}