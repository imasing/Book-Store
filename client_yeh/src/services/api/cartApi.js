import http, { ApiError } from './httpClient';
import { nowIso, requireSession, validationError } from './mockGuards';
import { coverColorFor } from '../../utils/format';

export const MAX_QUANTITY_PER_ITEM = 99;

function assertQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
    throw validationError({ quantity: `Số lượng phải từ 1 đến ${MAX_QUANTITY_PER_ITEM}.` });
  }
}

/* ---- MOCK helpers: server làm các bước này trong service cart ---- */

async function findOrCreateCart(customerId) {
  const { data } = await http.get('/carts', { params: { customerId } });
  if (data[0]) return data[0];
  const { data: created } = await http.post('/carts', {
    id: `cart-${customerId}`,
    customerId,
    items: [],
    updatedAt: nowIso(),
  });
  return created;
}

async function saveCartItems(cart, items) {
  const { data } = await http.patch(`/carts/${cart.id}`, { items, updatedAt: nowIso() });
  return data;
}

/**
 * Gắn thông tin sách hiện tại vào từng dòng giỏ. Dòng có sách đã bị xóa/ẩn được đánh dấu
 * available=false để UI yêu cầu khách bỏ ra trước khi đặt hàng.
 * Giá ở đây chỉ để hiển thị – khi đặt đơn server tính lại từ catalog.
 */
async function presentCart(cart) {
  const [{ data: books }, { data: categories }] = await Promise.all([http.get('/books'), http.get('/categories')]);
  const items = cart.items.map(item => {
    const book = books.find(entry => entry.id === item.bookId);
    const category = categories.find(entry => entry.id === book?.categoryId);
    const available = Boolean(book?.isPublished && category?.isActive);
    return {
      bookId: item.bookId,
      quantity: item.quantity,
      addedAt: item.addedAt,
      available,
      book: book ? {
        id: book.id,
        title: book.title,
        author: book.author,
        price: book.price,
        categoryName: category?.name || '',
        coverColor: book.coverColor || coverColorFor(book.id),
      } : null,
      lineTotal: available ? book.price * item.quantity : 0,
    };
  });
  return {
    id: cart.id,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
    hasUnavailableItems: items.some(item => !item.available),
    updatedAt: cart.updatedAt,
  };
}

/* ------------------------------------------------------------------ */

/**
 * [ENDPOINT] GET /api/cart  (auth: CUSTOMER)
 * -> 200 { cart: { items[{ bookId, quantity, available, book, lineTotal }], itemCount, subtotal, hasUnavailableItems } }
 * Server tạo cart rỗng nếu customer chưa có.
 */
export async function getMyCart() {
  const user = requireSession('CUSTOMER');
  // ---- MOCK ----
  const cart = await findOrCreateCart(user.id);
  return presentCart(cart);
  // ---- END MOCK ----
}

/**
 * [ENDPOINT] POST /api/cart/items  (auth: CUSTOMER)
 * body: { bookId, quantity } -> 200 { cart }
 * Nếu sách đã có trong giỏ thì cộng dồn số lượng (tối đa 99/dòng).
 * lỗi: 404 BOOK_NOT_FOUND, 409 BOOK_UNAVAILABLE (sách nháp/thể loại ẩn), 400 VALIDATION_ERROR
 */
export async function addCartItem(bookId, quantity = 1) {
  const user = requireSession('CUSTOMER');
  assertQuantity(quantity);
  // ---- MOCK ----
  let book;
  try {
    ({ data: book } = await http.get(`/books/${encodeURIComponent(bookId)}`));
  } catch (error) {
    if (error.status === 404) throw new ApiError(404, 'BOOK_NOT_FOUND', 'Không tìm thấy sách.');
    throw error;
  }
  if (!book.isPublished) throw new ApiError(409, 'BOOK_UNAVAILABLE', 'Sách hiện không còn được bán.');

  const cart = await findOrCreateCart(user.id);
  const existing = cart.items.find(item => item.bookId === bookId);
  const nextQuantity = (existing?.quantity || 0) + quantity;
  if (nextQuantity > MAX_QUANTITY_PER_ITEM) {
    throw validationError({ quantity: `Mỗi đầu sách tối đa ${MAX_QUANTITY_PER_ITEM} cuốn.` }, `Mỗi đầu sách tối đa ${MAX_QUANTITY_PER_ITEM} cuốn.`);
  }
  const items = existing
    ? cart.items.map(item => (item.bookId === bookId ? { ...item, quantity: nextQuantity } : item))
    : [...cart.items, { bookId, quantity, addedAt: nowIso() }];
  return presentCart(await saveCartItems(cart, items));
  // ---- END MOCK ----
}

/**
 * [ENDPOINT] PATCH /api/cart/items/:bookId  (auth: CUSTOMER)
 * body: { quantity } (1..99, ghi đè) -> 200 { cart } | 404 CART_ITEM_NOT_FOUND
 */
export async function updateCartItem(bookId, quantity) {
  const user = requireSession('CUSTOMER');
  assertQuantity(quantity);
  // ---- MOCK ----
  const cart = await findOrCreateCart(user.id);
  if (!cart.items.some(item => item.bookId === bookId)) {
    throw new ApiError(404, 'CART_ITEM_NOT_FOUND', 'Sách không có trong giỏ.');
  }
  const items = cart.items.map(item => (item.bookId === bookId ? { ...item, quantity } : item));
  return presentCart(await saveCartItems(cart, items));
  // ---- END MOCK ----
}

/**
 * [ENDPOINT] DELETE /api/cart/items/:bookId  (auth: CUSTOMER) -> 200 { cart }
 * Idempotent: xóa item không tồn tại vẫn trả 200.
 */
export async function removeCartItem(bookId) {
  const user = requireSession('CUSTOMER');
  // ---- MOCK ----
  const cart = await findOrCreateCart(user.id);
  return presentCart(await saveCartItems(cart, cart.items.filter(item => item.bookId !== bookId)));
  // ---- END MOCK ----
}

/**
 * [INTERNAL] Server tự làm rỗng giỏ trong cùng transaction với POST /api/orders.
 * Client KHÔNG cần endpoint riêng; hàm này chỉ phục vụ mock.
 */
export async function mockClearCart(customerId) {
  const cart = await findOrCreateCart(customerId);
  await saveCartItems(cart, []);
}

/** MOCK: đọc cart thô (chưa present) để orderApi tạo snapshot. */
export async function mockGetRawCart(customerId) {
  return findOrCreateCart(customerId);
}
