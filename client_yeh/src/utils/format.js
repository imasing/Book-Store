export function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}₫`;
}

export function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('vi-VN') : '';
}

export function formatDateTime(iso) {
  return iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '';
}

/** "Văn học Việt Nam" -> "van-hoc-viet-nam" */
export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** So khớp từ khóa không phân biệt hoa thường và dấu tiếng Việt. */
export function normalizeSearch(text) {
  return slugify(text).replace(/-/g, ' ');
}

const COVER_COLORS = ['#bd684d', '#4c7865', '#54728a', '#8a6a4c', '#6d5a86', '#3f6f6a', '#9a5a63'];

/** Màu bìa giả lập (DB chưa có ảnh bìa thật) – ổn định theo id sách. */
export function coverColorFor(id) {
  const text = String(id || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return COVER_COLORS[hash % COVER_COLORS.length];
}

export function formatAddress(address) {
  if (!address) return '';
  return [address.street, address.ward, address.district, address.city].filter(Boolean).join(', ');
}
