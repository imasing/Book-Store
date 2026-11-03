import http from './httpClient';
import { withCover } from './catalogApi';

export const MAX_QUANTITY_PER_ITEM = 99;

/** Server trả cart với items[].book (có thể null nếu sách đã bị xóa). */
function presentCart(cart) {
  return { ...cart, items: cart.items.map(item => ({ ...item, book: withCover(item.book) })) };
}

/** GET /api/cart -> Cart */
export async function getMyCart() {
  const { data } = await http.get('/cart');
  return presentCart(data);
}

/** POST /api/cart/items  body: { bookId, quantity } (cộng dồn) -> Cart */
export async function addCartItem(bookId, quantity = 1) {
  const { data } = await http.post('/cart/items', { bookId, quantity });
  return presentCart(data);
}

/** PATCH /api/cart/items/:bookId  body: { quantity } (ghi đè) -> Cart */
export async function updateCartItem(bookId, quantity) {
  const { data } = await http.patch(`/cart/items/${encodeURIComponent(bookId)}`, { quantity });
  return presentCart(data);
}

/** DELETE /api/cart/items/:bookId -> Cart */
export async function removeCartItem(bookId) {
  const { data } = await http.delete(`/cart/items/${encodeURIComponent(bookId)}`);
  return presentCart(data);
}
