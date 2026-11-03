import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../services/api/authApi';
import { updateMyProfile } from '../services/api/userApi';
import { getSession } from '../services/session';
import { SESSION_EXPIRED_EVENT } from '../services/api/httpClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession()?.user || null);
  const [initializing, setInitializing] = useState(Boolean(getSession()));

  // Khi mở app: xác thực lại phiên đã lưu (GET /api/auth/me).
  useEffect(() => {
    if (!getSession()) return;
    let cancelled = false;
    authApi.fetchCurrentUser()
      .then(fresh => { if (!cancelled) setUser(fresh); })
      .catch(error => {
        if (cancelled) return;
        // 401: httpClient đã xóa session; lỗi mạng: giữ user đã cache để thử lại sau.
        if (error.status === 401) setUser(null);
      })
      .finally(() => { if (!cancelled) setInitializing(false); });
    return () => { cancelled = true; };
  }, []);

  // Token hết hạn/bị thu hồi giữa chừng -> đưa UI về trạng thái chưa đăng nhập.
  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  const login = useCallback(async credentials => {
    const session = await authApi.login(credentials);
    setUser(session.user);
    return session.user;
  }, []);

  const register = useCallback(async input => {
    const session = await authApi.register(input);
    setUser(session.user);
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async patch => {
    const updated = await updateMyProfile(patch);
    setUser(updated);
    return updated;
  }, []);

  /** Đồng bộ lại user sau các thao tác server có side-effect (vd: lưu địa chỉ khi đặt đơn). */
  const refreshUser = useCallback(async () => {
    const fresh = await authApi.fetchCurrentUser();
    setUser(fresh);
    return fresh;
  }, []);

  const value = useMemo(() => ({
    user,
    initializing,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'ADMIN',
    isCustomer: user?.role === 'CUSTOMER',
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  }), [user, initializing, login, register, logout, updateProfile, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
