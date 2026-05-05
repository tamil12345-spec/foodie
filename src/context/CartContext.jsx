import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchCart();
    else setCart([]);
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data.cart || []);
      if (res.data.cart?.length > 0) {
        setRestaurantId(res.data.cart[0].restaurant);
      }
    } catch {}
  };

  const addToCart = async (menuItemId, restaurantId, quantity = 1) => {
    console.log("addToCart called:", { menuItemId, restaurantId });
    if (!user) { toast.error('Please login first'); return; }
    try {
      const res = await api.post('/cart/add', { menuItemId, restaurantId, quantity });
      setCart(res.data.cart);
      setRestaurantId(restaurantId);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add');
    }
  };

  const updateQuantity = async (menuItemId, quantity) => {
    try {
      const res = await api.put('/cart/update', { menuItemId, quantity });
      setCart(res.data.cart);
      if (res.data.cart.length === 0) setRestaurantId(null);
    } catch {}
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setCart([]);
      setRestaurantId(null);
    } catch {}
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cartCount, restaurantId, addToCart, updateQuantity, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
