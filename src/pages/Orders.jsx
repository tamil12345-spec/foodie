import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending:          'bg-yellow-100 text-yellow-700',
  confirmed:        'bg-blue-100 text-blue-700',
  preparing:        'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered:        'bg-green-100 text-green-700',
  cancelled:        'bg-red-100 text-red-600',
};

const STATUS_STEPS = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];

const PAYMENT_ICONS = {
  card:        '💳',
  upi:         '📲',
  netbanking:  '🏦',
  wallet:      '👛',
  cod:         '💵',
  razorpay:    '💳',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ── Status timeline ───────────────────────────────────────────────────────────
function StatusTimeline({ status }) {
  if (status === 'cancelled') return null;
  const current = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-3">
      {STATUS_STEPS.map((step, i) => (
        <div key={step} className="flex items-center flex-1">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            i <= current ? 'bg-orange-500' : 'bg-gray-200'
          }`} />
          {i < STATUS_STEPS.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 ${i < current ? 'bg-orange-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Order card ────────────────────────────────────────────────────────────────
function OrderCard({ order, onCancel, cancelling }) {
  const [expanded, setExpanded] = useState(false);
  const cancellable = !['out_for_delivery', 'delivered', 'cancelled'].includes(order.status);

  return (
    <div className="card overflow-hidden">
      {/* ── Header row ── */}
      <Link to={`/orders/${order._id}`} className="flex items-center gap-4 p-5 hover:bg-gray-50 transition block">
        <img
          src={order.restaurant?.image}
          alt={order.restaurant?.name}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          onError={e => { e.target.src = 'https://via.placeholder.com/64'; }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">{order.restaurant?.name}</h3>
          <p className="text-gray-500 text-sm mt-0.5">
            {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} •{' '}
            <span className="font-semibold text-gray-700">${order.totalAmount?.toFixed(2)}</span>
          </p>
          {/* Ordered at */}
          <p className="text-gray-400 text-xs mt-1">
            🕐 Ordered {formatDateShort(order.orderedAt || order.createdAt)}
          </p>
          {/* Delivered at */}
          {order.status === 'delivered' && order.deliveredAt && (
            <p className="text-green-600 text-xs mt-0.5">
              ✓ Delivered {formatDate(order.deliveredAt)}
            </p>
          )}
          {/* Estimated delivery */}
          {!['delivered', 'cancelled'].includes(order.status) && order.estimatedDeliveryAt && (
            <p className="text-orange-500 text-xs mt-0.5">
              🚚 Est. delivery by {formatDate(order.estimatedDeliveryAt)}
            </p>
          )}
          {/* Cancelled at */}
          {order.status === 'cancelled' && order.cancelledAt && (
            <p className="text-red-500 text-xs mt-0.5">
              ✕ Cancelled {formatDate(order.cancelledAt)}
              {order.cancelReason && ` — ${order.cancelReason}`}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
            {order.status?.replace(/_/g, ' ')}
          </span>
          {/* Payment method */}
          <span className="text-xs text-gray-400">
            {PAYMENT_ICONS[order.paymentMethod] || '💳'} {order.paymentMethod?.toUpperCase() || 'PAID'}
          </span>
        </div>
      </Link>

      {/* ── Status timeline ── */}
      <div className="px-5 pb-3">
        <StatusTimeline status={order.status} />
      </div>

      {/* ── Expandable items + actions ── */}
      <div className="border-t px-5 py-3 flex items-center justify-between">
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-xs text-orange-500 font-semibold hover:underline"
        >
          {expanded ? '▲ Hide items' : '▼ View items'}
        </button>
        {cancellable && (
          <button
            onClick={() => onCancel(order._id)}
            disabled={cancelling === order._id}
            className="text-xs text-red-500 font-semibold hover:underline disabled:opacity-50"
          >
            {cancelling === order._id ? 'Cancelling…' : 'Cancel Order'}
          </button>
        )}
      </div>

      {/* ── Items list ── */}
      {expanded && (
        <div className="px-5 pb-4 space-y-2 border-t pt-3">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.quantity}× {item.name}</span>
              <span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm border-t pt-2 mt-2">
            <span className="text-gray-500">Delivery fee</span>
            <span className="text-gray-700">${order.deliveryFee?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm">
            <span>Total</span>
            <span className="text-orange-500">${order.totalAmount?.toFixed(2)}</span>
          </div>
          {/* Status history */}
          {order.statusHistory?.length > 0 && (
            <div className="mt-3 pt-3 border-t space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Timeline</p>
              {order.statusHistory.map((h, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-500">
                  <span className="capitalize">{h.status?.replace(/_/g, ' ')} {h.note ? `— ${h.note}` : ''}</span>
                  <span>{formatDate(h.changedAt || h.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Orders() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (orderId) => {
    const reason = window.prompt(
      'Please provide a reason for cancellation (optional):\n\nLeave blank to cancel without a reason.',
      ''
    );
    // user pressed Cancel on the prompt
    if (reason === null) return;

    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setCancelling(orderId);
    try {
      await api.post(`/orders/${orderId}/cancel`, {
        reason: reason.trim() || 'Cancelled by customer',
      });
      toast.success('Order cancelled successfully.');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order.');
    }
    setCancelling(null);
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="card p-5 h-28 animate-pulse bg-gray-100" />
      ))}
    </div>
  );

  if (orders.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-7xl mb-4">📦</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
      <p className="text-gray-500 mb-6">Your order history will appear here</p>
      <Link to="/restaurants" className="btn-primary">Start Ordering</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Orders</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <OrderCard
            key={order._id}
            order={order}
            onCancel={handleCancel}
            cancelling={cancelling}
          />
        ))}
      </div>
    </div>
  );
}