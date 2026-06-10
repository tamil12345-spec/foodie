import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STEPS       = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];
const STEP_LABELS = { confirmed: 'Order Confirmed', preparing: 'Preparing', out_for_delivery: 'Out for Delivery', delivered: 'Delivered' };
const STEP_ICONS  = { confirmed: '✅', preparing: '👨‍🍳', out_for_delivery: '🚚', delivered: '🎉' };

const PAYMENT_ICONS = {
  card:       '💳',
  upi:        '📲',
  netbanking: '🏦',
  wallet:     '👛',
  cod:        '💵',
  razorpay:   '💳',
};

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function OrderDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.order);
    } catch (err) {
      toast.error(err.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    // Poll every 30s for live status updates
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const handleCancel = async () => {
    const reason = window.prompt(
      'Reason for cancellation (optional):',
      ''
    );
    if (reason === null) return; // user pressed Cancel
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setCancelling(true);
    try {
      await api.post(`/orders/${id}/cancel`, {
        reason: reason.trim() || 'Cancelled by customer',
      });
      toast.success('Order cancelled successfully.');
      fetchOrder();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order.');
    }
    setCancelling(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  );

  if (!order) return (
    <div className="text-center py-20 text-gray-400">
      <p className="text-xl font-semibold">Order not found</p>
      <Link to="/orders" className="text-orange-500 text-sm mt-3 inline-block hover:underline">← Back to orders</Link>
    </div>
  );

  const currentStep  = STEPS.indexOf(order.status);
  const cancellable  = !['out_for_delivery', 'delivered', 'cancelled'].includes(order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/orders" className="text-gray-400 hover:text-gray-600 transition">← Orders</Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-xl font-bold text-gray-900">Order #{order._id.slice(-8).toUpperCase()}</h1>
        </div>
        {cancellable && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-sm text-red-500 border border-red-300 rounded-lg px-3 py-1.5 hover:bg-red-50 transition font-semibold disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Cancel Order'}
          </button>
        )}
      </div>

      {/* ── Order timestamps ── */}
      <div className="card p-4 mb-6 flex flex-wrap gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Ordered</p>
          <p className="text-gray-700 font-semibold">{formatDate(order.orderedAt || order.createdAt)}</p>
        </div>
        {order.estimatedDeliveryAt && order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Est. Delivery</p>
            <p className="text-orange-500 font-semibold">{formatDate(order.estimatedDeliveryAt)}</p>
          </div>
        )}
        {order.deliveredAt && (
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Delivered</p>
            <p className="text-green-600 font-semibold">{formatDate(order.deliveredAt)}</p>
          </div>
        )}
        {order.cancelledAt && (
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Cancelled</p>
            <p className="text-red-500 font-semibold">{formatDate(order.cancelledAt)}</p>
          </div>
        )}
        {order.cancelReason && (
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Reason</p>
            <p className="text-gray-600">{order.cancelReason}</p>
          </div>
        )}
      </div>

      {/* ── Tracking ── */}
      {order.status !== 'cancelled' ? (
        <div className="card p-6 mb-6">
          <h2 className="font-bold text-lg mb-6">Order Tracking</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 -z-0">
              <div
                className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: `${currentStep >= 0 ? (currentStep / (STEPS.length - 1)) * 100 : 0}%` }}
              />
            </div>
            {STEPS.map((step, idx) => (
              <div key={step} className="flex flex-col items-center z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                  idx <= currentStep ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-200'
                }`}>
                  {idx <= currentStep
                    ? STEP_ICONS[step]
                    : <span className="w-3 h-3 rounded-full bg-gray-300 block" />}
                </div>
                <span className={`text-xs mt-2 font-medium text-center ${idx <= currentStep ? 'text-orange-600' : 'text-gray-400'}`}>
                  {STEP_LABELS[step]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-5 mb-6 bg-red-50 border border-red-200">
          <p className="text-red-600 font-semibold">✕ This order was cancelled</p>
          {order.cancelReason && <p className="text-red-400 text-sm mt-1">{order.cancelReason}</p>}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Items ── */}
        <div className="card p-6">
          <h2 className="font-bold text-lg mb-4">Items Ordered</h2>
          <div className="flex items-center gap-3 mb-4 pb-4 border-b">
            <img src={order.restaurant?.image} className="w-10 h-10 rounded-xl object-cover" alt="" />
            <span className="font-semibold text-gray-800">{order.restaurant?.name}</span>
          </div>
          <div className="space-y-3">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.image && (
                  <img src={item.image} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt={item.name}
                    onError={e => { e.target.style.display = 'none'; }} />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-gray-400 text-xs">×{item.quantity}</p>
                </div>
                <p className="font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Delivery fee</span>
              <span>${order.deliveryFee?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-orange-500">${order.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ── Delivery + Payment ── */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-3">Delivery Address</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {order.deliveryAddress?.street}<br />
              {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zip}
            </p>
            {order.restaurant?.deliveryTime && (
              <p className="text-gray-400 text-xs mt-2">🕐 Est. delivery time: {order.restaurant.deliveryTime}</p>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-lg mb-3">Payment</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                order.paymentStatus === 'paid'     ? 'bg-green-100 text-green-700'  :
                order.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-700'   :
                order.paymentStatus === 'failed'   ? 'bg-red-100 text-red-600'     :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {order.paymentStatus === 'paid'     ? '✓ Paid'     :
                 order.paymentStatus === 'refunded' ? '↩ Refunded' :
                 order.paymentStatus === 'failed'   ? '✕ Failed'   : 'Pending'}
              </span>
              {/* ── Fixed: was hardcoded "via upi" ── */}
              <span className="text-gray-500 text-sm">
                {PAYMENT_ICONS[order.paymentMethod] || '💳'} via {order.paymentMethod?.toUpperCase() || 'ONLINE'}
              </span>
            </div>
            {order.paymentIntentId && (
              <p className="text-gray-400 text-xs mt-2 font-mono">Ref: {order.paymentIntentId}</p>
            )}
          </div>

          {/* ── Status timeline ── */}
          {order.statusHistory?.length > 0 && (
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-3">Order Timeline</h2>
              <div className="space-y-2">
                {order.statusHistory.map((h, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-500 border-b pb-2 last:border-0">
                    <span className="capitalize font-medium text-gray-700">
                      {h.status?.replace(/_/g, ' ')}
                      {h.note ? <span className="text-gray-400 font-normal"> — {h.note}</span> : ''}
                    </span>
                    <span className="flex-shrink-0 ml-2">{formatDate(h.changedAt || h.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}