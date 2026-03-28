import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';

export default function RestaurantDetail() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const { addToCart, cart, restaurantId } = useCart();

  useEffect(() => {
    api.get(`/restaurants/${id}`)
      .then(res => setRestaurant(res.data.restaurant))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-64 bg-gray-200 rounded-2xl mb-6"></div>
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );

  if (!restaurant) return <div className="text-center py-20 text-gray-400">Restaurant not found</div>;

  const categories = ['All', ...new Set(restaurant.menu?.map(i => i.category))];
  const filtered = activeCategory === 'All'
    ? restaurant.menu
    : restaurant.menu?.filter(i => i.category === activeCategory);

  const getCartQty = (itemId) => {
    const item = cart.find(c => c.menuItem?._id === itemId || c.menuItem === itemId);
    return item?.quantity || 0;
  };

  const isDifferentRestaurant = restaurantId && restaurantId.toString() !== id;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="relative h-64 rounded-2xl overflow-hidden mb-6">
        <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="text-3xl font-extrabold">{restaurant.name}</h1>
          <p className="text-white/80 mt-1">{restaurant.description}</p>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full font-medium">⭐ {restaurant.rating}</span>
        <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">🕐 {restaurant.deliveryTime}</span>
        <span className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-medium">🚚 ${restaurant.deliveryFee} delivery</span>
        <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full font-medium">💰 Min ${restaurant.minOrder}</span>
      </div>

      {isDifferentRestaurant && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl p-4 mb-6 text-sm font-medium">
          ⚠️ Your cart has items from another restaurant. Adding new items will clear your current cart.
        </div>
      )}

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeCategory === cat
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-orange-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered?.map(item => (
          <div key={item._id} className="card flex gap-4 p-4">
            <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{item.name}</h3>
              <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-orange-500 text-lg">${item.price.toFixed(2)}</span>
                {getCartQty(item._id) > 0 ? (
                  <span className="bg-orange-100 text-orange-600 text-sm font-semibold px-3 py-1 rounded-full">
                    In cart: {getCartQty(item._id)}
                  </span>
                ) : (
                  <button
                    onClick={() => addToCart(item._id, id)}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
