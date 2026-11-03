import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Row, Col, Container, Button, Spinner, Alert } from "react-bootstrap";
import { Search, ArrowRight } from "lucide-react";
import CardBook from "../components/CardBook/CardBook";
import SideBar from "../components/SideBar/SideBar";
import { listBooks, listCategories } from "../services/api/catalogApi";
import { normalizeSearch } from "../utils/format";

const SORTERS = {
  featured: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
  title: (a, b) => a.title.localeCompare(b.title, 'vi'),
  price: (a, b) => a.price - b.price,
};

function Home() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookList, categoryList] = await Promise.all([listBooks(), listCategories()]);
      setBooks(bookList);
      setCategories(categoryList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // MVP: lọc phía client theo onChange (SystemDesign §4 - Catalog và tìm kiếm).
  const visibleBooks = useMemo(() => {
    const term = normalizeSearch(keyword);
    return books
      .filter(book => categoryId === 'all' || book.categoryId === categoryId)
      .filter(book => !term || normalizeSearch(`${book.title} ${book.author} ${book.publisher} ${book.isbn}`).includes(term))
      .sort(SORTERS[sortBy]);
  }, [books, keyword, categoryId, sortBy]);

  const handleSearchSubmit = event => {
    event.preventDefault();
    document.getElementById('catalog-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetFilters = () => {
    setKeyword('');
    setCategoryId('all');
  };

  return (
    <Container fluid className="store-page px-3 px-lg-5">
      <section className="store-hero">
        <div className="hero-copy">
          <p className="eyebrow">NHÀ SÁCH ĐỘC LẬP · TỪ 2026</p>
          <h1>Mỗi cuốn sách<br /><em>mở một lối đi.</em></h1>
          <p className="hero-description">Tuyển chọn những câu chuyện và ý tưởng đáng để bạn mang về.</p>
          <a className="hero-link" href="#catalog">Xem bộ sưu tập <ArrowRight size={17} /></a>
        </div>
        <div className="hero-art" aria-label="Bộ sưu tập sách được tuyển chọn">
          <div className="hero-book hero-book-one"><span>MỘC BẢN</span><strong>Đọc để<br />lắng nghe</strong><small>01 / VĂN HỌC</small></div>
          <div className="hero-book hero-book-two"><span>GHI CHÉP</span><strong>Những<br />ngày xanh</strong><small>02 / TẢN VĂN</small></div>
          <div className="hero-stamp">ĐỌC<br />CHẬM</div>
        </div>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="catalog-heading">
          <div>
            <p className="eyebrow">GÓC ĐỌC CỦA BẠN</p>
            <h2>Sách được chọn</h2>
          </div>
          <form className="input-group catalog-search" onSubmit={handleSearchSubmit} role="search">
            <span className="input-group-text"><Search size={17} /></span>
            <input
              className="form-control"
              placeholder="Tìm tên sách, tác giả..."
              aria-label="Tìm sách"
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
            />
            <Button variant="dark" type="submit">Tìm</Button>
          </form>
        </div>
        <Row className="gx-4 gy-4">
          <Col lg={3} md={4}>
            <SideBar
              categories={categories}
              totalCount={books.length}
              selectedId={categoryId}
              onSelect={setCategoryId}
            />
          </Col>
          <Col lg={9} md={8} id="catalog-results">
            <div className="catalog-toolbar">
              <span>{visibleBooks.length} đầu sách</span>
              <select
                aria-label="Sắp xếp sách"
                className="form-select sort-select"
                value={sortBy}
                onChange={event => setSortBy(event.target.value)}
              >
                <option value="featured">Sắp xếp: mới nhất</option>
                <option value="title">Tên sách A-Z</option>
                <option value="price">Giá thấp đến cao</option>
              </select>
            </div>

            {loading && <div className="state-box"><Spinner animation="border" size="sm" /> Đang tải sách...</div>}
            {!loading && error && (
              <Alert variant="danger" className="d-flex justify-content-between align-items-center">
                <span>{error}</span>
                <Button size="sm" variant="outline-danger" onClick={load}>Thử lại</Button>
              </Alert>
            )}
            {!loading && !error && visibleBooks.length === 0 && (
              <div className="state-box">
                Không tìm thấy sách phù hợp.{' '}
                {(keyword || categoryId !== 'all') && <Button variant="link" size="sm" onClick={resetFilters}>Xóa bộ lọc</Button>}
              </div>
            )}
            <Row className="gx-3 gy-4">
              {!loading && !error && visibleBooks.map(book => (
                <Col key={book.id} xl={4} lg={6}>
                  <CardBook book={book} />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </section>
    </Container>
  );
}

export default Home;
