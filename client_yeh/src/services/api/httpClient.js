import axios from 'axios';
import { clearSession, getSession } from '../session';

/**
 * HTTP client dùng chung cho toàn bộ service – gọi Express API (server_yeh).
 * Cấu hình bằng REACT_APP_API_URL (xem client_yeh/.env.example).
 */
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9999/api';

/** Phát ra khi server báo phiên đăng nhập không còn hiệu lực (AuthContext lắng nghe). */
export const SESSION_EXPIRED_EVENT = 'bookstore:session-expired';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use(config => {
  const session = getSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

http.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const { status, data } = error.response;
      // Format lỗi của server: { error: { code, message, details } } (APIContract §1.1)
      const payload = data?.error || {};
      const apiError = new ApiError(
        status,
        payload.code || (status === 404 ? 'NOT_FOUND' : 'HTTP_ERROR'),
        payload.message || 'Yêu cầu không thành công.',
        payload.details,
      );
      if (status === 401 && apiError.code === 'UNAUTHENTICATED' && getSession()) {
        clearSession();
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }
      return Promise.reject(apiError);
    }
    return Promise.reject(new ApiError(0, 'NETWORK_ERROR', 'Không kết nối được máy chủ. Hãy kiểm tra API đang chạy.'));
  },
);

export default http;
