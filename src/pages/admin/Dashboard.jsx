import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const STATUS_COLORS = {
  pending:          'bg-yellow-100 text-yellow-700',
  confirmed:        'bg-blue-100 text-blue-700',
  preparing:        'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered:        'bg-green-100 text-green-700',
  cancelled:        'bg-red-100 text-red-600',
};

// ── Skeleton loaders ──────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-200 mb-3" />
      <div className="h-7 w-20 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-24 bg-gray-100 rounded" />
    </div>
  );
}

function TableSkeleton() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className="animate-pulse">
      {Array.from({ length: 6 }).map((__, j) => (
        <td key={j} className="px-5 py-3">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </td>
      ))}
    </tr>
  ));
}

// ── Error banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-center justify-between gap-4">
      <p className="text-sm text-red-600 font-medium">⚠ {message}</p>
      <button
        onClick={onRetry}
        className="text-sm font-semibold text-red-600 border border-red-300 rounded-lg px-3 py-1.5 hover:bg-red-100 transition flex-shrink-0"
      >
        Retry
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/stats');
      setData(res.data);
    } catch (err) {
      setError(
        err.isNetworkError
          ? 'Server is waking up. Please wait a moment and try again.'
          : err.message || 'Failed to load dashboard data.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const stats = [
    { label: 'Total Orders',   value: data?.stats?.totalOrders,                          icon: '📦', color: 'bg-blue-50 text-blue-600'   },
    { label: 'Total Users',    value: data?.stats?.totalUsers,                            icon: '👥', color: 'bg-green-50 text-green-600'  },
    { label: 'Restaurants',    value: data?.stats?.totalRestaurants,                      icon: '🍽️', color: 'bg-purple-50 text-purple-600' },
    { label: 'Revenue',        value: data?.stats?.totalRevenue != null
                                        ? `$${data.stats.totalRevenue.toFixed(2)}`
                                        : '—',                                            icon: '💰', color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your food delivery platform</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/orders"      className="btn-outline text-sm">Manage Orders</Link>
          <Link to="/admin/restaurants" className="btn-primary text-sm">Manage Restaurants</Link>
        </div>
      </div>

      {/* Error banner */}
      {error && <div className="mb-6"><ErrorBanner message={error} onRetry={fetchStats} /></div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : stats.map(s => (
              <div key={s.label} className="card p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${s.color}`}>
                  {s.icon}
                </div>
                <p className="text-2xl font-extrabold text-gray-900">
                  {s.value ?? '—'}
                </p>
                <p className="text-gray-500 text-sm mt-0.5">{s.label}</p>
              </div>
            ))
        }
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-bold text-lg">Recent Orders</h2>
          <Link to="/admin/orders" className="text-orange-500 text-sm font-semibold hover:underline">
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Order ID', 'Customer', 'Restaurant', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-gray-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <TableSkeleton />
              ) : !data?.recentOrders?.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                    No recent orders found.
                  </td>
                </tr>
              ) : (
                data.recentOrders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3 font-medium">
                      {order.user?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {order.restaurant?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3 font-semibold">
                      {order.totalAmount != null ? `$${order.totalAmount.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {order.status?.replace(/_/g, ' ') ?? 'unknown'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}