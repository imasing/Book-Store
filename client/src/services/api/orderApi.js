import http, { ApiError } from './httpClient';
import { nowIso, requireSession, validationError } from './mockGuards';
import { mockClearCart, mockGetRawCart } from './cartApi';
import { normalizeAddress, validateAddress } from './userApi';
import {
  FULFILLMENT_LABELS,
  FULFILLMENT_TRANSITIONS,
  INITIAL_PAYMENT_STATUS,
  PAYMENT_METHODS,
} from '../../constants/order';

const NOTE_MAX_LENGTH = 500;

/* ---- MOCK helper: server nên dùng counter collection / sequence atomic ---- */
async function nextOrderId() {
  const year = new Date().getFullYear();
  const prefix = `order-${year}-`;
  const { data: orders } = await http.get('/orders');
  const max = orders
    .filter(order => order.id.startsWith(prefix))
    .reduce((acc, order) => Math.max(acc, Number(order.id.slice(prefix.length)) || 0), 0);
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

async function getOrderOr404(orderId) {
  try {
    const { data } = await http.get(`/orders/${encodeURIComponent(orderId)}`);
    return data;
  } catch (error) {
    if (error.status === 404) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');
    throw error;
  }
}

function sortNewestFirst(orders) {
  return [...orders].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

/* ------------------------------------------------------------------ */
/* Customer                                                             */
/* ------------------------------------------------------------------ */

/**
 * [ENDPOINT] POST /api/orders  (auth: CUSTOMER)
 * body: { shippingAddress, paymentMethod: 'COD'|'PREPAID', note?, saveAsDefaultAddress? }
 * -> 201 { order }
 *
 * Luồng server (nên chạy trong 1 transaction MongoDB):
 *   1. Đọc cart của customer; rỗng -> 400 CART_EMPTY.
 *   2. Đọc giá/tên sách HIỆN TẠI từ catalog (không tin giá client gửi).
 *      Sách bị xóa/nháp/thể loại ẩn -> 409 BOOK_UNAVAILABLE (details.bookIds).
 *   3. Tạo snapshot items + shippingAddress, tính subtotal/total.
 *   4. fulfillmentStatus=RECEIVED; paymentStatus = COD ? UNPAID : PENDING.
 *   5. Làm rỗng cart; nếu saveAsDefaultAddress thì cập nhật user.defaultShippingAddress.
 * Nên hỗ trợ header Idempotency-Key để chống double-submit.
 */
export async function createOrder({ shippingAddress, paymentMethod, note = '', saveAsDefaultAddress = false }) {
  const user = requireSession('CUSTOMER');

  const addressErrors = validateAddress(shippingAddress);
  if (Object.keys(addressErrors).length) throw validationError(addressErrors, 'Vui lòng kiểm tra lại địa chỉ giao hàng.');
  if (!Object.values(PAYMENT_METHODS).includes(paymentMethod)) {
    throw validationError({ paymentMethod: 'Phương thức thanh toán không hợp lệ.' });
  }
  if (note.length > NOTE_MAX_LENGTH) throw validationError({ note: `Ghi chú tối đa ${NOTE_MAX_LENGTH} ký tự.` });

  // ---- MOCK ----
  const cart = await mockGetRawCart(user.id);
  if (!cart.items.length) throw new ApiError(400, 'CART_EMPTY', 'Giỏ hàng đang trống.');

  const [{ data: books }, { data: categories }] = await Promise.all([http.get('/books'), http.get('/categories')]);
  const unavailable = [];
  const items = cart.items.map(item => {
    const book = books.find(entry => entry.id === item.bookId);
    const category = categories.find(entry => entry.id === book?.categoryId);
    if (!book?.isPublished || !category?.isActive) {
      unavailable.push(item.bookId);
      return null;
    }
    return {
      bookId: book.id,
      title: book.title,
      author: book.author,
      unitPrice: book.price,
      quantity: item.quantity,
      lineTotal: book.price * item.quantity,
    };
  });
  if (unavailable.length) {
    throw new ApiError(409, 'BOOK_UNAVAILABLE', 'Một số sách trong giỏ không còn được bán. Vui lòng bỏ ra trước khi đặt hàng.', { bookIds: unavailable });
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const timestamp = nowIso();
  const address = normalizeAddress(shippingAddress);
  const { data: order } = await http.post('/orders', {
    id: await nextOrderId(),
    customerId: user.id,
    items,
    shippingAddress: address,
    paymentMethod,
    paymentStatus: INITIAL_PAYMENT_STATUS[paymentMethod],
    fulfillmentStatus: 'RECEIVED',
    note: note.trim(),
    subtotal,
    shippingFee: 0, // Chưa có chính sách phí ship (SystemDesign §8.3)
    total: subtotal,
    statusHistory: [{ status: 'RECEIVED', at: timestamp, by: user.id }],
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await mockClearCart(user.id);
  if (saveAsDefaultAddress) {
    await http.patch(`/users/${user.id}`, { defaultShippingAddress: address, updatedAt: timestamp });
  }
  return order;
  // ---- END MOCK ----
}

/**
 * [ENDPOINT] GET /api/orders  (auth: CUSTOMER)
 * -> 200 { items: Order[] }  chỉ đơn của chính customer, mới nhất trước.
 */
export async function listMyOrders() {
  const user = requireSession('CUSTOMER');
  // ---- MOCK ----
  const { data } = await http.get('/orders', { params: { customerId: user.id } });
  return sortNewestFirst(data);
  // ---- END MOCK ----
}

/**
 * [ENDPOINT] GET /api/orders/:orderId  (auth: CUSTOMER)
 * -> 200 { order } | 404 ORDER_NOT_FOUND (trả 404 cả khi đơn thuộc customer khác, tránh lộ thông tin)
 */
export async function getMyOrder(orderId) {
  const user = requireSession('CUSTOMER');
  // ---- MOCK ----
  const order = await getOrderOr404(orderId);
  if (order.customerId !== user.id) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');
  return order;
  // ---- END MOCK ----
}

/* ------------------------------------------------------------------ */
/* Admin                                                                */
/* ------------------------------------------------------------------ */

/**
 * [ENDPOINT] GET /api/admin/orders  (auth: ADMIN)
 * query (giai đoạn sau): ?q=&fulfillmentStatus=&paymentMethod=&page=&limit=
 * -> 200 { items: (Order & { customer: { id, fullName, email, phone } })[] }
 */
export async function listAdminOrders() {
  requireSession('ADMIN');
  // ---- MOCK ----
  const [{ data: orders }, { data: users }] = await Promise.all([http.get('/orders'), http.get('/users')]);
  return sortNewestFirst(orders).map(order => {
    const customer = users.find(user => user.id === order.customerId);
    return {
      ...order,
      customer: customer
        ? { id: customer.id, fullName: customer.fullName, email: customer.email, phone: customer.phone }
        : { id: order.customerId, fullName: order.shippingAddress?.recipientName || 'Khách đã xóa', email: '', phone: '' },
    };
  });
  // ---- END MOCK ----
}

/**
 * [ENDPOINT] PATCH /api/admin/orders/:orderId/status  (auth: ADMIN)
 * body: { status, reason? } -> 200 { order }
 * lỗi: 404 ORDER_NOT_FOUND, 409 INVALID_STATUS_TRANSITION (xem FULFILLMENT_TRANSITIONS)
 * Side effect: COD chuyển DELIVERED -> paymentStatus=PAID. Ghi statusHistory.
 * Nên dùng optimistic concurrency (so sánh status hiện tại trong điều kiện update).
 */
export async function updateOrderStatus(orderId, status, reason = '') {
  const admin = requireSession('ADMIN');
  // ---- MOCK ----
  const order = await getOrderOr404(orderId);
  const allowed = FULFILLMENT_TRANSITIONS[order.fulfillmentStatus] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(409, 'INVALID_STATUS_TRANSITION',
      `Không thể chuyển từ "${FULFILLMENT_LABELS[order.fulfillmentStatus]}" sang "${FULFILLMENT_LABELS[status] || status}".`);
  }
  const timestamp = nowIso();
  const patch = {
    fulfillmentStatus: status,
    statusHistory: [...(order.statusHistory || []), { status, at: timestamp, by: admin.id, reason: reason || undefined }],
    updatedAt: timestamp,
  };
  if (status === 'DELIVERED' && order.paymentMethod === 'COD') patch.paymentStatus = 'PAID';
  const { data } = await http.patch(`/orders/${encodeURIComponent(orderId)}`, patch);
  return data;
  // ---- END MOCK ----
}

/**
 * [ENDPOINT] PATCH /api/admin/orders/:orderId/payment-status  (auth: ADMIN)
 * body: { paymentStatus: 'PAID' | 'FAILED' } -> 200 { order }
 * MVP: admin xác nhận thủ công đơn PREPAID (chưa có provider/webhook).
 * Chỉ cho phép khi paymentMethod=PREPAID và paymentStatus hiện tại là PENDING/FAILED.
 * Khi có provider: trạng thái này do webhook đã xác thực chữ ký cập nhật, KHÔNG dựa vào redirect.
 */
export async function updatePaymentStatus(orderId, paymentStatus) {
  requireSession('ADMIN');
  if (!['PAID', 'FAILED'].includes(paymentStatus)) {
    throw validationError({ paymentStatus: 'Trạng thái thanh toán không hợp lệ.' });
  }
  // ---- MOCK ----
  const order = await getOrderOr404(orderId);
  if (order.paymentMethod !== 'PREPAID' || !['PENDING', 'FAILED'].includes(order.paymentStatus)) {
    throw new ApiError(409, 'INVALID_PAYMENT_TRANSITION', 'Không thể cập nhật thanh toán cho đơn này.');
  }
  if (order.fulfillmentStatus === 'CANCELLED') {
    throw new ApiError(409, 'INVALID_PAYMENT_TRANSITION', 'Đơn đã hủy, không thể cập nhật thanh toán.');
  }
  const { data } = await http.patch(`/orders/${encodeURIComponent(orderId)}`, { paymentStatus, updatedAt: nowIso() });
  return data;
  // ---- END MOCK ----
}
