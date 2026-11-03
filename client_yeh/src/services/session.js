/**
 * Lưu phiên đăng nhập phía client.
 *
 * Token là JWT do server cấp (login/register). Có thể chuyển sang httpOnly cookie để an toàn
 * hơn trước XSS (khi đó file này chỉ còn cache thông tin user để render UI).
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
