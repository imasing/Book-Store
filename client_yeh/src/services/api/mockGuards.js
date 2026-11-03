import { ApiError } from './httpClient';
import { getSession } from '../session';

/**
 * Các hàm giả lập middleware của server (authenticate / authorize / validate).
 * Chỉ dùng trong giai đoạn mock json-server. Server thật PHẢI tự kiểm tra lại toàn bộ,
 * không được tin dữ liệu hay quyền gửi từ client.
 */
export function requireSession(role) {
  const session = getSession();
  if (!session?.user) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập để tiếp tục.');
  }
  if (role && session.user.role !== role) {
    throw new ApiError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.');
  }
  return session.user;
}

export function validationError(details, message = 'Dữ liệu không hợp lệ.') {
  return new ApiError(400, 'VALIDATION_ERROR', message, details);
}

export function nowIso() {
  return new Date().toISOString();
}

export function randomSuffix(length = 4) {
  return Math.random().toString(36).slice(2, 2 + length);
}

/** Bỏ các field nhạy cảm trước khi trả user ra ngoài (server cũng phải làm vậy). */
export function toPublicUser(user) {
  if (!user) return null;
  const { password, passwordHash, ...rest } = user;
  return rest;
}
