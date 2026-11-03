import React from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { BOOKS } from '../data/bookstoreData';

export default function BookDetail() {
  const { bookId } = useParams();
  const book = BOOKS.find(item => item.id === bookId);

  if (!book) {
    return <Container className="store-page py-5"><h1>Không tìm thấy sách</h1><Link to="/">Về trang sách</Link></Container>;
  }

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
            <p className="detail-author">{book.author} <span>·</span> {book.publisher}</p>
            <p className="detail-price">{book.price.toLocaleString('vi-VN')}₫</p>
            <p className="detail-description">{book.description}</p>
            <Button variant="success" className="detail-add-button"><ShoppingBag size={17} /> Thêm vào giỏ</Button>
            <dl className="book-metadata">
              <div><dt>ISBN</dt><dd>{book.isbn}</dd></div>
              <div><dt>Thể loại</dt><dd>{book.categoryName}</dd></div>
              <div><dt>Nhà xuất bản</dt><dd>{book.publisher}</dd></div>
            </dl>
          </div>
        </Col>
      </Row>
    </Container>
  );
}