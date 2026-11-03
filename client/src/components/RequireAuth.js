import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

/**
 * Chặn route theo đăng nhập/role ở phía UI. Đây chỉ là trải nghiệm người dùng —
 * server vẫn phải kiểm tra quyền trên từng endpoint.
 */
export default function RequireAuth({ role, children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <Container className="store-page py-5 text-center"><Spinner animation="border" size="sm" /> Đang kiểm tra phiên đăng nhập...</Container>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} replace />;
  }
  return children || <Outlet />;
}
