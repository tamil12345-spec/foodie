import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart]               = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const { user } = useAuth();

  // ── Extract string ID safely from populated or raw field ─────────────────
  const extractId = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return val._id?.toString() || val.id?.toString() || null;
    return null;
  };

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get('/cart');
      const cartData = res.data.cart || [];
      setCart(cartData);
      // ── Fix: cart[0].restaurant may be a populated object or a string ID ──
      if (cartData.length > 0) {
        setRestaurantId(extractId(cartData[0].restaurant));
      } else {
        setRestaurantId(null);
      }
    } catch (err) {
      console.error('[CartContext] fetchCart:', err.message);
    }
  }, []);

  useEffect(() => {
    if (user) fetchCart();
    else { setCart([]); setRestaurantId(null); }
  }, [user, fetchCart]);

  const addToCart = async (menuItemId, restId, quantity = 1) => {
    if (!user) { toast.error('Please login to add items to cart.'); return; }
    try {
      const res = await api.post('/cart/add', { menuItemId, restaurantId: restId, quantity });
      setCart(res.data.cart);
      setRestaurantId(extractId(restId)); // always store string ID
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.message || 'Failed to add to cart.');
    }
  };

  const updateQuantity = async (menuItemId, quantity) => {
    try {
      const res = await api.put('/cart/update', { menuItemId, quantity });
      setCart(res.data.cart);
      if (res.data.cart.length === 0) setRestaurantId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update cart.');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setCart([]);
      setRestaurantId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to clear cart.');
    }
  };

  const cartCount = cart.reduce((sum, i) => sum + (i.quantity || 0), 0);

  return (
    <CartContext.Provider value={{ cart, cartCount, restaurantId, addToCart, updateQuantity, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);