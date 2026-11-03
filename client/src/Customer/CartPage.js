import React from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { ArrowRight, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BOOKS, CART_ITEMS } from '../data/bookstoreData';

export default function CartPage() {
  const cartItems = CART_ITEMS.map(item => ({
    ...item,
    book: BOOKS.find(book => book.id === item.bookId),
  })).filter(item => item.book);
  const subtotal = cartItems.reduce((sum, item) => sum + item.book.price * item.quantity, 0);

  return (
    <Container className="store-page py-4 py-lg-5">
      <p className="eyebrow">GIỎ HÀNG CỦA BẠN</p>
      <h1 className="page-title">Những cuốn sách sắp về nhà</h1>
      <Row className="gx-lg-5 gy-4 mt-1">
        <Col lg={8}>
          <div className="cart-list">
            {cartItems.map(item => (
              <article className="cart-item" key={item.book.id}>
                <div className="cart-mini-cover" style={{ '--cover-color': item.book.coverColor }}>
                  <span>{item.book.title}</span>
                </div>
                <div className="cart-item-info">
                  <span className="book-category">{item.book.categoryName}</span>
                  <h2>{item.book.title}</h2>
                  <p>{item.book.author}</p>
                  <strong>{item.book.price.toLocaleString('vi-VN')}₫</strong>
                </div>
                <div className="cart-item-controls">
                  <input className="form-control" aria-label={`Số lượng ${item.book.title}`} type="number" min="1" defaultValue={item.quantity} />
                  <Button variant="light" aria-label={`Xóa ${item.book.title}`}><Trash2 size={16} /></Button>
                </div>
              </article>
            ))}
          </div>
          <Link to="/" className="back-link mt-4 d-inline-flex">← Tiếp tục xem sách</Link>
        </Col>
        <Col lg={4}>
          <aside className="summary-panel">
            <h2>Tóm tắt đơn hàng</h2>
            <div className="summary-line"><span>Tạm tính</span><strong>{subtotal.toLocaleString('vi-VN')}₫</strong></div>
            <div className="summary-line"><span>Phí vận chuyển</span><span>Tính khi xác nhận</span></div>
            <div className="summary-total"><span>Tổng cộng</span><strong>{subtotal.toLocaleString('vi-VN')}₫</strong></div>
            <Button variant="success" className="w-100 summary-checkout">Tiến hành đặt hàng <ArrowRight size={17} /></Button>
            <p className="summary-note">Phương thức thanh toán và địa chỉ giao hàng sẽ được chọn ở bước tiếp theo.</p>
          </aside>
        </Col>
      </Row>
    </Container>
  );
}