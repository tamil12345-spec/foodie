import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🍔</span>
          <span className="font-extrabold text-xl text-gray-900">FoodRush</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link to="/restaurants" className="hover:text-orange-500 transition">Restaurants</Link>
          {user && <Link to="/orders" className="hover:text-orange-500 transition">My Orders</Link>}
          {user?.role === 'admin' && <Link to="/admin" className="hover:text-orange-500 transition text-purple-600">Admin</Link>}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/cart" className="relative p-2 hover:bg-orange-50 rounded-xl transition">
                <span className="text-xl">🛒</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-3 py-2 transition">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block">{user.name}</span>
              </Link>
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 transition font-medium">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-orange-500 transition">Login</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
