import React, { useState } from 'react';
import { Alert, Button, Container, Form, Spinner } from 'react-bootstrap';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { validateRegisterInput } from '../services/api/authApi';

const INITIAL_FORM = { fullName: '', email: '', phone: '', password: '', confirmPassword: '' };

function redirectPathFor(user, from) {
  if (user.role === 'ADMIN') return from?.pathname?.startsWith('/admin') ? from.pathname : '/admin';
  if (from?.pathname && !from.pathname.startsWith('/admin')) return `${from.pathname}${from.search || ''}`;
  return '/';
}

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user && !submitting) return <Navigate to={redirectPathFor(user, from)} replace />;

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    if (!isRegister) {
      const next = {};
      if (!form.email.trim()) next.email = 'Vui lòng nhập email.';
      if (!form.password) next.password = 'Vui lòng nhập mật khẩu.';
      return next;
    }
    const next = validateRegisterInput(form);
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Mật khẩu nhập lại không khớp.';
    return next;
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const loggedIn = isRegister
        ? await register(form)
        : await login({ email: form.email, password: form.password });
      showToast(isRegister ? 'Tạo tài khoản thành công!' : `Xin chào, ${loggedIn.fullName}!`);
      navigate(redirectPathFor(loggedIn, from), { replace: true });
    } catch (error) {
      if (error.details) setErrors(error.details);
      setFormError(error.message);
      setSubmitting(false);
    }
  };

  const field = (name, label, props = {}) => (
    <Form.Group className="mb-3">
      <Form.Label htmlFor={`auth-${name}`}>{label}</Form.Label>
      <Form.Control
        id={`auth-${name}`}
        value={form[name]}
        isInvalid={Boolean(errors[name])}
        onChange={event => updateField(name, event.target.value)}
        {...props}
      />
      <Form.Control.Feedback type="invalid">{errors[name]}</Form.Control.Feedback>
    </Form.Group>
  );

  return (
    <Container className="store-page py-5">
      <section className="auth-card">
        <p className="eyebrow">{isRegister ? 'TẠO TÀI KHOẢN' : 'CHÀO MỪNG TRỞ LẠI'}</p>
        <h1 className="page-title">{isRegister ? 'Đăng ký' : 'Đăng nhập'}</h1>
        {from && !isRegister && <p className="text-muted small">Vui lòng đăng nhập để tiếp tục.</p>}
        {formError && <Alert variant="danger" className="small">{formError}</Alert>}
        <Form noValidate onSubmit={handleSubmit}>
          {isRegister && field('fullName', 'Họ và tên', { autoComplete: 'name' })}
          {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
          {isRegister && field('phone', 'Số điện thoại (không bắt buộc)', { type: 'tel', autoComplete: 'tel' })}
          {field('password', 'Mật khẩu', { type: 'password', autoComplete: isRegister ? 'new-password' : 'current-password' })}
          {isRegister && field('confirmPassword', 'Nhập lại mật khẩu', { type: 'password', autoComplete: 'new-password' })}
          <Button type="submit" variant="success" className="w-100 mt-2" disabled={submitting}>
            {submitting ? <Spinner animation="border" size="sm" /> : (isRegister ? 'Tạo tài khoản' : 'Đăng nhập')}
          </Button>
        </Form>
        <p className="auth-switch">
          {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
          <Link to={isRegister ? '/login' : '/register'} state={location.state}>
            {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
          </Link>
        </p>
      </section>
    </Container>
  );
}
