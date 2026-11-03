import React from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

function CardBook({ book }) {
  const bookTitle = book.title || book.name;
  return (
    <article className="book-card">
      <Link to={`/books/${book.id}`} className="book-cover-link" aria-label={`Xem ${bookTitle}`}>
        <div className="book-cover" style={{ '--cover-color': book.coverColor }}>
          <span className="cover-publisher">MỘC BẢN · TUYỂN CHỌN</span>
          <strong>{bookTitle}</strong>
          <span className="cover-author">{book.author}</span>
        </div>
      </Link>
      <div className="book-card-body">
        <span className="book-category">{book.categoryName}</span>
        <h3><Link to={`/books/${book.id}`}>{bookTitle}</Link></h3>
        <p className="book-author">{book.author}</p>
        <div className="book-card-footer">
          <strong>{book.price.toLocaleString('vi-VN')}₫</strong>
          <Button variant="outline-success" size="sm" aria-label={`Thêm ${bookTitle} vào giỏ`}>
            <ShoppingBag size={16} />
          </Button>
        </div>
      </div>
    </article>
  );
}

export default CardBook;