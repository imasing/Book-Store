import React, { useEffect, useState } from 'react';
import { Alert, Button, Col, Container, Row, Spinner } from 'react-bootstrap';
import { ArrowRight, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';
import { MAX_QUANTITY_PER_ITEM } from '../services/api/cartApi';

function CartLine({ item }) {
  const { updateQuantity, removeItem, isPending } = useCart();
  const { showToast } = useToast();
  const [draft, setDraft] = useState(String(item.quantity));
  const pending = isPending(item.bookId);

  useEffect(() => { setDraft(String(item.quantity)); }, [item.quantity]);

  // Chỉ gọi API khi rời ô nhập/nhấn Enter để tránh gửi request mỗi phím gõ.
  const commitQuantity = async () => {
    const next = Number(draft);
    if (!Number.isInteger(next) || next < 1 || next > MAX_QUANTITY_PER_ITEM) {
      showToast(`Số lượng phải từ 1 đến ${MAX_QUANTITY_PER_ITEM}.`, 'warning');
      setDraft(String(item.quantity));
      return;
    }
    if (next === item.quantity) return;
    try {
      await updateQuantity(item.bookId, next);
    } catch (error) {
      showToast(error.message, 'danger');
      setDraft(String(item.quantity));
    }
  };

  const handleRemove = async () => {
    try {
      await removeItem(item.bookId);
      showToast(`Đã bỏ "${item.book?.title || 'sách'}" khỏi giỏ.`, 'info');
    } catch (error) {
      showToast(error.message, 'danger');
    }
  };

  const title = item.book?.title || 'Sách không còn tồn tại';

  return (
    <article className={`cart-item${item.available ? '' : ' cart-item-unavailable'}`}>
      <div className="cart-mini-cover" style={{ '--cover-color': item.book?.coverColor || '#9aa19a' }}>
        <span>{title}</span>
      </div>
      <div className="cart-item-info">
        <span className="book-category">{item.book?.categoryName}</span>
        <h2>{item.book ? <Link to={`/books/${item.bookId}`}>{title}</Link> : title}</h2>
        <p>{item.book?.author}</p>
        {item.available
          ? <strong>{formatCurrency(item.book.price)}</strong>
          : <span className="text-danger small">Sách hiện không còn được bán — vui lòng bỏ khỏi giỏ.</span>}
      </div>
      <div className="cart-item-controls">
        <input
          className="form-control"
          aria-label={`Số lượng ${title}`}
          type="number"
          min="1"
          max={MAX_QUANTITY_PER_ITEM}
          value={draft}
          disabled={pending || !item.available}
          onChange={event => setDraft(event.target.value)}
          onBlur={commitQuantity}
          onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}
        />
        <Button variant="light" aria-label={`Xóa ${title}`} disabled={pending} onClick={handleRemove}>
          {pending ? <Spinner animation="border" size="sm" /> : <Trash2 size={16} />}
        </Button>
      </div>
    </article>
  );
}

export default function CartPage() {
  const { cart, loading, error, refresh } = useCart();
  const navigate = useNavigate();
  const isEmpty = cart.items.length === 0;

  return (
    <Container className="store-page py-4 py-lg-5">
      <p className="eyebrow">GIỎ HÀNG CỦA BẠN</p>
      <h1 className="page-title">Những cuốn sách sắp về nhà</h1>
      {error && (
        <Alert variant="danger" className="mt-3 d-flex justify-content-between align-items-center">
          <span>{error.message}</span>
          <Button size="sm" variant="outline-danger" onClick={refresh}>Thử lại</Button>
        </Alert>
      )}
      <Row className="gx-lg-5 gy-4 mt-1">
        <Col lg={8}>
          {loading && isEmpty && <div className="state-box"><Spinner animation="border" size="sm" /> Đang tải giỏ hàng...</div>}
          {!loading && isEmpty && !error && (
            <div className="state-box">Giỏ hàng đang trống. Hãy chọn vài cuốn sách bạn thích nhé.</div>
          )}
          {!isEmpty && (
            <div className="cart-list">
              {cart.items.map(item => <CartLine key={item.bookId} item={item} />)}
            </div>
          )}
          <Link to="/" className="back-link mt-4 d-inline-flex">← Tiếp tục xem sách</Link>
        </Col>
        <Col lg={4}>
          <aside className="summary-panel">
            <h2>Tóm tắt đơn hàng</h2>
            <div className="summary-line"><span>Số lượng</span><strong>{cart.itemCount} cuốn</strong></div>
            <div className="summary-line"><span>Tạm tính</span><strong>{formatCurrency(cart.subtotal)}</strong></div>
            <div className="summary-line"><span>Phí vận chuyển</span><span>Tính khi xác nhận</span></div>
            <div className="summary-total"><span>Tổng cộng</span><strong>{formatCurrency(cart.subtotal)}</strong></div>
            {cart.hasUnavailableItems && (
              <Alert variant="warning" className="small mt-3 mb-0">Giỏ có sách không còn bán. Bỏ các sách đó ra để tiếp tục.</Alert>
            )}
            <Button
              variant="success"
              className="w-100 summary-checkout"
              disabled={isEmpty || cart.hasUnavailableItems}
              onClick={() => navigate('/checkout')}
            >
              Tiến hành đặt hàng <ArrowRight size={17} />
            </Button>
            <p className="summary-note">Phương thức thanh toán và địa chỉ giao hàng sẽ được chọn ở bước tiếp theo.</p>
          </aside>
        </Col>
      </Row>
    </Container>
  );
}
