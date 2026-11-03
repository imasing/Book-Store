import React from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import { Plus } from 'lucide-react';
import { CATEGORIES } from '../data/bookstoreData';

export default function CategoryManager() {
  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div><p className="eyebrow">TỔ CHỨC CATALOG</p><h1>Thể loại sách</h1></div>
        <Button variant="success"><Plus size={17} /> Thêm thể loại</Button>
      </div>
      <div className="category-admin-layout">
        <div className="admin-table-wrap">
          <Table hover responsive className="admin-table align-middle">
            <thead><tr><th>Tên thể loại</th><th>Mô tả</th><th>Số đầu sách</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>{CATEGORIES.map(category => (
              <tr key={category.id}>
                <td><strong>{category.name}</strong></td>
                <td>Danh mục sách {category.name.toLowerCase()}.</td>
                <td>{category.bookCount}</td>
                <td><span className="status-dot">Đang hiển thị</span></td>
                <td><Button variant="outline-secondary" size="sm">Sửa</Button></td>
              </tr>
            ))}</tbody>
          </Table>
        </div>
        <aside className="admin-editor category-editor">
          <p className="eyebrow">BIỂU MẪU</p><h2>Thông tin thể loại</h2>
          <Form>
            <Form.Group className="mb-3"><Form.Label htmlFor="category-name">Tên thể loại</Form.Label><input id="category-name" className="form-control" placeholder="Ví dụ: Văn học Việt Nam" /></Form.Group>
            <Form.Group className="mb-3"><Form.Label htmlFor="category-description">Mô tả</Form.Label><textarea id="category-description" className="form-control" rows={4} placeholder="Mô tả ngắn về danh mục" /></Form.Group>
            <div className="form-check form-switch"><input id="category-visible" className="form-check-input" type="checkbox" defaultChecked /><label className="form-check-label" htmlFor="category-visible">Hiển thị trong cửa hàng</label></div>
            <div className="admin-form-actions"><Button variant="outline-secondary">Xóa</Button><Button variant="success">Lưu</Button></div>
          </Form>
        </aside>
      </div>
    </section>
  );
}