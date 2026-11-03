import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Form, Spinner, Table } from 'react-bootstrap';
import { Plus, Search } from 'lucide-react';
import {
  createBook,
  deleteBook,
  listAdminBooks,
  listAdminCategories,
  updateBook,
  validateBookInput,
} from '../services/api/catalogApi';
import { useToast } from '../context/ToastContext';
import { formatCurrency, normalizeSearch } from '../utils/format';

const EMPTY_FORM = {
  title: '', author: '', publisher: '', isbn: '', categoryId: '', price: '', description: '', isPublished: true,
};

function toForm(book) {
  return {
    title: book.title || '',
    author: book.author || '',
    publisher: book.publisher || '',
    isbn: book.isbn || '',
    categoryId: book.categoryId || '',
    price: String(book.price ?? ''),
    description: book.description || '',
    isPublished: Boolean(book.isPublished),
  };
}

export default function BookManager() {
  const { showToast } = useToast();
  const editorRef = useRef(null);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [bookList, categoryList] = await Promise.all([listAdminBooks(), listAdminCategories()]);
      setBooks(bookList);
      setCategories(categoryList);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleBooks = useMemo(() => {
    const term = normalizeSearch(keyword);
    return books
      .filter(book => statusFilter === 'all' || (statusFilter === 'published' ? book.isPublished : !book.isPublished))
      .filter(book => !term || normalizeSearch(`${book.title} ${book.author} ${book.isbn}`).includes(term));
  }, [books, keyword, statusFilter]);

  const editingBook = books.find(book => book.id === editingId);

  const scrollToEditor = () => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    scrollToEditor();
  };

  const startEdit = book => {
    setEditingId(book.id);
    setForm(toForm(book));
    setErrors({});
    scrollToEditor();
  };

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const validation = validateBookInput(form);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setSaving(true);
    try {
      if (editingId) {
        await updateBook(editingId, form);
        showToast('Đã cập nhật thông tin sách.');
      } else {
        const created = await createBook(form);
        setEditingId(created.id);
        showToast('Đã thêm sách mới.');
      }
      await load();
    } catch (error) {
      if (error.details) setErrors(error.details);
      showToast(error.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingBook) return;
    if (!window.confirm(`Xóa sách "${editingBook.title}"? Đơn hàng cũ vẫn giữ thông tin sách, nhưng sách sẽ bị gỡ khỏi các giỏ hàng.`)) return;
    setSaving(true);
    try {
      await deleteBook(editingBook.id);
      showToast('Đã xóa sách.', 'info');
      setEditingId(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (error) {
      showToast(error.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async book => {
    try {
      await updateBook(book.id, { ...toForm(book), isPublished: !book.isPublished });
      showToast(book.isPublished ? 'Đã chuyển sách về bản nháp.' : 'Sách đã được mở bán.');
      await load();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div><p className="eyebrow">DANH MỤC SẢN PHẨM</p><h1>Quản lý sách</h1></div>
        <Button variant="success" onClick={startCreate}><Plus size={17} /> Thêm sách</Button>
      </div>
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input className="form-control" placeholder="Tìm theo tên sách, tác giả, ISBN" value={keyword} onChange={event => setKeyword(event.target.value)} />
        </div>
        <select className="form-select" aria-label="Lọc theo trạng thái" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="published">Đang bán</option>
          <option value="draft">Bản nháp</option>
        </select>
      </div>
      {loadError && (
        <Alert variant="danger" className="d-flex justify-content-between align-items-center">
          <span>{loadError}</span><Button size="sm" variant="outline-danger" onClick={load}>Thử lại</Button>
        </Alert>
      )}
      <div className="admin-table-wrap">
        <Table responsive hover className="admin-table align-middle">
          <thead><tr><th>Sách</th><th>ISBN</th><th>Thể loại</th><th>Giá bán</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6}><Spinner animation="border" size="sm" /> Đang tải...</td></tr>}
            {!loading && visibleBooks.length === 0 && <tr><td colSpan={6}>Không có sách phù hợp.</td></tr>}
            {!loading && visibleBooks.map(book => (
              <tr key={book.id} className={book.id === editingId ? 'table-active' : undefined}>
                <td><strong>{book.title}</strong><small>{book.author}</small></td>
                <td>{book.isbn || '—'}</td>
                <td>{book.categoryName}</td>
                <td>{formatCurrency(book.price)}</td>
                <td>
                  <button type="button" className={`status-toggle ${book.isPublished ? 'status-dot' : 'status-draft'}`} title="Bấm để đổi trạng thái" onClick={() => togglePublished(book)}>
                    {book.isPublished ? 'Đang bán' : 'Bản nháp'}
                  </button>
                </td>
                <td><Button variant="outline-secondary" size="sm" onClick={() => startEdit(book)}>Sửa</Button></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <div className="admin-editor" ref={editorRef}>
        <div className="admin-editor-heading">
          <div><p className="eyebrow">BIỂU MẪU</p><h2>{editingId ? 'Sửa thông tin sách' : 'Thêm sách mới'}</h2></div>
          <span>{editingBook ? editingBook.title : 'Chưa chọn sách'}</span>
        </div>
        <Form noValidate onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            {[
              ['title', 'Tên sách', 'Nhập tên sách'],
              ['author', 'Tác giả', 'Nhập tên tác giả'],
              ['publisher', 'Nhà xuất bản', 'Nhập nhà xuất bản'],
              ['isbn', 'ISBN', 'Không bắt buộc'],
            ].map(([name, label, placeholder]) => (
              <Form.Group key={name}>
                <Form.Label htmlFor={`book-${name}`}>{label}</Form.Label>
                <Form.Control id={`book-${name}`} placeholder={placeholder} value={form[name]} isInvalid={Boolean(errors[name])} onChange={event => updateField(name, event.target.value)} />
                <Form.Control.Feedback type="invalid">{errors[name]}</Form.Control.Feedback>
              </Form.Group>
            ))}
            <Form.Group>
              <Form.Label htmlFor="book-category">Thể loại</Form.Label>
              <Form.Select id="book-category" value={form.categoryId} isInvalid={Boolean(errors.categoryId)} onChange={event => updateField('categoryId', event.target.value)}>
                <option value="">Chọn thể loại</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}{category.isActive ? '' : ' (đang ẩn)'}</option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.categoryId}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group>
              <Form.Label htmlFor="book-price">Giá bán (₫)</Form.Label>
              <Form.Control id="book-price" type="number" min="0" step="1000" placeholder="0" value={form.price} isInvalid={Boolean(errors.price)} onChange={event => updateField('price', event.target.value)} />
              <Form.Control.Feedback type="invalid">{errors.price}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="wide-field">
              <Form.Label htmlFor="book-description">Mô tả</Form.Label>
              <Form.Control as="textarea" id="book-description" rows={3} placeholder="Giới thiệu ngắn về cuốn sách" value={form.description} onChange={event => updateField('description', event.target.value)} />
            </Form.Group>
            <Form.Check
              className="wide-field"
              type="switch"
              id="book-published"
              label="Mở bán (hiển thị trong cửa hàng)"
              checked={form.isPublished}
              onChange={event => updateField('isPublished', event.target.checked)}
            />
          </div>
          <div className="admin-form-actions">
            {editingId
              ? <Button variant="outline-danger" disabled={saving} onClick={handleDelete}>Xóa sách</Button>
              : <Button variant="outline-secondary" disabled={saving} onClick={startCreate}>Xóa</Button>}
            {editingId && <Button variant="outline-secondary" disabled={saving} onClick={startCreate}>Hủy chọn</Button>}
            <Button type="submit" variant="success" disabled={saving}>
              {saving ? <Spinner animation="border" size="sm" /> : 'Lưu thông tin'}
            </Button>
          </div>
        </Form>
      </div>
    </section>
  );
}
