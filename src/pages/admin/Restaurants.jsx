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

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyRestaurant);
  const [saving, setSaving] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuForm, setMenuForm] = useState(emptyMenuItem);
  const [addingMenu, setAddingMenu] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/restaurants');
      setRestaurants(res.data.restaurants || []);
    } catch {}
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        cuisine: form.cuisine.split(',').map(c => c.trim()).filter(Boolean),
      };
      await api.post('/admin/restaurants', payload);
      toast.success('Restaurant created!');
      setShowForm(false);
      setForm(emptyRestaurant);
      fetchRestaurants();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
    setSaving(false);
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    setAddingMenu(true);
    try {
      await api.post(`/admin/restaurants/${selectedRestaurant._id}/menu`, {
        ...menuForm,
        price: parseFloat(menuForm.price),
      });
      toast.success('Menu item added!');
      setMenuForm(emptyMenuItem);
      fetchRestaurants();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    }
    setAddingMenu(false);
  };

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

      {/* Create Restaurant Form */}
      {showForm && (
        <div className="card p-6 mb-8">
          <h2 className="font-bold text-lg mb-5">New Restaurant</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
                <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <input className="input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
              <input className="input" placeholder="https://..." value={form.image} onChange={e => setForm({...form, image: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cuisines (comma separated)</label>
              <input className="input" placeholder="Italian, Pizza, Pasta" value={form.cuisine} onChange={e => setForm({...form, cuisine: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
                <input type="number" step="0.1" min="0" max="5" className="input" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Time</label>
                <input className="input" placeholder="30-45 min" value={form.deliveryTime} onChange={e => setForm({...form, deliveryTime: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Fee ($)</label>
                <input type="number" step="0.01" className="input" value={form.deliveryFee} onChange={e => setForm({...form, deliveryFee: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Min Order ($)</label>
                <input type="number" className="input" value={form.minOrder} onChange={e => setForm({...form, minOrder: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Creating...' : 'Create Restaurant'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Restaurants List */}
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
                onClick={() => setSelectedRestaurant(selectedRestaurant?._id === r._id ? null : r)}
                className="text-sm text-orange-500 font-semibold hover:underline"
              >
                {selectedRestaurant?._id === r._id ? '▲ Hide menu editor' : '▼ Add menu item'}
              </button>

              {/* Add Menu Item Form */}
              {selectedRestaurant?._id === r._id && (
                <form onSubmit={handleAddMenuItem} className="mt-4 space-y-3 pt-4 border-t">
                  <h4 className="font-semibold text-sm text-gray-700">Add Menu Item</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input className="input text-sm py-2" placeholder="Item name *" value={menuForm.name}
                        onChange={e => setMenuForm({...menuForm, name: e.target.value})} required />
                    </div>
                    <div>
                      <input type="number" step="0.01" className="input text-sm py-2" placeholder="Price *"
                        value={menuForm.price} onChange={e => setMenuForm({...menuForm, price: e.target.value})} required />
                    </div>
                  </div>
                  <input className="input text-sm py-2" placeholder="Category (e.g. Burgers, Drinks)" value={menuForm.category}
                    onChange={e => setMenuForm({...menuForm, category: e.target.value})} required />
                  <input className="input text-sm py-2" placeholder="Description" value={menuForm.description}
                    onChange={e => setMenuForm({...menuForm, description: e.target.value})} />
                  <input className="input text-sm py-2" placeholder="Image URL" value={menuForm.image}
                    onChange={e => setMenuForm({...menuForm, image: e.target.value})} />
                  <button type="submit" disabled={addingMenu} className="btn-primary text-sm py-2">
                    {addingMenu ? 'Adding...' : '+ Add Item'}
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
