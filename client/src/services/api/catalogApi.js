import http, { ApiError } from './httpClient';
import { nowIso, randomSuffix, requireSession, validationError } from './mockGuards';
import { coverColorFor, slugify } from '../../utils/format';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/** Gắn thông tin hiển thị: categoryName + màu bìa giả lập. Server có thể trả sẵn categoryName. */
function presentBook(book, categories) {
  const category = categories.find(item => item.id === book.categoryId);
  return {
    ...book,
    categoryName: category?.name || 'Chưa phân loại',
    coverColor: book.coverColor || coverColorFor(book.id),
  };
}

function withBookCount(categories, books) {
  return categories.map(category => ({
    ...category,
    bookCount: books.filter(book => book.categoryId === category.id).length,
  }));
}

const ISBN_PATTERN = /^(\d{9}[\dXx]|\d{13})$/;

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

function normalizeBookInput(input) {
  return {
    title: input.title.trim(),
    author: input.author.trim(),
    publisher: input.publisher?.trim() || '',
    isbn: String(input.isbn || '').replace(/-/g, '').trim(),
    description: input.description?.trim() || '',
    categoryId: input.categoryId,
    price: Number(input.price),
    isPublished: Boolean(input.isPublished),
  };
}

export function validateCategoryInput(input) {
  const errors = {};
  if (!input.name?.trim()) errors.name = 'Vui lòng nhập tên thể loại.';
  else if (input.name.trim().length > 80) errors.name = 'Tên thể loại tối đa 80 ký tự.';
  return errors;
}

/* ------------------------------------------------------------------ */
/* Public catalog (Guest/Customer)                                      */
/* ------------------------------------------------------------------ */

/**
 * [ENDPOINT] GET /api/categories  (public)
 * -> 200 { items: Category[] }  chỉ các thể loại isActive=true, kèm bookCount (số sách đang bán).
 */
export async function listCategories() {
  // ---- MOCK ----
  const [{ data: categories }, { data: books }] = await Promise.all([
    http.get('/categories'),
    http.get('/books', { params: { isPublished: true } }),
  ]);
  return withBookCount(categories.filter(category => category.isActive), books);
  // ---- END MOCK ----
}

/**
 * [ENDPOINT] GET /api/books  (public)
 * query (giai đoạn sau): ?q=&categoryId=&sort=&page=&limit=
 * -> 200 { items: Book[] }  chỉ sách isPublished=true thuộc thể loại isActive=true.
 * MVP: client tải toàn bộ rồi lọc/sắp xếp phía client (SystemDesign §4).
 */
export async function listBooks() {
  // ---- MOCK ----
  const [{ data: categories }, { data: books }] = await Promise.all([
    http.get('/categories'),
    http.get('/books', { params: { isPublished: true } }),
  ]);
  const activeIds = new Set(categories.filter(category => category.isActive).map(category => category.id));
  return books
    .filter(book => activeIds.has(book.categoryId))
    .map(book => presentBook(book, categories));
  // ---- END MOCK ----
}

/**
 * [ENDPOINT] GET /api/books/:bookId  (public)
 * -> 200 { book } | 404 BOOK_NOT_FOUND (kể cả khi sách đang ở trạng thái nháp)
 */
export async function getBook(bookId) {
  // ---- MOCK ----
  try {
    const [{ data: book }, { data: categories }] = await Promise.all([
      http.get(`/books/${encodeURIComponent(bookId)}`),
      http.get('/categories'),
    ]);
    const category = categories.find(item => item.id === book.categoryId);
    if (!book.isPublished || !category?.isActive) throw new ApiError(404, 'BOOK_NOT_FOUND', 'Không tìm thấy sách.');
    return presentBook(book, categories);
  } catch (error) {
    if (error.status === 404) throw new ApiError(404, 'BOOK_NOT_FOUND', 'Không tìm thấy sách.');
    throw error;
  }
  // ---- END MOCK ----
}

/* ------------------------------------------------------------------ */
/* Admin catalog                                                        */
/* ------------------------------------------------------------------ */

/**
 * [ENDPOINT] GET /api/admin/books  (auth: ADMIN)
 * -> 200 { items: Book[] }  gồm cả sách nháp.
 */
export async function listAdminBooks() {
  requireSession('ADMIN');
  // ---- MOCK ----
  const [{ data: categories }, { data: books }] = await Promise.all([http.get('/categories'), http.get('/books')]);
  return books
    .map(book => presentBook(book, categories))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  // ---- END MOCK ----
}

async function assertCategoryExists(categoryId) {
  try {
    await http.get(`/categories/${encodeURIComponent(categoryId)}`);
  } catch (error) {
    if (error.status === 404) throw validationError({ categoryId: 'Thể loại không tồn tại.' });
    throw error;
  }
}

async function assertIsbnUnique(isbn, exceptId) {
  if (!isbn) return;
  const { data } = await http.get('/books', { params: { isbn } });
  if (data.some(book => book.id !== exceptId)) {
    throw new ApiError(409, 'ISBN_TAKEN', 'ISBN đã tồn tại.', { isbn: 'ISBN đã tồn tại.' });
  }
}

/**
 * [ENDPOINT] POST /api/admin/books  (auth: ADMIN)
 * body: { title, author, publisher?, isbn?, description?, categoryId, price, isPublished }
 * -> 201 { book } | 400 VALIDATION_ERROR | 409 ISBN_TAKEN
 */
export async function createBook(input) {
  requireSession('ADMIN');
  const errors = validateBookInput(input);
  if (Object.keys(errors).length) throw validationError(errors);
  const body = normalizeBookInput(input);
  // ---- MOCK ----
  await assertCategoryExists(body.categoryId);
  await assertIsbnUnique(body.isbn);
  const timestamp = nowIso();
  const { data } = await http.post('/books', {
    id: `book-${slugify(body.title).slice(0, 40)}-${randomSuffix()}`,
    ...body,
    imageUrl: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return data;
  // ---- END MOCK ----
}

/**
 * [ENDPOINT] PATCH /api/admin/books/:bookId  (auth: ADMIN)
 * body: các field như POST (partial) -> 200 { book } | 404 | 400 | 409 ISBN_TAKEN
 * Lưu ý: đổi giá KHÔNG ảnh hưởng đơn cũ (đơn giữ snapshot giá).
 */
export async function updateBook(bookId, input) {
  requireSession('ADMIN');
  const errors = validateBookInput(input);
  if (Object.keys(errors).length) throw validationError(errors);
  const body = normalizeBookInput(input);
  // ---- MOCK ----
  await assertCategoryExists(body.categoryId);
  await assertIsbnUnique(body.isbn, bookId);
  const { data } = await http.patch(`/books/${encodeURIComponent(bookId)}`, { ...body, updatedAt: nowIso() });
  return data;
  // ---- END MOCK ----
}

/**
 * [ENDPOINT] DELETE /api/admin/books/:bookId  (auth: ADMIN) -> 204
 * Đơn hàng cũ không bị ảnh hưởng vì giữ snapshot. Server nên xóa luôn item này khỏi mọi cart
 * (hoặc chuyển sang soft-delete: isPublished=false + deletedAt).
 */
export async function deleteBook(bookId) {
  requireSession('ADMIN');
  // ---- MOCK ----
  await http.delete(`/books/${encodeURIComponent(bookId)}`);
  const { data: carts } = await http.get('/carts');
  await Promise.all(carts
    .filter(cart => cart.items.some(item => item.bookId === bookId))
    .map(cart => http.patch(`/carts/${cart.id}`, {
      items: cart.items.filter(item => item.bookId !== bookId),
      updatedAt: nowIso(),
    })));
  // ---- END MOCK ----
}

/**
 * [ENDPOINT] GET /api/admin/categories  (auth: ADMIN)
 * -> 200 { items: Category[] }  gồm cả thể loại ẩn, bookCount = tổng số sách (kể cả nháp).
 */
export async function listAdminCategories() {
  requireSession('ADMIN');
  // ---- MOCK ----
  const [{ data: categories }, { data: books }] = await Promise.all([http.get('/categories'), http.get('/books')]);
  return withBookCount(categories, books);
  // ---- END MOCK ----
}

async function assertSlugUnique(slug, exceptId) {
  const { data } = await http.get('/categories', { params: { slug } });
  if (data.some(category => category.id !== exceptId)) {
    throw new ApiError(409, 'CATEGORY_NAME_TAKEN', 'Thể loại đã tồn tại.', { name: 'Tên thể loại đã tồn tại.' });
  }
}

/**
 * [ENDPOINT] POST /api/admin/categories  (auth: ADMIN)
 * body: { name, description?, isActive } -> 201 { category } | 400 | 409 CATEGORY_NAME_TAKEN
 * slug do server sinh từ name (unique).
 */
export async function createCategory(input) {
  requireSession('ADMIN');
  const errors = validateCategoryInput(input);
  if (Object.keys(errors).length) throw validationError(errors);
  const slug = slugify(input.name);
  // ---- MOCK ----
  await assertSlugUnique(slug);
  const { data } = await http.post('/categories', {
    id: `cat-${slug}`,
    name: input.name.trim(),
    slug,
    description: input.description?.trim() || '',
    isActive: Boolean(input.isActive),
  });
  return data;
  // ---- END MOCK ----
}

/**
 * [ENDPOINT] PATCH /api/admin/categories/:categoryId  (auth: ADMIN)
 * body: { name?, description?, isActive? } -> 200 { category }
 * isActive=false: ẩn thể loại và toàn bộ sách thuộc thể loại khỏi storefront.
 */
export async function updateCategory(categoryId, input) {
  requireSession('ADMIN');
  const errors = validateCategoryInput(input);
  if (Object.keys(errors).length) throw validationError(errors);
  const slug = slugify(input.name);
  // ---- MOCK ----
  await assertSlugUnique(slug, categoryId);
  const { data } = await http.patch(`/categories/${encodeURIComponent(categoryId)}`, {
    name: input.name.trim(),
    slug,
    description: input.description?.trim() || '',
    isActive: Boolean(input.isActive),
  });
  return data;
  // ---- END MOCK ----
}

/**
 * [ENDPOINT] DELETE /api/admin/categories/:categoryId  (auth: ADMIN)
 * -> 204 | 409 CATEGORY_IN_USE nếu vẫn còn sách thuộc thể loại.
 */
export async function deleteCategory(categoryId) {
  requireSession('ADMIN');
  // ---- MOCK ----
  const { data: books } = await http.get('/books', { params: { categoryId } });
  if (books.length) {
    throw new ApiError(409, 'CATEGORY_IN_USE', `Không thể xóa: còn ${books.length} sách thuộc thể loại này. Hãy chuyển sách sang thể loại khác hoặc ẩn thể loại.`);
  }
  await http.delete(`/categories/${encodeURIComponent(categoryId)}`);
  // ---- END MOCK ----
}
