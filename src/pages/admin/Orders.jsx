import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

// Allowed forward transitions — prevents illegal status jumps
const VALID_TRANSITIONS = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['preparing', 'cancelled'],
  preparing:        ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered:        [],
  cancelled:        [],
};

function canTransition(current, next) {
  if (current === next) return true; // no-op is fine
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
}

function validateStatusChange(current, next) {
  if (!next) return 'Please select a status.';
  if (!STATUSES.includes(next)) return 'Invalid status value.';
  if (current === next) return null; // no change, silently ignore
  if (!canTransition(current, next)) {
    return `Cannot move from "${current.replace(/_/g, ' ')}" to "${next.replace(/_/g, ' ')}".`;
  }
  return null;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/orders')
      .then(res => setOrders(res.data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId, currentStatus, newStatus) => {
    if (currentStatus === newStatus) return; // no-op

    const error = validateStatusChange(currentStatus, newStatus);
    if (error) {
      toast.error(error);
      return;
    }

    setUpdating(orderId);
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev =>
        prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o)
      );
      toast.success(`Order updated to "${newStatus.replace(/_/g, ' ')}"`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
    setUpdating(null);
  };

  // ── Filtered + searched orders ──────────────────────────────────────────────
  const visible = orders.filter(o => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.user?.email?.toLowerCase().includes(q) ||
      o.restaurant?.name?.toLowerCase().includes(q) ||
      o._id?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Manage Orders</h1>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by customer, restaurant, order ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input flex-1 min-w-48 text-sm"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* ── Results count ── */}
      <p className="text-xs text-gray-400 mb-3">
        Showing {visible.length} of {orders.length} orders
      </p>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Order', 'Customer', 'Restaurant', 'Items', 'Total', 'Status', 'Update'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    No orders match your filters.
                  </td>
                </tr>
              ) : (
                visible.map(order => {
                  const allowed = VALID_TRANSITIONS[order.status] ?? [];
                  const isTerminal = allowed.length === 0;

                  return (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        #{order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.user?.name}</p>
                        <p className="text-gray-400 text-xs">{order.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{order.restaurant?.name}</td>
                      <td className="px-4 py-3 text-gray-500">{order.items?.length} items</td>
                      <td className="px-4 py-3 font-bold">${order.totalAmount?.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[order.status]}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isTerminal ? (
                          <span className="text-xs text-gray-400 italic">No further updates</span>
                        ) : (
                          <select
                            value={order.status}
                            onChange={e => updateStatus(order._id, order.status, e.target.value)}
                            disabled={updating === order._id}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer disabled:opacity-50"
                            aria-label={`Update status for order ${order._id.slice(-8).toUpperCase()}`}
                          >
                            <option value={order.status}>{order.status.replace(/_/g, ' ')}</option>
                            {allowed.map(s => (
                              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}