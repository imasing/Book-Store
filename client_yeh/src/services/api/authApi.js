import http, { ApiError } from './httpClient';
import { getSession, saveSession, clearSession } from '../session';
import { nowIso, randomSuffix, toPublicUser, validationError, requireSession } from './mockGuards';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(0|\+84)\d{9}$/;

export function validateRegisterInput({ fullName, email, phone, password }) {
  const errors = {};
  if (!fullName?.trim()) errors.fullName = 'Vui lòng nhập họ tên.';
  if (!EMAIL_PATTERN.test(email || '')) errors.email = 'Email không hợp lệ.';
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = 'Số điện thoại không hợp lệ.';
  if (!password || password.length < 6) errors.password = 'Mật khẩu tối thiểu 6 ký tự.';
  return errors;
}

/**
 * [ENDPOINT] POST /api/auth/login
 * body: { email, password } -> 200 { token, user }
 * lỗi: 400 VALIDATION_ERROR, 401 INVALID_CREDENTIALS, 403 ACCOUNT_DISABLED
 */
export async function login({ email, password }) {
  if (!EMAIL_PATTERN.test(email || '') || !password) {
    throw validationError({ email: 'Nhập email và mật khẩu.' });
  }
  // ---- MOCK (server: tìm user theo email, so sánh bcrypt hash, ký JWT/tạo session) ----
  const { data } = await http.get('/users', { params: { email: email.trim().toLowerCase() } });
  const user = data[0];
  if (!user || user.password !== password) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'ACCOUNT_DISABLED', 'Tài khoản đã bị khóa.');
  }
  const session = { token: `mock-token-${user.id}`, user: toPublicUser(user) };
  // ---- END MOCK ----
  saveSession(session);
  return session;
}

/**
 * [ENDPOINT] POST /api/auth/register
 * body: { fullName, email, phone?, password } -> 201 { token, user }  (role luôn = CUSTOMER)
 * lỗi: 400 VALIDATION_ERROR, 409 EMAIL_TAKEN
 */
export async function register(input) {
  const errors = validateRegisterInput(input);
  if (Object.keys(errors).length) throw validationError(errors);

  const email = input.email.trim().toLowerCase();
  // ---- MOCK (server: unique index trên email, hash password, tạo cart rỗng) ----
  const { data: existing } = await http.get('/users', { params: { email } });
  if (existing.length) {
    throw new ApiError(409, 'EMAIL_TAKEN', 'Email đã được sử dụng.', { email: 'Email đã được sử dụng.' });
  }
  const timestamp = nowIso();
  const { data: user } = await http.post('/users', {
    id: `user-customer-${Date.now().toString(36)}${randomSuffix(3)}`,
    fullName: input.fullName.trim(),
    email,
    password: input.password, // MOCK: plaintext. Server phải lưu passwordHash (bcrypt/argon2).
    phone: input.phone?.trim() || '',
    role: 'CUSTOMER',
    defaultShippingAddress: null,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  const session = { token: `mock-token-${user.id}`, user: toPublicUser(user) };
  // ---- END MOCK ----
  saveSession(session);
  return session;
}

/**
 * [ENDPOINT] GET /api/auth/me  (auth)
 * -> 200 { user }  | 401 nếu token hết hạn/không hợp lệ
 */
export async function fetchCurrentUser() {
  const sessionUser = requireSession();
  // ---- MOCK ----
  try {
    const { data } = await http.get(`/users/${sessionUser.id}`);
    if (!data.isActive) throw new ApiError(401, 'UNAUTHENTICATED', 'Phiên đăng nhập không còn hiệu lực.');
    const user = toPublicUser(data);
    saveSession({ ...getSession(), user });
    return user;
  } catch (error) {
    if (error.status === 404) throw new ApiError(401, 'UNAUTHENTICATED', 'Phiên đăng nhập không còn hiệu lực.');
    throw error;
  }
  // ---- END MOCK ----
}

/**
 * [ENDPOINT] POST /api/auth/logout  (auth) -> 204
 * Server: thu hồi session/refresh token, xóa cookie.
 */
export async function logout() {
  clearSession();
}
