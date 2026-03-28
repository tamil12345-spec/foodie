import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';

const STEPS = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];
const STEP_LABELS = { confirmed: 'Order Confirmed', preparing: 'Preparing', out_for_delivery: 'Out for Delivery', delivered: 'Delivered' };
const STEP_ICONS = { confirmed: '✅', preparing: '👨‍🍳', out_for_delivery: '🚚', delivered: '🎉' };

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data.order))
      .finally(() => setLoading(false));

    // Poll every 30s for status updates
    const interval = setInterval(() => {
      api.get(`/orders/${id}`).then(res => setOrder(res.data.order)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  if (!order) return <div className="text-center py-20 text-gray-400">Order not found</div>;

  const currentStep = STEPS.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/orders" className="text-gray-400 hover:text-gray-600 transition">← Orders</Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-xl font-bold text-gray-900">Order #{order._id.slice(-8).toUpperCase()}</h1>
      </div>

      {/* Tracking */}
      {order.status !== 'cancelled' && (
        <div className="card p-6 mb-6">
          <h2 className="font-bold text-lg mb-6">Order Tracking</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 -z-0">
              <div
                className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: `${currentStep >= 0 ? (currentStep / (STEPS.length - 1)) * 100 : 0}%` }}
              ></div>
            </div>
            {STEPS.map((step, idx) => (
              <div key={step} className="flex flex-col items-center z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                  idx <= currentStep ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-200'
                }`}>
                  {idx <= currentStep ? STEP_ICONS[step] : <span className="w-3 h-3 rounded-full bg-gray-300"></span>}
                </div>
                <span className={`text-xs mt-2 font-medium text-center ${idx <= currentStep ? 'text-orange-600' : 'text-gray-400'}`}>
                  {STEP_LABELS[step]}
                </span>
              </div>
            ))}
          </div>
          {order.estimatedDelivery && order.status !== 'delivered' && (
            <p className="text-center text-gray-500 text-sm mt-6">
              Estimated delivery: <strong>{new Date(order.estimatedDelivery).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</strong>
            </p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="card p-6">
          <h2 className="font-bold text-lg mb-4">Items Ordered</h2>
          <div className="flex items-center gap-3 mb-4 pb-4 border-b">
            <img src={order.restaurant?.image} className="w-10 h-10 rounded-xl object-cover" alt="" />
            <span className="font-semibold text-gray-800">{order.restaurant?.name}</span>
          </div>
          <div className="space-y-3">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={item.image} className="w-12 h-12 rounded-xl object-cover" alt={item.name} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-gray-400 text-xs">×{item.quantity}</p>
                </div>
                <p className="font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500"><span>Delivery fee</span><span>${order.deliveryFee?.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-orange-500">${order.totalAmount?.toFixed(2)}</span></div>
          </div>
        </div>

        {/* Delivery info */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-3">Delivery Address</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {order.deliveryAddress?.street}<br />
              {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zip}
            </p>
          </div>
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-3">Payment</h2>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {order.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
              </span>
              <span className="text-gray-500 text-sm">via Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
