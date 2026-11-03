import React from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import { Plus, Search } from 'lucide-react';
import { BOOKS, CATEGORIES } from '../data/bookstoreData';

export default function BookManager() {
  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div><p className="eyebrow">DANH MỤC SẢN PHẨM</p><h1>Quản lý sách</h1></div>
        <Button variant="success"><Plus size={17} /> Thêm sách</Button>
      </div>
      <div className="admin-toolbar">
        <div className="admin-search"><Search size={16} /><input className="form-control" placeholder="Tìm theo tên sách, tác giả, ISBN" /></div>
        <select className="form-select" aria-label="Lọc theo trạng thái" defaultValue="all"><option value="all">Tất cả trạng thái</option><option>Đang bán</option><option>Bản nháp</option></select>
      </div>
      <div className="admin-table-wrap">
        <Table responsive hover className="admin-table align-middle">
          <thead><tr><th>Sách</th><th>ISBN</th><th>Thể loại</th><th>Giá bán</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>{BOOKS.map(book => (
            <tr key={book.id}>
              <td><strong>{book.title}</strong><small>{book.author}</small></td>
              <td>{book.isbn}</td>
              <td>{CATEGORIES.find(category => category.id === book.categoryId)?.name}</td>
              <td>{book.price.toLocaleString('vi-VN')}₫</td>
              <td><span className="status-dot">Đang bán</span></td>
              <td><Button variant="outline-secondary" size="sm">Sửa</Button></td>
            </tr>
          ))}</tbody>
        </Table>
      </div>
      <div className="admin-editor">
        <div className="admin-editor-heading"><div><p className="eyebrow">BIỂU MẪU</p><h2>Thông tin sách</h2></div><span>Chưa chọn sách</span></div>
        <Form>
          <div className="admin-form-grid">
            <Form.Group><Form.Label htmlFor="book-title">Tên sách</Form.Label><input id="book-title" className="form-control" placeholder="Nhập tên sách" /></Form.Group>
            <Form.Group><Form.Label htmlFor="book-author">Tác giả</Form.Label><input id="book-author" className="form-control" placeholder="Nhập tên tác giả" /></Form.Group>
            <Form.Group><Form.Label htmlFor="book-publisher">Nhà xuất bản</Form.Label><input id="book-publisher" className="form-control" placeholder="Nhập nhà xuất bản" /></Form.Group>
            <Form.Group><Form.Label htmlFor="book-isbn">ISBN</Form.Label><input id="book-isbn" className="form-control" placeholder="Không bắt buộc" /></Form.Group>
            <Form.Group><Form.Label htmlFor="book-category">Thể loại</Form.Label><select id="book-category" className="form-select" defaultValue=""><option value="">Chọn thể loại</option>{CATEGORIES.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Form.Group>
            <Form.Group><Form.Label htmlFor="book-price">Giá bán (₫)</Form.Label><input id="book-price" className="form-control" type="number" placeholder="0" /></Form.Group>
            <Form.Group className="wide-field"><Form.Label htmlFor="book-description">Mô tả</Form.Label><textarea id="book-description" className="form-control" rows={3} placeholder="Giới thiệu ngắn về cuốn sách" /></Form.Group>
          </div>
          <div className="admin-form-actions"><Button variant="outline-secondary">Xóa</Button><Button variant="success">Lưu thông tin</Button></div>
        </Form>
      </div>
    </section>
  );
}