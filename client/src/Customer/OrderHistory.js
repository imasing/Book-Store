import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Container, Spinner } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { listMyOrders } from '../services/api/orderApi';
import {
  CUSTOMER_FULFILLMENT_LABELS,
  PAYMENT_LABELS,
  PAYMENT_METHOD_LABELS,
  fulfillmentBadge,
} from '../constants/order';
import { formatAddress, formatCurrency, formatDate } from '../utils/format';

export default function OrderHistory() {
  const location = useLocation();
  const placedOrderId = location.state?.placedOrderId;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await listMyOrders());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Container className="store-page py-4 py-lg-5">
      <p className="eyebrow">TÀI KHOẢN KHÁCH HÀNG</p>
      <h1 className="page-title">Đơn hàng của tôi</h1>
      {placedOrderId && (
        <Alert variant="success" className="mt-3">
          Cảm ơn bạn! Đơn <strong>{placedOrderId}</strong> đã được tiếp nhận. Cửa hàng sẽ xác nhận và cập nhật trạng thái sớm.
        </Alert>
      )}
      <div className="customer-order-list mt-4">
        {loading && <div className="state-box"><Spinner animation="border" size="sm" /> Đang tải đơn hàng...</div>}
        {!loading && error && (
          <Alert variant="danger" className="d-flex justify-content-between align-items-center">
            <span>{error}</span>
            <Button size="sm" variant="outline-danger" onClick={load}>Thử lại</Button>
          </Alert>
        )}
        {!loading && !error && orders.length === 0 && (
          <div className="state-box">Bạn chưa có đơn hàng nào. <Link to="/">Khám phá sách</Link></div>
        )}
        {!loading && !error && orders.map(order => {
          const badge = fulfillmentBadge(order.fulfillmentStatus);
          return (
            <article className={`customer-order${order.id === placedOrderId ? ' customer-order-new' : ''}`} key={order.id}>
              <header className="customer-order-header">
                <div><span className="order-ref">Mã đơn</span><strong>{order.id}</strong></div>
                <Badge bg={badge.bg} text={badge.text}>
                  {CUSTOMER_FULFILLMENT_LABELS[order.fulfillmentStatus] || order.fulfillmentStatus}
                </Badge>
              </header>
              <div className="customer-order-books">
                {order.items.map(item => (
                  <div key={item.bookId}>
                    {/* Hiển thị theo snapshot của đơn, không tra lại catalog */}
                    {item.title}<span>x {item.quantity} · {formatCurrency(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <p className="customer-order-address">Giao tới: {order.shippingAddress?.recipientName} · {formatAddress(order.shippingAddress)}</p>
              <footer className="customer-order-footer">
                <span>
                  {formatDate(order.createdAt)} · {PAYMENT_METHOD_LABELS[order.paymentMethod]} · {PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}
                </span>
                <strong>{formatCurrency(order.total)}</strong>
              </footer>
            </article>
          );
        })}
      </div>
    </Container>
  );
}
