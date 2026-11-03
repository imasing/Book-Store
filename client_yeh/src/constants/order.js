/**
 * Trạng thái đơn hàng – phải đồng bộ với server (OrderLifecycle).
 * Giao vận (fulfillmentStatus) và thanh toán (paymentStatus) là 2 thuộc tính độc lập.
 */
export const FULFILLMENT_STATUSES = ['RECEIVED', 'CONFIRMED', 'HANDED_TO_CARRIER', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

export const FULFILLMENT_LABELS = {
  RECEIVED: 'Mới nhận',
  CONFIRMED: 'Đã xác nhận',
  HANDED_TO_CARRIER: 'Đã giao vận chuyển',
  IN_TRANSIT: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

/** Nhãn hiển thị cho khách hàng (giọng thân thiện hơn admin). */
export const CUSTOMER_FULFILLMENT_LABELS = {
  ...FULFILLMENT_LABELS,
  RECEIVED: 'Đã tiếp nhận',
  IN_TRANSIT: 'Đang vận chuyển',
};

/** State machine: chỉ admin được chuyển trạng thái, và chỉ theo các cạnh dưới đây. */
export const FULFILLMENT_TRANSITIONS = {
  RECEIVED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['HANDED_TO_CARRIER', 'CANCELLED'],
  HANDED_TO_CARRIER: ['IN_TRANSIT'],
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const PAYMENT_METHODS = { COD: 'COD', PREPAID: 'PREPAID' };

export const PAYMENT_METHOD_LABELS = {
  COD: 'Thanh toán khi nhận (COD)',
  PREPAID: 'Trả trước',
};

export const PAYMENT_LABELS = {
  UNPAID: 'Chưa thu tiền',
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán lỗi',
};

/** Trạng thái thanh toán ban đầu khi tạo đơn. */
export const INITIAL_PAYMENT_STATUS = { COD: 'UNPAID', PREPAID: 'PENDING' };

export function fulfillmentBadge(status) {
  switch (status) {
    case 'DELIVERED': return { bg: 'success' };
    case 'CANCELLED': return { bg: 'secondary' };
    case 'RECEIVED': return { bg: 'info', text: 'dark' };
    default: return { bg: 'warning', text: 'dark' };
  }
}

export function paymentBadge(status) {
  switch (status) {
    case 'PAID': return { bg: 'success' };
    case 'FAILED': return { bg: 'danger' };
    default: return { bg: 'light', text: 'dark' };
  }
}
