import React from 'react';
import { Badge, Container } from 'react-bootstrap';
import { CUSTOMER_ORDERS, BOOKS } from '../data/bookstoreData';

const statusLabels = {
  IN_TRANSIT: 'Đang vận chuyển',
  DELIVERED: 'Đã giao',
  RECEIVED: 'Đã tiếp nhận',
};

export default function OrderHistory() {
  return (
    <Container className="store-page py-4 py-lg-5">
      <p className="eyebrow">TÀI KHOẢN KHÁCH HÀNG</p>
      <h1 className="page-title">Đơn hàng của tôi</h1>
      <div className="customer-order-list mt-4">
        {CUSTOMER_ORDERS.map(order => (
          <article className="customer-order" key={order.id}>
            <header className="customer-order-header">
              <div><span className="order-ref">Mã đơn</span><strong>{order.id}</strong></div>
              <Badge bg={order.fulfillmentStatus === 'DELIVERED' ? 'success' : 'warning'} text={order.fulfillmentStatus === 'DELIVERED' ? undefined : 'dark'}>
                {statusLabels[order.fulfillmentStatus] || order.fulfillmentStatus}
              </Badge>
            </header>
            <div className="customer-order-books">
              {order.items.map(item => {
                const book = BOOKS.find(entry => entry.id === item.bookId);
                return book ? <div key={item.bookId}>{book.title}<span>x {item.quantity}</span></div> : null;
              })}
            </div>
            <footer className="customer-order-footer">
              <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')} · {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận' : 'Đã thanh toán trước'}</span>
              <strong>{order.total.toLocaleString('vi-VN')}₫</strong>
            </footer>
          </article>
        ))}
      </div>
    </Container>
  );
}