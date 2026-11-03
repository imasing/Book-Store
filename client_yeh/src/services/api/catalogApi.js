import http from './httpClient';
import { coverColorFor } from '../../utils/format';

const ISBN_PATTERN = /^(\d{9}[\dXx]|\d{13})$/;

/** Thêm màu bìa hiển thị (chưa có ảnh bìa thật) – thuần UI, ổn định theo id. */
export function withCover(book) {
  return book ? { ...book, coverColor: book.coverColor || coverColorFor(book.id) } : book;
}

/** Validate form sách trước khi gửi (server validate lại). */
export function validateBookInput(input) {
  const errors = {};
  if (!input.title?.trim()) errors.title = 'Vui lòng nhập tên sách.';
  if (!input.author?.trim()) errors.author = 'Vui lòng nhập tác giả.';
  if (!input.categoryId) errors.categoryId = 'Vui lòng chọn thể loại.';
  const price = Number(input.price);
  if (!Number.isInteger(price) || price <= 0) errors.price = 'Giá bán phải là số nguyên dương.';
  const isbn = String(input.isbn || '').replace(/-/g, '').trim();
  if (isbn && !ISBN_PATTERN.test(isbn)) errors.isbn = 'ISBN phải gồm 10 hoặc 13 ký tự số.';
  return errors;
}

export function validateCategoryInput(input) {
  const errors = {};
  if (!input.name?.trim()) errors.name = 'Vui lòng nhập tên thể loại.';
  else if (input.name.trim().length > 80) errors.name = 'Tên thể loại tối đa 80 ký tự.';
  return errors;
}

function toBookPayload(input) {
  return {
    title: input.title,
    author: input.author,
    publisher: input.publisher || '',
    isbn: input.isbn || '',
    description: input.description || '',
    categoryId: input.categoryId,
    price: Number(input.price),
    isPublished: Boolean(input.isPublished),
  };
}

function toCategoryPayload(input) {
  return {
    name: input.name,
    description: input.description || '',
    isActive: Boolean(input.isActive),
  };
}

/* ---------------------------- Public ---------------------------- */

/** GET /api/categories -> Category[] (đang hiển thị, kèm bookCount) */
export async function listCategories() {
  const { data } = await http.get('/categories');
  return data;
}

/** GET /api/books -> Book[] (đang bán) */
export async function listBooks() {
  const { data } = await http.get('/books');
  return data.map(withCover);
}

/** GET /api/books/:bookId -> Book | 404 BOOK_NOT_FOUND */
export async function getBook(bookId) {
  const { data } = await http.get(`/books/${encodeURIComponent(bookId)}`);
  return withCover(data);
}

/* ---------------------------- Admin ----------------------------- */

/** GET /api/admin/books -> Book[] (cả nháp) */
export async function listAdminBooks() {
  const { data } = await http.get('/admin/books');
  return data.map(withCover);
}

/** POST /api/admin/books -> Book */
export async function createBook(input) {
  const { data } = await http.post('/admin/books', toBookPayload(input));
  return withCover(data);
}

/** PATCH /api/admin/books/:bookId -> Book */
export async function updateBook(bookId, input) {
  const { data } = await http.patch(`/admin/books/${encodeURIComponent(bookId)}`, toBookPayload(input));
  return withCover(data);
}

/** DELETE /api/admin/books/:bookId -> 204 */
export async function deleteBook(bookId) {
  await http.delete(`/admin/books/${encodeURIComponent(bookId)}`);
}

/** GET /api/admin/categories -> Category[] (cả ẩn, bookCount gồm sách nháp) */
export async function listAdminCategories() {
  const { data } = await http.get('/admin/categories');
  return data;
}

/** POST /api/admin/categories -> Category */
export async function createCategory(input) {
  const { data } = await http.post('/admin/categories', toCategoryPayload(input));
  return data;
}

/** PATCH /api/admin/categories/:categoryId -> Category */
export async function updateCategory(categoryId, input) {
  const { data } = await http.patch(`/admin/categories/${encodeURIComponent(categoryId)}`, toCategoryPayload(input));
  return data;
}

/** DELETE /api/admin/categories/:categoryId -> 204 | 409 CATEGORY_IN_USE */
export async function deleteCategory(categoryId) {
  await http.delete(`/admin/categories/${encodeURIComponent(categoryId)}`);
}
