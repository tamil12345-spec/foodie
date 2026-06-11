import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Dashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminRestaurants from './pages/admin/Restaurants';

// ── Route guards ──────────────────────────────────────────────────────────────

// Requires login
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

// Requires admin role
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
};

// Requires login AND non-admin (blocks admin from cart/checkout/orders)
const UserRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  // Redirect admin to their dashboard instead
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
};

// ── Routes ────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/"                   element={<Home />} />
        <Route path="/login"              element={<Login />} />
        <Route path="/register"           element={<Register />} />
        <Route path="/restaurants"        element={<Restaurants />} />
        <Route path="/restaurants/:id"    element={<RestaurantDetail />} />

        {/* User only — admin redirected to /admin */}
        <Route path="/cart"               element={<UserRoute><Cart /></UserRoute>} />
        <Route path="/checkout"           element={<UserRoute><Checkout /></UserRoute>} />
        <Route path="/orders"             element={<UserRoute><Orders /></UserRoute>} />
        <Route path="/orders/:id"         element={<UserRoute><OrderDetail /></UserRoute>} />

        {/* Private (any logged-in user) */}
        <Route path="/profile"            element={<PrivateRoute><Profile /></PrivateRoute>} />

        {/* Admin only */}
        <Route path="/admin"              element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/orders"       element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/restaurants"  element={<AdminRoute><AdminRestaurants /></AdminRoute>} />

        {/* Catch-all */}
        <Route path="*"                   element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{ style: { borderRadius: '12px', fontFamily: 'Plus Jakarta Sans' } }}
      />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
}