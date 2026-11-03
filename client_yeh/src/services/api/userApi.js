import http from './httpClient';
import { getSession, saveSession } from '../session';

const PHONE_PATTERN = /^(0|\+84)\d{9}$/;
const ADDRESS_FIELDS = ['recipientName', 'phone', 'street', 'ward', 'district', 'city'];

export const ADDRESS_LABELS = {
  recipientName: 'Người nhận',
  phone: 'Số điện thoại',
  street: 'Số nhà, đường',
  ward: 'Phường/Xã',
  district: 'Quận/Huyện',
  city: 'Tỉnh/Thành phố',
};

export function emptyAddress() {
  return ADDRESS_FIELDS.reduce((acc, key) => ({ ...acc, [key]: '' }), {});
}

/** Dùng cho checkout (báo lỗi ngay trên form; server validate lại y hệt). */
export function validateAddress(address) {
  const errors = {};
  ADDRESS_FIELDS.forEach(field => {
    if (!String(address?.[field] || '').trim()) errors[field] = `Vui lòng nhập ${ADDRESS_LABELS[field].toLowerCase()}.`;
  });
  if (address?.phone && !PHONE_PATTERN.test(address.phone.trim())) errors.phone = 'Số điện thoại không hợp lệ.';
  return errors;
}

/** PATCH /api/users/me  body: { fullName?, phone?, defaultShippingAddress? } -> { user } */
export async function updateMyProfile(patch) {
  const { data } = await http.patch('/users/me', patch);
  saveSession({ ...getSession(), user: data.user });
  return data.user;
}
