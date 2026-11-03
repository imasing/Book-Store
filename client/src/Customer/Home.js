import React from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
import { Search, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import CardBook from "../components/CardBook/CardBook";
import SideBar from "../components/SideBar/SideBar";
import { BOOKS } from "../data/bookstoreData";

function Home() {
  return (
    <Container fluid className="store-page px-3 px-lg-5">
      <section className="store-hero">
        <div className="hero-copy">
          <p className="eyebrow">NHÀ SÁCH ĐỘC LẬP · TỪ 2026</p>
          <h1>Mỗi cuốn sách<br /><em>mở một lối đi.</em></h1>
          <p className="hero-description">Tuyển chọn những câu chuyện và ý tưởng đáng để bạn mang về.</p>
          <Link className="hero-link" to="#catalog">Xem bộ sưu tập <ArrowRight size={17} /></Link>
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
          <div className="input-group catalog-search">
            <span className="input-group-text"><Search size={17} /></span>
            <input className="form-control" placeholder="Tìm tên sách, tác giả..." aria-label="Tìm sách" />
            <Button variant="dark">Tìm</Button>
          </div>
        </div>
        <Row className="gx-4 gy-4">
          <Col lg={3} md={4}><SideBar /></Col>
          <Col lg={9} md={8}>
            <div className="catalog-toolbar">
              <span>{BOOKS.length} đầu sách</span>
              <select aria-label="Sắp xếp sách" className="form-select sort-select" defaultValue="featured">
                <option value="featured">Sắp xếp: nổi bật</option>
                <option value="title">Tên sách A-Z</option>
                <option value="price">Giá thấp đến cao</option>
              </select>
            </div>
            <Row className="gx-3 gy-4">
              {BOOKS.map(book => (
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
