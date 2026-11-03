import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, Spinner, Table } from 'react-bootstrap';
import { Plus } from 'lucide-react';
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  updateCategory,
  validateCategoryInput,
} from '../services/api/catalogApi';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = { name: '', description: '', isActive: true };

export default function CategoryManager() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setCategories(await listAdminCategories());
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const editing = categories.find(category => category.id === editingId);

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const startEdit = category => {
    setEditingId(category.id);
    setForm({ name: category.name, description: category.description || '', isActive: Boolean(category.isActive) });
    setErrors({});
  };

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const validation = validateCategoryInput(form);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, form);
        showToast('Đã cập nhật thể loại.');
      } else {
        const created = await createCategory(form);
        setEditingId(created.id);
        showToast('Đã thêm thể loại.');
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
    if (!editing) {
      startCreate();
      return;
    }
    if (editing.bookCount > 0) {
      showToast(`Không thể xóa: còn ${editing.bookCount} sách thuộc thể loại này. Hãy chuyển sách hoặc tắt hiển thị.`, 'warning');
      return;
    }
    if (!window.confirm(`Xóa thể loại "${editing.name}"?`)) return;
    setSaving(true);
    try {
      await deleteCategory(editing.id);
      showToast('Đã xóa thể loại.', 'info');
      startCreate();
      await load();
    } catch (error) {
      showToast(error.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div><p className="eyebrow">TỔ CHỨC CATALOG</p><h1>Thể loại sách</h1></div>
        <Button variant="success" onClick={startCreate}><Plus size={17} /> Thêm thể loại</Button>
      </div>
      {loadError && (
        <Alert variant="danger" className="d-flex justify-content-between align-items-center">
          <span>{loadError}</span><Button size="sm" variant="outline-danger" onClick={load}>Thử lại</Button>
        </Alert>
      )}
      <div className="category-admin-layout">
        <div className="admin-table-wrap">
          <Table hover responsive className="admin-table align-middle">
            <thead><tr><th>Tên thể loại</th><th>Mô tả</th><th>Số đầu sách</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={5}><Spinner animation="border" size="sm" /> Đang tải...</td></tr>}
              {!loading && categories.length === 0 && <tr><td colSpan={5}>Chưa có thể loại nào.</td></tr>}
              {!loading && categories.map(category => (
                <tr key={category.id} className={category.id === editingId ? 'table-active' : undefined}>
                  <td><strong>{category.name}</strong><small>/{category.slug}</small></td>
                  <td>{category.description || '—'}</td>
                  <td>{category.bookCount}</td>
                  <td><span className={category.isActive ? 'status-dot' : 'status-draft'}>{category.isActive ? 'Đang hiển thị' : 'Đang ẩn'}</span></td>
                  <td><Button variant="outline-secondary" size="sm" onClick={() => startEdit(category)}>Sửa</Button></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <aside className="admin-editor category-editor">
          <p className="eyebrow">BIỂU MẪU</p><h2>{editingId ? 'Sửa thể loại' : 'Thêm thể loại'}</h2>
          <Form noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="category-name">Tên thể loại</Form.Label>
              <Form.Control id="category-name" placeholder="Ví dụ: Văn học Việt Nam" value={form.name} isInvalid={Boolean(errors.name)} onChange={event => updateField('name', event.target.value)} />
              <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="category-description">Mô tả</Form.Label>
              <Form.Control as="textarea" id="category-description" rows={4} placeholder="Mô tả ngắn về danh mục" value={form.description} onChange={event => updateField('description', event.target.value)} />
            </Form.Group>
            <Form.Check
              type="switch"
              id="category-visible"
              label="Hiển thị trong cửa hàng"
              checked={form.isActive}
              onChange={event => updateField('isActive', event.target.checked)}
            />
            {editingId && !form.isActive && editing?.bookCount > 0 && (
              <p className="small text-muted mt-2 mb-0">Ẩn thể loại sẽ ẩn luôn {editing.bookCount} sách thuộc thể loại này khỏi cửa hàng.</p>
            )}
            <div className="admin-form-actions">
              <Button variant={editingId ? 'outline-danger' : 'outline-secondary'} disabled={saving} onClick={handleDelete}>Xóa</Button>
              <Button type="submit" variant="success" disabled={saving}>{saving ? <Spinner animation="border" size="sm" /> : 'Lưu'}</Button>
            </div>
          </Form>
        </aside>
      </div>
    </section>
  );
}
