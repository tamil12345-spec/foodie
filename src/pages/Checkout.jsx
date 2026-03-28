import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { state } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zip: user?.address?.zip || '',
  });
  const { clearCart } = useCart();


  if (!state) { navigate('/cart'); return null; }

  const { items, restaurant, subtotal, deliveryFee, total } = state;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!address.street || !address.city) {
      toast.error('Please fill in delivery address');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create order first (paymentStatus: 'pending')
      const orderRes = await api.post('/orders', {
        restaurantId: restaurant._id,
        items: items.map(i => ({
          name: i.details.name,
          price: i.details.price,
          quantity: i.quantity,
          image: i.details.image,
        })),
        totalAmount: total,
        deliveryFee,
        deliveryAddress: address,
        paymentStatus: 'paid',
      });

      const order = orderRes.data.order;
      console.log({order});
      
      toast.success('Order placed successfully! 🎉');
      navigate(`/orders/${order._id}`);
      clearCart();
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Checkout</h1>
      <div className="grid md:grid-cols-2 gap-8">

        {/* Left - Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Delivery Address */}
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-4">Delivery Address</h2>
            <div className="space-y-3">
              <input
                className="input"
                placeholder="Street address"
                value={address.street}
                onChange={e => setAddress({ ...address, street: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder="City"
                  value={address.city}
                  onChange={e => setAddress({ ...address, city: e.target.value })}
                  required
                />
                <input
                  className="input"
                  placeholder="State"
                  value={address.state}
                  onChange={e => setAddress({ ...address, state: e.target.value })}
                />
              </div>
              <input
                className="input"
                placeholder="ZIP code"
                value={address.zip}
                onChange={e => setAddress({ ...address, zip: e.target.value })}
              />
            </div>
          </div>

          {/* Payment */}
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-4">Payment Details</h2>
            <div className="border border-gray-200 rounded-xl p-4">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#374151',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      '::placeholder': { color: '#9ca3af' },
                    },
                    invalid: { color: '#ef4444' },
                  },
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              🔒 Secured by Stripe. Test card: <span className="font-mono">4242 4242 4242 4242</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !stripe}
            className="btn-primary w-full text-lg py-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Processing...
              </span>
            ) : (
              `Pay $${total.toFixed(2)}`
            )}
          </button>
        </form>

        {/* Right - Order Summary */}
        <div className="card p-6 h-fit sticky top-6">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>

          <div className="flex items-center gap-3 mb-4 pb-4 border-b">
            <img
              src={restaurant.image}
              className="w-12 h-12 rounded-xl object-cover"
              alt={restaurant.name}
            />
            <div>
              <p className="font-bold">{restaurant.name}</p>
              <p className="text-gray-500 text-sm">{restaurant.deliveryTime}</p>
            </div>
          </div>

          <div className="space-y-3">
            {items.map(item => (
              <div key={item.details._id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.details.name} × {item.quantity}
                </span>
                <span className="font-semibold">
                  ${(item.details.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Delivery Fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-1">
              <span>Total</span>
              <span className="text-orange-500">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}