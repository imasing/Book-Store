import React, { useEffect, useState } from 'react';
import { Button, Col, Container, Row, Spinner } from 'react-bootstrap';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getBook } from '../services/api/catalogApi';
import { useAddToCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';
import { MAX_QUANTITY_PER_ITEM } from '../services/api/cartApi';

export default function BookDetail() {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isAdding } = useAddToCart();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setQuantity(1);
    getBook(bookId)
      .then(data => { if (!cancelled) setBook(data); })
      .catch(err => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bookId]);

  if (loading) {
    return <Container className="store-page py-5"><Spinner animation="border" size="sm" /> Đang tải thông tin sách...</Container>;
  }

  if (error || !book) {
    return (
      <Container className="store-page py-5">
        <h1>{error?.status === 404 || !book ? 'Không tìm thấy sách' : 'Không tải được sách'}</h1>
        {error && error.status !== 404 && <p className="text-muted">{error.message}</p>}
        <Link to="/">Về trang sách</Link>
      </Container>
    );
  }

  const adding = isAdding(book.id);

  return (
    <Container className="store-page py-4 py-lg-5">
      <Link to="/" className="back-link"><ArrowLeft size={16} /> Tất cả sách</Link>
      <Row className="book-detail gx-lg-5 gy-4 mt-2">
        <Col md={5} lg={4}>
          <div className="detail-cover book-cover" style={{ '--cover-color': book.coverColor }}>
            <span className="cover-publisher">MỘC BẢN · TUYỂN CHỌN</span>
            <strong>{book.title}</strong>
            <span className="cover-author">{book.author}</span>
          </div>
        </Col>
        <Col md={7} lg={8}>
          <div className="detail-copy">
            <p className="eyebrow">{book.categoryName}</p>
            <h1>{book.title}</h1>
            <p className="detail-author">{book.author} {book.publisher && <><span>·</span> {book.publisher}</>}</p>
            <p className="detail-price">{formatCurrency(book.price)}</p>
            <p className="detail-description">{book.description}</p>
            <div className="detail-actions">
              <input
                className="form-control detail-quantity"
                type="number"
                min="1"
                max={MAX_QUANTITY_PER_ITEM}
                aria-label="Số lượng"
                value={quantity}
                onChange={event => setQuantity(Math.min(MAX_QUANTITY_PER_ITEM, Math.max(1, Number(event.target.value) || 1)))}
              />
              <Button
                variant="success"
                className="detail-add-button"
                disabled={adding}
                onClick={() => addToCart(book, quantity)}
              >
                {adding ? <Spinner animation="border" size="sm" /> : <ShoppingBag size={17} />} Thêm vào giỏ
              </Button>
            </div>
            <dl className="book-metadata">
              <div><dt>ISBN</dt><dd>{book.isbn || '—'}</dd></div>
              <div><dt>Thể loại</dt><dd>{book.categoryName}</dd></div>
              <div><dt>Nhà xuất bản</dt><dd>{book.publisher || '—'}</dd></div>
            </dl>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
