import http from './httpClient';

/**
 * POST /api/orders -> Order
 * body: { shippingAddress, paymentMethod, note?, saveAsDefaultAddress? }
 * Giá/tổng tiền do server tính từ giỏ hàng. `idempotencyKey` giữ nguyên giữa các lần thử lại
 * của cùng một lần checkout để không tạo trùng đơn.
 */
export async function createOrder({ shippingAddress, paymentMethod, note = '', saveAsDefaultAddress = false }, { idempotencyKey } = {}) {
  const { data } = await http.post(
    '/orders',
    { shippingAddress, paymentMethod, note, saveAsDefaultAddress },
    idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined,
  );
  return data;
}

/** GET /api/orders -> Order[] của customer đang đăng nhập */
export async function listMyOrders() {
  const { data } = await http.get('/orders');
  return data;
}

/** GET /api/orders/:orderId -> Order */
export async function getMyOrder(orderId) {
  const { data } = await http.get(`/orders/${encodeURIComponent(orderId)}`);
  return data;
}

/** GET /api/admin/orders -> (Order & { customer })[] */
export async function listAdminOrders() {
  const { data } = await http.get('/admin/orders');
  return data;
}

/** PATCH /api/admin/orders/:orderId/status  body: { status, reason? } -> Order */
export async function updateOrderStatus(orderId, status, reason = '') {
  const { data } = await http.patch(`/admin/orders/${encodeURIComponent(orderId)}/status`, { status, reason: reason || undefined });
  return data;
}

/** PATCH /api/admin/orders/:orderId/payment-status  body: { paymentStatus } -> Order */
export async function updatePaymentStatus(orderId, paymentStatus) {
  const { data } = await http.patch(`/admin/orders/${encodeURIComponent(orderId)}/payment-status`, { paymentStatus });
  return data;
}
