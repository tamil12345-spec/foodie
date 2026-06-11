import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount }    = useCart();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };
  const isAdmin = user?.role === 'admin';
  const isActive = (path) => location.pathname === path;

  const linkCls = (path) =>
    `block px-4 py-2 rounded-xl text-sm font-medium transition ${
      isActive(path)
        ? 'bg-orange-50 text-orange-500'
        : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'
    }`;

  const adminLinkCls = (path) =>
    `block px-4 py-2 rounded-xl text-sm font-medium transition ${
      isActive(path)
        ? 'bg-purple-50 text-purple-600'
        : 'text-purple-500 hover:text-purple-600 hover:bg-purple-50'
    }`;

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl">🍔</span>
          <span className="font-extrabold text-xl text-gray-900">FoodRush</span>
        </Link>

        {/* ── Desktop nav ── */}
        <div className="hidden md:flex items-center gap-1">
          {!isAdmin ? (
            <>
              <Link to="/restaurants" className={linkCls('/restaurants')}>Restaurants</Link>
              {user && <Link to="/orders"      className={linkCls('/orders')}>My Orders</Link>}
            </>
          ) : (
            <>
              <Link to="/admin"             className={adminLinkCls('/admin')}>Dashboard</Link>
              <Link to="/admin/orders"      className={adminLinkCls('/admin/orders')}>Orders</Link>
              <Link to="/admin/restaurants" className={adminLinkCls('/admin/restaurants')}>Restaurants</Link>
            </>
          )}
        </div>

        {/* ── Desktop right side ── */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {!isAdmin && (
                <Link to="/cart" className="relative p-2 hover:bg-orange-50 rounded-xl transition">
                  <span className="text-xl">🛒</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              )}
              <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-3 py-2 transition">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  isAdmin ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
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

        {/* ── Mobile right: cart + hamburger ── */}
        <div className="flex md:hidden items-center gap-2">
          {user && !isAdmin && (
            <Link to="/cart" className="relative p-2 hover:bg-orange-50 rounded-xl transition">
              <span className="text-xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-600"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile menu dropdown ── */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {!isAdmin ? (
            <>
              <Link to="/restaurants" className={linkCls('/restaurants')} onClick={() => setMenuOpen(false)}>
                🍽️ Restaurants
              </Link>
              {user && (
                <Link to="/orders" className={linkCls('/orders')} onClick={() => setMenuOpen(false)}>
                  📦 My Orders
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/admin"             className={adminLinkCls('/admin')}             onClick={() => setMenuOpen(false)}>📊 Dashboard</Link>
              <Link to="/admin/orders"      className={adminLinkCls('/admin/orders')}      onClick={() => setMenuOpen(false)}>📦 Manage Orders</Link>
              <Link to="/admin/restaurants" className={adminLinkCls('/admin/restaurants')} onClick={() => setMenuOpen(false)}>🍽️ Manage Restaurants</Link>
            </>
          )}

          <div className="border-t border-gray-100 pt-2 mt-2">
            {user ? (
              <>
                <Link to="/profile" className={linkCls('/profile')} onClick={() => setMenuOpen(false)}>
                  👤 {user.name} {isAdmin && <span className="text-xs text-purple-500">(Admin)</span>}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className={linkCls('/login')}    onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className={linkCls('/register')} onClick={() => setMenuOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}