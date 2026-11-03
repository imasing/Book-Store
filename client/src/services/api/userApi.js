import http from './httpClient';
import { getSession, saveSession } from '../session';
import { nowIso, requireSession, toPublicUser, validationError } from './mockGuards';

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

/** Dùng chung cho checkout và cập nhật hồ sơ (server validate lại y hệt). */
export function validateAddress(address) {
  const errors = {};
  ADDRESS_FIELDS.forEach(field => {
    if (!String(address?.[field] || '').trim()) errors[field] = `Vui lòng nhập ${ADDRESS_LABELS[field].toLowerCase()}.`;
  });
  if (address?.phone && !PHONE_PATTERN.test(address.phone.trim())) errors.phone = 'Số điện thoại không hợp lệ.';
  return errors;
}

export function normalizeAddress(address) {
  return ADDRESS_FIELDS.reduce((acc, key) => ({ ...acc, [key]: String(address?.[key] || '').trim() }), {});
}

/**
 * [ENDPOINT] PATCH /api/users/me  (auth: CUSTOMER | ADMIN)
 * body: { fullName?, phone?, defaultShippingAddress? } -> 200 { user }
 * Không cho phép sửa email/role/password qua endpoint này.
 */
export async function updateMyProfile(patch) {
  const user = requireSession();
  const body = {};
  if (patch.fullName !== undefined) {
    if (!patch.fullName.trim()) throw validationError({ fullName: 'Vui lòng nhập họ tên.' });
    body.fullName = patch.fullName.trim();
  }
  if (patch.phone !== undefined) {
    if (patch.phone && !PHONE_PATTERN.test(patch.phone)) throw validationError({ phone: 'Số điện thoại không hợp lệ.' });
    body.phone = patch.phone;
  }
  if (patch.defaultShippingAddress !== undefined) {
    const errors = validateAddress(patch.defaultShippingAddress);
    if (Object.keys(errors).length) throw validationError(errors);
    body.defaultShippingAddress = normalizeAddress(patch.defaultShippingAddress);
  }
  // ---- MOCK ----
  const { data } = await http.patch(`/users/${user.id}`, { ...body, updatedAt: nowIso() });
  // ---- END MOCK ----
  const publicUser = toPublicUser(data);
  saveSession({ ...getSession(), user: publicUser });
  return publicUser;
}
