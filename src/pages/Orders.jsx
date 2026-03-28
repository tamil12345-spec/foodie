import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my-orders')
      .then(res => setOrders(res.data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
      {[1,2,3].map(i => <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100"></div>)}
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
          <Link key={order._id} to={`/orders/${order._id}`} className="card p-5 flex items-center gap-4 hover:shadow-md transition block">
            <img src={order.restaurant?.image} alt={order.restaurant?.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{order.restaurant?.name}</h3>
              <p className="text-gray-500 text-sm mt-0.5">{order.items?.length} items • ${order.totalAmount?.toFixed(2)}</p>
              <p className="text-gray-400 text-xs mt-1">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
              {order.status?.replace(/_/g, ' ')}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
