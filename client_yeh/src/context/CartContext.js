import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as cartApi from '../services/api/cartApi';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

const EMPTY_CART = { items: [], itemCount: 0, subtotal: 0, hasUnavailableItems: false };

/**
 * Giỏ hàng lưu server-side theo customer (SystemDesign §4). Context chỉ cache bản mới nhất
 * mà server trả về sau mỗi thao tác — không tự tính giá ở client.
 */
export function CartProvider({ children }) {
  const { user, isCustomer } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingBookIds, setPendingBookIds] = useState([]);

  const refresh = useCallback(async () => {
    if (!isCustomer) {
      setCart(EMPTY_CART);
      return EMPTY_CART;
    }
    setLoading(true);
    setError(null);
    try {
      const fresh = await cartApi.getMyCart();
      setCart(fresh);
      return fresh;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isCustomer]);

  // Tải lại giỏ mỗi khi đổi tài khoản (login/logout).
  useEffect(() => { refresh(); }, [refresh, user?.id]);

  const runMutation = useCallback(async (bookId, mutation) => {
    setPendingBookIds(prev => [...prev, bookId]);
    try {
      const fresh = await mutation();
      setCart(fresh);
      return fresh;
    } finally {
      setPendingBookIds(prev => prev.filter(id => id !== bookId));
    }
  }, []);

  const addItem = useCallback((bookId, quantity = 1) =>
    runMutation(bookId, () => cartApi.addCartItem(bookId, quantity)), [runMutation]);

  const updateQuantity = useCallback((bookId, quantity) =>
    runMutation(bookId, () => cartApi.updateCartItem(bookId, quantity)), [runMutation]);

  const removeItem = useCallback(bookId =>
    runMutation(bookId, () => cartApi.removeCartItem(bookId)), [runMutation]);

  const value = useMemo(() => ({
    cart,
    loading,
    error,
    isPending: bookId => pendingBookIds.includes(bookId),
    refresh,
    addItem,
    updateQuantity,
    removeItem,
  }), [cart, loading, error, pendingBookIds, refresh, addItem, updateQuantity, removeItem]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}

/**
 * Handler dùng chung cho mọi nút "Thêm vào giỏ":
 * - Guest -> chuyển tới /login, quay lại trang hiện tại sau khi đăng nhập.
 * - Admin -> không có giỏ hàng.
 * - Customer -> gọi API và báo kết quả.
 */
export function useAddToCart() {
  const { isAuthenticated, isCustomer } = useAuth();
  const { addItem, isPending } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const addToCart = useCallback(async (book, quantity = 1) => {
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để thêm sách vào giỏ.', 'info');
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!isCustomer) {
      showToast('Tài khoản quản trị không dùng giỏ hàng.', 'warning');
      return;
    }
    try {
      await addItem(book.id, quantity);
      showToast(`Đã thêm "${book.title}" vào giỏ.`);
    } catch (error) {
      showToast(error.message, 'danger');
    }
  }, [isAuthenticated, isCustomer, addItem, showToast, navigate, location]);

  return { addToCart, isAdding: isPending };
}
