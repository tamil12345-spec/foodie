import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { state } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [address, setAddress] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zip: user?.address?.zip || '',
  });
  const { clearCart } = useCart();

  if (!state) { navigate('/cart'); return null; }

  const { items, restaurant, subtotal, deliveryFee, total } = state;

  // ─── Save order to DB ───────────────────────────────────────────
  const createOrder = async (paymentStatus, razorpayPaymentId = null) => {
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
      paymentMethod,
      paymentStatus,
      razorpayPaymentId,
    });
    return orderRes.data.order;
  };

  // ─── Razorpay Payment ───────────────────────────────────────────
  const handleRazorpay = async () => {
    setLoading(true);
    try {
      // Step 1: Create Razorpay order from backend
      const { data } = await api.post('/payments/razorpay/create-order', {
        amount: total,
      });

      // Step 2: Open Razorpay popup
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'FoodApp',
        description: `Order from ${restaurant.name}`,
        order_id: data.id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#f97316' },
        handler: async (response) => {
          // Step 3: Verify payment on backend
          try {
            await api.post('/payments/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Step 4: Save order to DB
            const order = await createOrder('paid', response.razorpay_payment_id);
            toast.success('Payment successful! Order placed 🎉');
            clearCart();
            navigate(`/orders/${order._id}`);
          } catch (err) {
            console.error('Verification error:', err);
            toast.error('Payment verification failed. Please contact support.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled.');
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });

      rzp.open();

    } catch (err) {
      console.error('Razorpay error:', err);
      toast.error('Could not initiate payment. Please try again.');
      setLoading(false);
    }
  };

  // ─── Cash on Delivery ───────────────────────────────────────────
  const handleCOD = async () => {
    setLoading(true);
    try {
      const order = await createOrder('pending');
      toast.success('Order placed successfully! 🎉');
      clearCart();
      navigate(`/orders/${order._id}`);
    } catch (err) {
      console.error('COD error:', err);
      toast.error('Failed to place order. Please try again.');
    }
    setLoading(false);
  };

  // ─── Form Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!address.street || !address.city) {
      toast.error('Please fill in delivery address');
      return;
    }

    if (paymentMethod === 'razorpay') {
      await handleRazorpay();
    } else {
      await handleCOD();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">

        {/* ── Left: Form ── */}
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

          {/* Payment Method */}
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-4">Payment Method</h2>
            <div className="space-y-3">

              {/* Cash on Delivery */}
              <label className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition ${
                paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="accent-orange-500"
                />
                <span className="text-xl">💵</span>
                <div>
                  <p className="font-semibold text-gray-800">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">Pay when your order arrives</p>
                </div>
              </label>

              {/* Razorpay */}
              <label className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition ${
                paymentMethod === 'razorpay' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="accent-orange-500"
                />
                <span className="text-xl">💳</span>
                <div>
                  <p className="font-semibold text-gray-800">Pay Online</p>
                  <p className="text-xs text-gray-500">UPI · Cards · Net Banking via Razorpay</p>
                </div>
              </label>

            </div>
            <p className="text-xs text-gray-400 mt-3">🔒 Secured by Razorpay</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg py-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {paymentMethod === 'razorpay' ? 'Opening Payment...' : 'Placing Order...'}
              </span>
            ) : (
              `${paymentMethod === 'razorpay' ? 'Pay' : 'Place Order'} · ₹${total.toFixed(2)}`
            )}
          </button>

        </form>

        {/* ── Right: Order Summary ── */}
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
                  ₹{(item.details.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-1">
              <span>Total</span>
              <span className="text-orange-500">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}