import http from './httpClient';
import { getSession, saveSession, clearSession } from '../session';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(0|\+84)\d{9}$/;

/** Validate trước khi gửi để báo lỗi ngay trên form (server vẫn validate lại). */
export function validateRegisterInput({ fullName, email, phone, password }) {
  const errors = {};
  if (!fullName?.trim()) errors.fullName = 'Vui lòng nhập họ tên.';
  if (!EMAIL_PATTERN.test(email || '')) errors.email = 'Email không hợp lệ.';
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = 'Số điện thoại không hợp lệ.';
  if (!password || password.length < 6) errors.password = 'Mật khẩu tối thiểu 6 ký tự.';
  return errors;
}

/** POST /api/auth/login -> { token, user } */
export async function login({ email, password }) {
  const { data } = await http.post('/auth/login', { email: email.trim(), password });
  saveSession(data);
  return data;
}

/** POST /api/auth/register -> { token, user } */
export async function register({ fullName, email, phone, password }) {
  const { data } = await http.post('/auth/register', {
    fullName: fullName.trim(),
    email: email.trim(),
    phone: phone?.trim() || '',
    password,
  });
  saveSession(data);
  return data;
}

/** GET /api/auth/me -> { user } */
export async function fetchCurrentUser() {
  const { data } = await http.get('/auth/me');
  saveSession({ ...getSession(), user: data.user });
  return data.user;
}

/** POST /api/auth/logout -> 204. Luôn xóa session cục bộ kể cả khi request lỗi. */
export async function logout() {
  try {
    if (getSession()) await http.post('/auth/logout');
  } catch {
    // token đã hết hạn/không kết nối được – vẫn đăng xuất phía client
  } finally {
    clearSession();
  }
}
