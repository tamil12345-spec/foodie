import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount }    = useCart();
  const navigate         = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-2">
          <span className="text-2xl">🍔</span>
          <span className="font-extrabold text-xl text-gray-900">FoodRush</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          {/* Hide restaurants and orders from admin */}
          {!isAdmin && (
            <>
              <Link to="/restaurants" className="hover:text-orange-500 transition">Restaurants</Link>
              {user && <Link to="/orders" className="hover:text-orange-500 transition">My Orders</Link>}
            </>
          )}
          {isAdmin && (
            <>
              <Link to="/admin"              className="hover:text-purple-600 transition text-purple-600 font-semibold">Dashboard</Link>
              <Link to="/admin/orders"       className="hover:text-purple-600 transition text-purple-500">Orders</Link>
              <Link to="/admin/restaurants"  className="hover:text-purple-600 transition text-purple-500">Restaurants</Link>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Cart — hidden for admin */}
              {!isAdmin && (
                <Link to="/cart" className="relative p-2 hover:bg-orange-50 rounded-xl transition">
                  <span className="text-xl">🛒</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Profile */}
              <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-3 py-2 transition">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  isAdmin ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block">
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  {isAdmin && <span className="block text-xs text-purple-500 font-semibold">Admin</span>}
                </div>
              </Link>

              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 transition font-medium">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="text-sm font-semibold text-gray-600 hover:text-orange-500 transition">Login</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}