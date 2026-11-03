/**
 * Lưu phiên đăng nhập phía client.
 *
 * MOCK: token hiện là chuỗi giả `mock-token-<userId>`. Khi có server thật, khuyến nghị
 * dùng httpOnly cookie (khi đó file này chỉ còn cache thông tin user để render UI).
 */
const SESSION_KEY = 'bookstore.session';

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
