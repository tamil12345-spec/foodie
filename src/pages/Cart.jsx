import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../utils/api';

export default function Cart() {
  const { cart, updateQuantity, clearCart, restaurantId } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (restaurantId) {
      api.get(`/restaurants/${restaurantId}`).then(res => setRestaurant(res.data.restaurant));
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurant && cart.length > 0) {
      const enriched = cart.map(cartItem => {
        const menuItem = restaurant.menu?.find(m => m._id === (cartItem.menuItem?._id || cartItem.menuItem));
        return { ...cartItem, details: menuItem };
      }).filter(i => i.details);
      setItems(enriched);
    } else {
      setItems([]);
    }
  }, [cart, restaurant]);

  const subtotal = items.reduce((sum, i) => sum + (i.details?.price || 0) * i.quantity, 0);
  const deliveryFee = restaurant?.deliveryFee || 0;
  const total = subtotal + deliveryFee;

  if (cart.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-7xl mb-4">🛒</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-6">Add some delicious food to get started!</p>
      <Link to="/restaurants" className="btn-primary">Browse Restaurants</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Your Cart</h1>
      <div className="grid md:grid-cols-3 gap-8">
        {/* Items */}
        <div className="md:col-span-2 space-y-4">
          {restaurant && (
            <div className="flex items-center gap-3 mb-4 p-4 bg-orange-50 rounded-xl">
              <img src={restaurant.image} className="w-12 h-12 rounded-xl object-cover" alt={restaurant.name} />
              <div>
                <p className="text-xs text-gray-500">Ordering from</p>
                <p className="font-bold text-gray-900">{restaurant.name}</p>
              </div>
            </div>
          )}

          {items.map(item => (
            <div key={item.details?._id} className="card p-4 flex gap-4 items-center">
              <img src={item.details?.image} alt={item.details?.name} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.details?.name}</h3>
                <p className="text-orange-500 font-bold">${item.details?.price?.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.details._id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-orange-100 text-gray-600 font-bold transition flex items-center justify-center"
                >−</button>
                <span className="w-6 text-center font-bold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.details._id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold transition flex items-center justify-center"
                >+</button>
              </div>
              <p className="font-bold text-gray-900 w-16 text-right">${(item.details?.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}

          <button onClick={clearCart} className="text-red-400 hover:text-red-500 text-sm font-medium transition mt-2">
            🗑 Clear cart
          </button>
        </div>

        {/* Summary */}
        <div className="card p-6 h-fit sticky top-20">
          <h2 className="font-bold text-lg text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery fee</span><span>${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span><span className="text-orange-500">${total.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/checkout', { state: { items, restaurant, subtotal, deliveryFee, total } })}
            className="btn-primary w-full mt-6 text-center"
          >
            Proceed to Checkout →
          </button>
        </div>
      </div>
    </div>
  );
}
