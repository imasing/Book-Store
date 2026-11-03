import axios from 'axios';
import { getSession } from '../session';

/**
 * HTTP client dùng chung cho toàn bộ service.
 *
 * Hiện tại baseURL trỏ vào json-server (DB tạm: ../db.json, chạy bằng `npm run mock-api`).
 * Khi có Express server: đặt REACT_APP_API_URL=http://localhost:8888/api và thay phần
 * "MOCK" trong từng service bằng một lời gọi duy nhất tới endpoint tương ứng
 * (xem APIContract.md ở root).
 */
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9999';

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
      // Format lỗi chuẩn mà server cần trả về: { error: { code, message, details } }
      const payload = data?.error || {};
      return Promise.reject(new ApiError(
        status,
        payload.code || (status === 404 ? 'NOT_FOUND' : 'HTTP_ERROR'),
        payload.message || 'Yêu cầu không thành công.',
        payload.details,
      ));
    }
    return Promise.reject(new ApiError(0, 'NETWORK_ERROR', 'Không kết nối được máy chủ. Hãy kiểm tra API đang chạy.'));
  },
);

export default http;
