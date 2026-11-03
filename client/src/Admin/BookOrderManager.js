import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Spinner, Table } from 'react-bootstrap';
import { listAdminOrders, updateOrderStatus, updatePaymentStatus } from '../services/api/orderApi';
import {
  FULFILLMENT_LABELS,
  FULFILLMENT_STATUSES,
  FULFILLMENT_TRANSITIONS,
  PAYMENT_LABELS,
  fulfillmentBadge,
  paymentBadge,
} from '../constants/order';
import { useToast } from '../context/ToastContext';
import { formatAddress, formatCurrency, formatDate, normalizeSearch } from '../utils/format';

export default function BookOrderManager() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setOrders(await listAdminOrders());
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleOrders = useMemo(() => {
    const term = normalizeSearch(keyword);
    return orders
      .filter(order => statusFilter === 'all' || order.fulfillmentStatus === statusFilter)
      .filter(order => paymentFilter === 'all' || order.paymentMethod === paymentFilter)
      .filter(order => !term || normalizeSearch(`${order.id} ${order.customer.fullName} ${order.customer.email} ${order.customer.phone}`).includes(term));
  }, [orders, keyword, statusFilter, paymentFilter]);

  /** Cập nhật 1 dòng bằng bản server trả về, giữ nguyên thông tin customer đã join. */
  const replaceOrder = updated => {
    setOrders(prev => prev.map(order => (order.id === updated.id ? { ...order, ...updated } : order)));
  };

  const handleStatusChange = async (order, nextStatus) => {
    if (nextStatus === order.fulfillmentStatus) return;
    let reason = '';
    if (nextStatus === 'CANCELLED') {
      reason = window.prompt(`Hủy đơn ${order.id}? Nhập lý do (không bắt buộc):`, '');
      if (reason === null) return;
    }
    setBusyOrderId(order.id);
    try {
      replaceOrder(await updateOrderStatus(order.id, nextStatus, reason));
      showToast(`Đơn ${order.id}: ${FULFILLMENT_LABELS[nextStatus]}.`);
    } catch (error) {
      showToast(error.message, 'danger');
      if (error.code === 'INVALID_STATUS_TRANSITION') load(); // dữ liệu có thể đã cũ
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleConfirmPayment = async order => {
    if (!window.confirm(`Xác nhận đã nhận đủ ${formatCurrency(order.total)} cho đơn ${order.id}?`)) return;
    setBusyOrderId(order.id);
    try {
      replaceOrder(await updatePaymentStatus(order.id, 'PAID'));
      showToast(`Đơn ${order.id}: đã xác nhận thanh toán.`);
    } catch (error) {
      showToast(error.message, 'danger');
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div><p className="eyebrow">VẬN HÀNH CỬA HÀNG</p><h1>Đơn hàng</h1></div>
        <span className="admin-count">
          {String(visibleOrders.length).padStart(2, '0')} / {orders.length} đơn
          <Button variant="link" size="sm" onClick={load} disabled={loading}>Làm mới</Button>
        </span>
      </div>
      <div className="admin-toolbar order-toolbar">
        <input className="form-control" placeholder="Tìm mã đơn hoặc khách hàng" value={keyword} onChange={event => setKeyword(event.target.value)} />
        <select className="form-select" aria-label="Lọc trạng thái" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          {FULFILLMENT_STATUSES.map(status => <option key={status} value={status}>{FULFILLMENT_LABELS[status]}</option>)}
        </select>
        <select className="form-select" aria-label="Lọc thanh toán" value={paymentFilter} onChange={event => setPaymentFilter(event.target.value)}>
          <option value="all">Tất cả thanh toán</option>
          <option value="COD">COD</option>
          <option value="PREPAID">Trả trước</option>
        </select>
      </div>
      {loadError && (
        <Alert variant="danger" className="d-flex justify-content-between align-items-center">
          <span>{loadError}</span><Button size="sm" variant="outline-danger" onClick={load}>Thử lại</Button>
        </Alert>
      )}
      <div className="admin-table-wrap">
        <Table responsive hover className="admin-table align-middle">
          <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày đặt</th><th>Số sách</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8}><Spinner animation="border" size="sm" /> Đang tải...</td></tr>}
            {!loading && visibleOrders.length === 0 && <tr><td colSpan={8}>Không có đơn hàng phù hợp.</td></tr>}
            {!loading && visibleOrders.map(order => {
              const statusBadge = fulfillmentBadge(order.fulfillmentStatus);
              const payBadge = paymentBadge(order.paymentStatus);
              const nextStatuses = FULFILLMENT_TRANSITIONS[order.fulfillmentStatus] || [];
              const busy = busyOrderId === order.id;
              const canConfirmPayment = order.paymentMethod === 'PREPAID'
                && ['PENDING', 'FAILED'].includes(order.paymentStatus)
                && order.fulfillmentStatus !== 'CANCELLED';
              const expanded = expandedId === order.id;
              return (
                <React.Fragment key={order.id}>
                  <tr>
                    <td>
                      <button type="button" className="order-id-toggle" onClick={() => setExpandedId(expanded ? null : order.id)} aria-expanded={expanded}>
                        <strong>{order.id}</strong><small>{expanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}</small>
                      </button>
                    </td>
                    <td><strong>{order.customer.fullName}</strong><small>{order.customer.email}</small></td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>
                      <small className="mt-0 mb-1">{order.paymentMethod === 'COD' ? 'COD' : 'Trả trước'}</small>
                      <Badge bg={payBadge.bg} text={payBadge.text}>{PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}</Badge>
                      {canConfirmPayment && (
                        <Button variant="link" size="sm" className="p-0 d-block" disabled={busy} onClick={() => handleConfirmPayment(order)}>Xác nhận đã thu</Button>
                      )}
                    </td>
                    <td><Badge bg={statusBadge.bg} text={statusBadge.text}>{FULFILLMENT_LABELS[order.fulfillmentStatus]}</Badge></td>
                    <td>
                      {nextStatuses.length === 0 ? (
                        <span className="text-muted small">Đã kết thúc</span>
                      ) : (
                        <select
                          className="form-select"
                          aria-label={`Trạng thái ${order.id}`}
                          value={order.fulfillmentStatus}
                          disabled={busy}
                          onChange={event => handleStatusChange(order, event.target.value)}
                        >
                          <option value={order.fulfillmentStatus}>{FULFILLMENT_LABELS[order.fulfillmentStatus]}</option>
                          {nextStatuses.map(status => <option key={status} value={status}>→ {FULFILLMENT_LABELS[status]}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="order-detail-row">
                      <td colSpan={8}>
                        <div className="order-detail">
                          <div>
                            <p className="eyebrow mb-2">SÁCH</p>
                            {order.items.map(item => (
                              <div key={item.bookId} className="order-detail-line">
                                <span>{item.title} <small className="d-inline">x {item.quantity} · {formatCurrency(item.unitPrice)}</small></span>
                                <span>{formatCurrency(item.lineTotal)}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <p className="eyebrow mb-2">GIAO HÀNG</p>
                            <div>{order.shippingAddress?.recipientName} · {order.shippingAddress?.phone}</div>
                            <div>{formatAddress(order.shippingAddress)}</div>
                            {order.note && <div className="mt-2"><em>Ghi chú: {order.note}</em></div>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </Table>
      </div>
    </section>
  );
}
