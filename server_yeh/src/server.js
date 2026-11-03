/**
 * Book Store API – ExpressJS + MongoDB (Mongoose).
 * Contract: ../../APIContract.md. Auth nằm ở ./auth/auth.js.
 *
 * Bố cục file:
 *   1. Config & bootstrap
 *   2. Errors & helpers
 *   3. Validators
 *   4. Mongoose models
 *   5. Serializers
 *   6. Domain constants (state machine đơn hàng)
 *   7. Routes: users, catalog, cart, orders, admin
 *   8. Error handling
 *   9. Start
 *
 * .env: PORT, HOST, URI (vd: mongodb://127.0.0.1:27017), DBNAME, JWT_SECRET, JWT_EXPIRES_IN, CORS_ORIGIN
 */
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

/* ================================================================== */
/* 1. Config                                                            */
/* ================================================================== */

try {
  process.loadEnvFile(path.resolve(__dirname, '..', '.env'));
} catch {
  // Không có .env -> dùng biến môi trường hệ thống.
}

const { createAuth } = require('./auth/auth');

const config = {
  port: Number(process.env.PORT) || 8888,
  host: process.env.HOST || '127.0.0.1',
  mongoUri: process.env.URI || process.env.URL || 'mongodb://127.0.0.1:27017',
  dbName: process.env.DBNAME || 'bookstore',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(origin => origin.trim()),
};

/* ================================================================== */
/* 2. Errors & helpers                                                  */
/* ================================================================== */

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const notFound = (code, message) => new ApiError(404, code, message);

/** Express 5 đã tự bắt promise reject; wrapper giữ lại để rõ ràng và tương thích. */
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function slugify(text) {
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

function randomSuffix(bytes = 2) {
  return crypto.randomBytes(bytes).toString('hex');
}

/** Chuyển document/lean object sang dạng API: `_id` -> `id`, bỏ `__v`. */
function toApi(doc) {
  if (!doc) return doc;
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const { _id, __v, ...rest } = plain;
  return { id: _id, ...rest };
}

/* ================================================================== */
/* 3. Validators (đồng bộ với client_yeh/src/services/api/*)            */
/* ================================================================== */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(0|\+84)\d{9}$/;
const ISBN_PATTERN = /^(\d{9}[\dXx]|\d{13})$/;
const ADDRESS_FIELDS = ['recipientName', 'phone', 'street', 'ward', 'district', 'city'];
const ADDRESS_LABELS = {
  recipientName: 'người nhận',
  phone: 'số điện thoại',
  street: 'số nhà, đường',
  ward: 'phường/xã',
  district: 'quận/huyện',
  city: 'tỉnh/thành phố',
};
const MAX_QUANTITY_PER_ITEM = 99;
const NOTE_MAX_LENGTH = 500;
const MAX_IMAGE_URLS = 5;

const validators = {
  error(details, message = 'Dữ liệu không hợp lệ.') {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  },

  isEmail: value => EMAIL_PATTERN.test(String(value || '')),

  registerInput({ fullName, email, phone, password } = {}) {
    const errors = {};
    if (!String(fullName || '').trim()) errors.fullName = 'Vui lòng nhập họ tên.';
    if (!EMAIL_PATTERN.test(String(email || '').trim())) errors.email = 'Email không hợp lệ.';
    if (phone && !PHONE_PATTERN.test(String(phone).trim())) errors.phone = 'Số điện thoại không hợp lệ.';
    if (typeof password !== 'string' || password.length < 6) errors.password = 'Mật khẩu tối thiểu 6 ký tự.';
    return errors;
  },

  address(address) {
    const errors = {};
    if (!address || typeof address !== 'object') {
      ADDRESS_FIELDS.forEach(field => { errors[field] = `Vui lòng nhập ${ADDRESS_LABELS[field]}.`; });
      return errors;
    }
    ADDRESS_FIELDS.forEach(field => {
      if (!String(address[field] || '').trim()) errors[field] = `Vui lòng nhập ${ADDRESS_LABELS[field]}.`;
    });
    if (address.phone && !PHONE_PATTERN.test(String(address.phone).trim())) errors.phone = 'Số điện thoại không hợp lệ.';
    return errors;
  },

  bookInput(input) {
    const errors = {};
    if (!String(input.title || '').trim()) errors.title = 'Vui lòng nhập tên sách.';
    if (!String(input.author || '').trim()) errors.author = 'Vui lòng nhập tác giả.';
    if (!input.categoryId) errors.categoryId = 'Vui lòng chọn thể loại.';
    const price = Number(input.price);
    if (!Number.isInteger(price) || price <= 0) errors.price = 'Giá bán phải là số nguyên dương.';
    const isbn = String(input.isbn || '').replace(/-/g, '').trim();
    if (isbn && !ISBN_PATTERN.test(isbn)) errors.isbn = 'ISBN phải gồm 10 hoặc 13 ký tự số.';
    if (input.imageUrls !== undefined) {
      if (!Array.isArray(input.imageUrls) || input.imageUrls.some(url => typeof url !== 'string')) {
        errors.imageUrls = 'Danh sách ảnh phải là mảng chuỗi URL.';
      } else if (input.imageUrls.length > MAX_IMAGE_URLS) {
        errors.imageUrls = `Tối đa ${MAX_IMAGE_URLS} ảnh mỗi sách.`;
      }
    }
    return errors;
  },

  categoryInput(input) {
    const errors = {};
    const name = String(input.name || '').trim();
    if (!name) errors.name = 'Vui lòng nhập tên thể loại.';
    else if (name.length > 80) errors.name = 'Tên thể loại tối đa 80 ký tự.';
    return errors;
  },

  quantity(value) {
    if (!Number.isInteger(value) || value < 1 || value > MAX_QUANTITY_PER_ITEM) {
      throw validators.error({ quantity: `Số lượng phải từ 1 đến ${MAX_QUANTITY_PER_ITEM}.` }, `Số lượng phải từ 1 đến ${MAX_QUANTITY_PER_ITEM}.`);
    }
  },
};

function normalizeAddress(address) {
  return ADDRESS_FIELDS.reduce((acc, key) => ({ ...acc, [key]: String(address?.[key] || '').trim() }), {});
}

function normalizeBookInput(input) {
  const book = {
    title: String(input.title).trim(),
    author: String(input.author).trim(),
    publisher: String(input.publisher || '').trim(),
    isbn: String(input.isbn || '').replace(/-/g, '').trim().toUpperCase(),
    description: String(input.description || '').trim(),
    categoryId: String(input.categoryId),
    price: Number(input.price),
    isPublished: Boolean(input.isPublished),
  };
  if (Array.isArray(input.imageUrls)) book.imageUrls = input.imageUrls.map(url => url.trim()).filter(Boolean);
  return book;
}

/* ================================================================== */
/* 4. Mongoose models (_id dạng string để giữ nguyên id của db.json)    */
/* ================================================================== */

const { Schema } = mongoose;

const addressSchema = new Schema({
  recipientName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  ward: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
}, { _id: false });

const userSchema = new Schema({
  _id: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['CUSTOMER', 'ADMIN'], default: 'CUSTOMER' },
  defaultShippingAddress: { type: addressSchema, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

const categorySchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

const bookSchema = new Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  publisher: { type: String, default: '' },
  isbn: { type: String, default: '' },
  description: { type: String, default: '' },
  categoryId: { type: String, required: true, ref: 'Category' },
  price: { type: Number, required: true, min: 1, validate: Number.isInteger },
  stock: { type: Number }, // có trong dữ liệu mẫu, MVP chưa dùng (không quản lý tồn kho)
  imageUrls: { type: [String], default: [] },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });
bookSchema.index({ isbn: 1 }, { unique: true, partialFilterExpression: { isbn: { $type: 'string', $gt: '' } } });
bookSchema.index({ isPublished: 1, categoryId: 1 });

const cartItemSchema = new Schema({
  bookId: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1, max: MAX_QUANTITY_PER_ITEM },
  addedAt: { type: Date, default: Date.now },
}, { _id: false });

const cartSchema = new Schema({
  _id: { type: String, required: true },
  customerId: { type: String, required: true, unique: true, ref: 'User' },
  items: { type: [cartItemSchema], default: [] },
}, { timestamps: true, versionKey: false });

const FULFILLMENT_STATUSES = ['RECEIVED', 'CONFIRMED', 'HANDED_TO_CARRIER', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
const PAYMENT_METHODS = ['COD', 'PREPAID'];
const PAYMENT_STATUSES = ['UNPAID', 'PENDING', 'PAID', 'FAILED'];

const orderItemSchema = new Schema({
  bookId: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, default: '' },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
}, { _id: false });

const statusHistorySchema = new Schema({
  status: { type: String, enum: FULFILLMENT_STATUSES, required: true },
  at: { type: Date, default: Date.now },
  by: { type: String },
  reason: { type: String },
}, { _id: false });

const orderSchema = new Schema({
  _id: { type: String, required: true },
  customerId: { type: String, required: true, ref: 'User' },
  items: { type: [orderItemSchema], required: true },
  shippingAddress: { type: addressSchema, required: true },
  paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
  paymentStatus: { type: String, enum: PAYMENT_STATUSES, required: true },
  fulfillmentStatus: { type: String, enum: FULFILLMENT_STATUSES, default: 'RECEIVED' },
  note: { type: String, default: '', maxlength: NOTE_MAX_LENGTH },
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  statusHistory: { type: [statusHistorySchema], default: [] },
  idempotencyKey: { type: String },
}, { timestamps: true, versionKey: false });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ fulfillmentStatus: 1, createdAt: -1 });
orderSchema.index(
  { customerId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
);

/** Sequence atomic cho mã đơn: { _id: 'order-2026', seq: 3 } */
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
}, { versionKey: false });

// Tên collection khớp với key trong db.json / file export.
const User = mongoose.model('User', userSchema, 'users');
const Category = mongoose.model('Category', categorySchema, 'categories');
const Book = mongoose.model('Book', bookSchema, 'books');
const Cart = mongoose.model('Cart', cartSchema, 'carts');
const Order = mongoose.model('Order', orderSchema, 'orders');
const Counter = mongoose.model('Counter', counterSchema, 'counters');

/* ================================================================== */
/* 5. Serializers                                                       */
/* ================================================================== */

function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash, password, ...rest } = toApi(user);
  return rest;
}

function presentBook(book, categoriesById) {
  const category = categoriesById.get(book.categoryId);
  return { ...toApi(book), categoryName: category?.name || 'Chưa phân loại' };
}

async function categoryMap(filter = {}) {
  const categories = await Category.find(filter).lean();
  return new Map(categories.map(category => [category._id, category]));
}

/** Sách đang bán: isPublished=true và thể loại isActive=true. */
async function findSellableBooks(extraFilter = {}) {
  const categoriesById = await categoryMap({ isActive: true });
  const books = await Book.find({
    ...extraFilter,
    isPublished: true,
    categoryId: { $in: [...categoriesById.keys()] },
  }).sort({ createdAt: -1 }).lean();
  return { books, categoriesById };
}

/**
 * Shape chung của mọi endpoint giỏ hàng (APIContract §6).
 * Giá lấy từ catalog hiện tại, chỉ để hiển thị.
 */
async function presentCart(cart) {
  const bookIds = cart.items.map(item => item.bookId);
  const [books, categoriesById] = await Promise.all([
    Book.find({ _id: { $in: bookIds } }).lean(),
    categoryMap(),
  ]);
  const booksById = new Map(books.map(book => [book._id, book]));

  const items = cart.items.map(item => {
    const book = booksById.get(item.bookId);
    const category = book && categoriesById.get(book.categoryId);
    const available = Boolean(book?.isPublished && category?.isActive);
    return {
      bookId: item.bookId,
      quantity: item.quantity,
      addedAt: item.addedAt,
      available,
      book: book ? {
        id: book._id,
        title: book.title,
        author: book.author,
        price: book.price,
        categoryName: category?.name || '',
        imageUrls: book.imageUrls || [],
      } : null,
      lineTotal: available ? book.price * item.quantity : 0,
    };
  });

  return {
    id: cart._id,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
    hasUnavailableItems: items.some(item => !item.available),
    updatedAt: cart.updatedAt,
  };
}

/* ================================================================== */
/* 6. Domain constants                                                  */
/* ================================================================== */

const FULFILLMENT_LABELS = {
  RECEIVED: 'Mới nhận',
  CONFIRMED: 'Đã xác nhận',
  HANDED_TO_CARRIER: 'Đã giao vận chuyển',
  IN_TRANSIT: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

/** State machine – phải khớp client_yeh/src/constants/order.js */
const FULFILLMENT_TRANSITIONS = {
  RECEIVED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['HANDED_TO_CARRIER', 'CANCELLED'],
  HANDED_TO_CARRIER: ['IN_TRANSIT'],
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const INITIAL_PAYMENT_STATUS = { COD: 'UNPAID', PREPAID: 'PENDING' };

async function nextOrderId() {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { _id: `order-${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  return `order-${year}-${String(counter.seq).padStart(4, '0')}`;
}

/* ================================================================== */
/* 7. App & routes                                                      */
/* ================================================================== */

const app = express();
const auth = createAuth({ User, Cart, ApiError, asyncHandler, validators, toPublicUser });
const { authenticate, requireRole } = auth;
const customerOnly = [authenticate, requireRole('CUSTOMER')];
const adminOnly = [authenticate, requireRole('ADMIN')];

app.disable('x-powered-by');
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

/* ---------------------------- Auth (A1–A4) ---------------------------- */
app.use('/api/auth', auth.router);

/* ---------------------------- Users (U1) ------------------------------ */

/**
 * U1. PATCH /api/users/me  (auth)
 * body: { fullName?, phone?, defaultShippingAddress? } -> 200 { user }
 */
app.patch('/api/users/me', authenticate, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const update = {};
  const errors = {};

  if (body.fullName !== undefined) {
    if (!String(body.fullName).trim()) errors.fullName = 'Vui lòng nhập họ tên.';
    else update.fullName = String(body.fullName).trim();
  }
  if (body.phone !== undefined) {
    const phone = String(body.phone || '').trim();
    if (phone && !PHONE_PATTERN.test(phone)) errors.phone = 'Số điện thoại không hợp lệ.';
    else update.phone = phone;
  }
  if (body.defaultShippingAddress !== undefined) {
    if (body.defaultShippingAddress === null) {
      update.defaultShippingAddress = null;
    } else {
      Object.assign(errors, validators.address(body.defaultShippingAddress));
      update.defaultShippingAddress = normalizeAddress(body.defaultShippingAddress);
    }
  }
  if (Object.keys(errors).length) throw validators.error(errors);

  const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { returnDocument: 'after', runValidators: true });
  res.json({ user: toPublicUser(user) });
}));

/* ---------------------------- Catalog (C1–C3) ------------------------- */

/** C1. GET /api/categories (public) -> Category[] (active, kèm bookCount sách đang bán) */
app.get('/api/categories', asyncHandler(async (req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find({ isActive: true }).sort({ name: 1 }).lean(),
    Book.aggregate([{ $match: { isPublished: true } }, { $group: { _id: '$categoryId', count: { $sum: 1 } } }]),
  ]);
  const countById = new Map(counts.map(entry => [entry._id, entry.count]));
  res.json(categories.map(category => ({ ...toApi(category), bookCount: countById.get(category._id) || 0 })));
}));

/** C2. GET /api/books (public) -> Book[] (đang bán, kèm categoryName) */
app.get('/api/books', asyncHandler(async (req, res) => {
  const { books, categoriesById } = await findSellableBooks();
  res.json(books.map(book => presentBook(book, categoriesById)));
}));

/** C3. GET /api/books/:bookId (public) -> Book | 404 BOOK_NOT_FOUND */
app.get('/api/books/:bookId', asyncHandler(async (req, res) => {
  const { books, categoriesById } = await findSellableBooks({ _id: req.params.bookId });
  if (!books.length) throw notFound('BOOK_NOT_FOUND', 'Không tìm thấy sách.');
  res.json(presentBook(books[0], categoriesById));
}));

/* ---------------------------- Cart (K1–K4) ---------------------------- */

async function findOrCreateCart(customerId) {
  return Cart.findOneAndUpdate(
    { customerId },
    { $setOnInsert: { _id: `cart-${customerId}`, customerId, items: [] } },
    { upsert: true, returnDocument: 'after', lean: true },
  );
}

async function sendCart(res, customerId) {
  const cart = await Cart.findOne({ customerId }).lean();
  res.json(await presentCart(cart));
}

/** K1. GET /api/cart (CUSTOMER) */
app.get('/api/cart', customerOnly, asyncHandler(async (req, res) => {
  const cart = await findOrCreateCart(req.user._id);
  res.json(await presentCart(cart));
}));

/**
 * K2. POST /api/cart/items (CUSTOMER)
 * body: { bookId, quantity } – cộng dồn nếu đã có, tối đa 99/dòng. Cập nhật atomic.
 */
app.post('/api/cart/items', customerOnly, asyncHandler(async (req, res) => {
  const bookId = String(req.body?.bookId || '');
  const quantity = req.body?.quantity === undefined ? 1 : Number(req.body.quantity);
  if (!bookId) throw validators.error({ bookId: 'Thiếu mã sách.' });
  validators.quantity(quantity);

  const book = await Book.findById(bookId).lean();
  if (!book) throw notFound('BOOK_NOT_FOUND', 'Không tìm thấy sách.');
  const category = await Category.findById(book.categoryId).lean();
  if (!book.isPublished || !category?.isActive) {
    throw new ApiError(409, 'BOOK_UNAVAILABLE', 'Sách hiện không còn được bán.', { bookIds: [bookId] });
  }

  const customerId = req.user._id;
  await findOrCreateCart(customerId);
  const limitMessage = `Mỗi đầu sách tối đa ${MAX_QUANTITY_PER_ITEM} cuốn.`;

  // Thử cộng dồn vào dòng đã có (chỉ khi không vượt giới hạn).
  const incremented = await Cart.updateOne(
    { customerId, items: { $elemMatch: { bookId, quantity: { $lte: MAX_QUANTITY_PER_ITEM - quantity } } } },
    { $inc: { 'items.$.quantity': quantity } },
  );
  if (!incremented.modifiedCount) {
    // Chưa có dòng -> thêm mới (điều kiện $ne chống thêm trùng khi 2 request song song).
    const pushed = await Cart.updateOne(
      { customerId, 'items.bookId': { $ne: bookId } },
      { $push: { items: { bookId, quantity, addedAt: new Date() } } },
    );
    if (!pushed.modifiedCount) throw validators.error({ quantity: limitMessage }, limitMessage);
  }

  await sendCart(res, customerId);
}));

/** K3. PATCH /api/cart/items/:bookId (CUSTOMER) body: { quantity } – ghi đè */
app.patch('/api/cart/items/:bookId', customerOnly, asyncHandler(async (req, res) => {
  const quantity = Number(req.body?.quantity);
  validators.quantity(quantity);
  const result = await Cart.updateOne(
    { customerId: req.user._id, 'items.bookId': req.params.bookId },
    { $set: { 'items.$.quantity': quantity } },
  );
  if (!result.matchedCount) throw notFound('CART_ITEM_NOT_FOUND', 'Sách không có trong giỏ.');
  await sendCart(res, req.user._id);
}));

/** K4. DELETE /api/cart/items/:bookId (CUSTOMER) – idempotent */
app.delete('/api/cart/items/:bookId', customerOnly, asyncHandler(async (req, res) => {
  await findOrCreateCart(req.user._id);
  await Cart.updateOne({ customerId: req.user._id }, { $pull: { items: { bookId: req.params.bookId } } });
  await sendCart(res, req.user._id);
}));

/* ---------------------------- Orders (O1–O3) -------------------------- */

/**
 * O1. POST /api/orders (CUSTOMER)
 * body: { shippingAddress, paymentMethod, note?, saveAsDefaultAddress? }
 * header (tùy chọn): Idempotency-Key
 * Giá/tổng tiền luôn tính từ catalog hiện tại – không nhận từ client.
 */
app.post('/api/orders', customerOnly, asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const body = req.body || {};
  const note = String(body.note || '').trim();
  const idempotencyKey = req.get('Idempotency-Key')?.trim().slice(0, 100) || undefined;

  // Request lặp lại cùng key -> trả lại đơn đã tạo.
  if (idempotencyKey) {
    const existing = await Order.findOne({ customerId, idempotencyKey }).lean();
    if (existing) return res.status(201).json(toApi(existing));
  }

  const errors = validators.address(body.shippingAddress);
  if (!PAYMENT_METHODS.includes(body.paymentMethod)) errors.paymentMethod = 'Phương thức thanh toán không hợp lệ.';
  if (note.length > NOTE_MAX_LENGTH) errors.note = `Ghi chú tối đa ${NOTE_MAX_LENGTH} ký tự.`;
  if (Object.keys(errors).length) {
    throw validators.error(errors, errors.paymentMethod || errors.note || 'Vui lòng kiểm tra lại địa chỉ giao hàng.');
  }

  // 1. Đọc giỏ
  const cart = await findOrCreateCart(customerId);
  if (!cart.items.length) throw new ApiError(400, 'CART_EMPTY', 'Giỏ hàng đang trống.');

  // 2. Đọc giá hiện tại & kiểm tra còn bán
  const bookIds = cart.items.map(item => item.bookId);
  const [books, categoriesById] = await Promise.all([
    Book.find({ _id: { $in: bookIds } }).lean(),
    categoryMap(),
  ]);
  const booksById = new Map(books.map(book => [book._id, book]));
  const unavailable = bookIds.filter(id => {
    const book = booksById.get(id);
    return !book?.isPublished || !categoriesById.get(book.categoryId)?.isActive;
  });
  if (unavailable.length) {
    throw new ApiError(409, 'BOOK_UNAVAILABLE',
      'Một số sách trong giỏ không còn được bán. Vui lòng bỏ ra trước khi đặt hàng.', { bookIds: unavailable });
  }

  // 3–4. Snapshot & tổng tiền
  const items = cart.items.map(item => {
    const book = booksById.get(item.bookId);
    return {
      bookId: book._id,
      title: book.title,
      author: book.author,
      unitPrice: book.price,
      quantity: item.quantity,
      lineTotal: book.price * item.quantity,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingFee = 0; // chưa có chính sách phí ship (SystemDesign §8.3)
  const shippingAddress = normalizeAddress(body.shippingAddress);
  const now = new Date();

  // 5–6. Tạo đơn
  let order;
  try {
    order = await Order.create({
      _id: await nextOrderId(),
      customerId,
      items,
      shippingAddress,
      paymentMethod: body.paymentMethod,
      paymentStatus: INITIAL_PAYMENT_STATUS[body.paymentMethod],
      fulfillmentStatus: 'RECEIVED',
      note,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      statusHistory: [{ status: 'RECEIVED', at: now, by: customerId }],
      idempotencyKey,
    });
  } catch (error) {
    if (error?.code === 11000 && idempotencyKey) {
      const existing = await Order.findOne({ customerId, idempotencyKey }).lean();
      if (existing) return res.status(201).json(toApi(existing));
    }
    throw error;
  }

  // 7. Gỡ đúng các sách đã đặt khỏi giỏ (sách khách vừa thêm song song vẫn được giữ).
  // Ghi chú: nếu MongoDB chạy replica set, nên gói bước 5–8 trong session.withTransaction().
  await Cart.updateOne({ customerId }, { $pull: { items: { bookId: { $in: items.map(item => item.bookId) } } } });

  // 8. Lưu địa chỉ mặc định
  if (body.saveAsDefaultAddress === true) {
    await User.updateOne({ _id: customerId }, { $set: { defaultShippingAddress: shippingAddress } });
  }

  const { idempotencyKey: _ignored, ...result } = toApi(order);
  res.status(201).json(result);
}));

/** O2. GET /api/orders (CUSTOMER) -> Order[] của chính customer, mới nhất trước */
app.get('/api/orders', customerOnly, asyncHandler(async (req, res) => {
  const orders = await Order.find({ customerId: req.user._id }).select('-idempotencyKey').sort({ createdAt: -1 }).lean();
  res.json(orders.map(toApi));
}));

/** O3. GET /api/orders/:orderId (CUSTOMER) – đơn của người khác cũng trả 404 */
app.get('/api/orders/:orderId', customerOnly, asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, customerId: req.user._id }).select('-idempotencyKey').lean();
  if (!order) throw notFound('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');
  res.json(toApi(order));
}));

/* ---------------------------- Admin: books (AB1–AB4) ------------------ */

const admin = express.Router();
admin.use(adminOnly);

async function assertCategoryExists(categoryId) {
  if (!(await Category.exists({ _id: categoryId }))) {
    throw validators.error({ categoryId: 'Thể loại không tồn tại.' });
  }
}

async function assertIsbnUnique(isbn, exceptId) {
  if (!isbn) return;
  const filter = { isbn };
  if (exceptId) filter._id = { $ne: exceptId };
  if (await Book.exists(filter)) {
    throw new ApiError(409, 'ISBN_TAKEN', 'ISBN đã tồn tại.', { isbn: 'ISBN đã tồn tại.' });
  }
}

/** AB1. GET /api/admin/books -> Book[] (cả nháp) */
admin.get('/books', asyncHandler(async (req, res) => {
  const [books, categoriesById] = await Promise.all([Book.find().sort({ createdAt: -1 }).lean(), categoryMap()]);
  res.json(books.map(book => presentBook(book, categoriesById)));
}));

/** AB2. POST /api/admin/books -> 201 Book */
admin.post('/books', asyncHandler(async (req, res) => {
  const input = req.body || {};
  const errors = validators.bookInput(input);
  if (Object.keys(errors).length) throw validators.error(errors);
  const data = normalizeBookInput(input);

  await assertCategoryExists(data.categoryId);
  await assertIsbnUnique(data.isbn);

  const book = await Book.create({
    _id: `book-${slugify(data.title).slice(0, 40) || 'sach'}-${randomSuffix()}`,
    imageUrls: [],
    ...data,
  });
  res.status(201).json(presentBook(book.toObject(), await categoryMap()));
}));

/** AB3. PATCH /api/admin/books/:bookId (partial) -> Book */
admin.patch('/books/:bookId', asyncHandler(async (req, res) => {
  const current = await Book.findById(req.params.bookId).lean();
  if (!current) throw notFound('BOOK_NOT_FOUND', 'Không tìm thấy sách.');

  const merged = { ...current, ...(req.body || {}) };
  const errors = validators.bookInput(merged);
  if (Object.keys(errors).length) throw validators.error(errors);
  const data = normalizeBookInput(merged);

  if (data.categoryId !== current.categoryId) await assertCategoryExists(data.categoryId);
  await assertIsbnUnique(data.isbn, current._id);

  const book = await Book.findByIdAndUpdate(current._id, { $set: data }, { returnDocument: 'after', runValidators: true, lean: true });
  res.json(presentBook(book, await categoryMap()));
}));

/** AB4. DELETE /api/admin/books/:bookId -> 204 (gỡ khỏi mọi giỏ, đơn cũ giữ snapshot) */
admin.delete('/books/:bookId', asyncHandler(async (req, res) => {
  const result = await Book.deleteOne({ _id: req.params.bookId });
  if (!result.deletedCount) throw notFound('BOOK_NOT_FOUND', 'Không tìm thấy sách.');
  await Cart.updateMany({ 'items.bookId': req.params.bookId }, { $pull: { items: { bookId: req.params.bookId } } });
  res.status(204).end();
}));

/* ---------------------------- Admin: categories (AC1–AC4) ------------- */

/** AC1. GET /api/admin/categories -> Category[] (cả ẩn, bookCount tính cả nháp) */
admin.get('/categories', asyncHandler(async (req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Book.aggregate([{ $group: { _id: '$categoryId', count: { $sum: 1 } } }]),
  ]);
  const countById = new Map(counts.map(entry => [entry._id, entry.count]));
  res.json(categories.map(category => ({ ...toApi(category), bookCount: countById.get(category._id) || 0 })));
}));

async function assertSlugUnique(slug, exceptId) {
  const filter = { slug };
  if (exceptId) filter._id = { $ne: exceptId };
  if (await Category.exists(filter)) {
    throw new ApiError(409, 'CATEGORY_NAME_TAKEN', 'Thể loại đã tồn tại.', { name: 'Tên thể loại đã tồn tại.' });
  }
}

/** AC2. POST /api/admin/categories -> 201 Category */
admin.post('/categories', asyncHandler(async (req, res) => {
  const input = req.body || {};
  const errors = validators.categoryInput(input);
  if (Object.keys(errors).length) throw validators.error(errors);
  const slug = slugify(input.name);
  if (!slug) throw validators.error({ name: 'Tên thể loại không hợp lệ.' });
  await assertSlugUnique(slug);

  let id = `cat-${slug}`;
  if (await Category.exists({ _id: id })) id = `${id}-${randomSuffix()}`;
  const category = await Category.create({
    _id: id,
    name: String(input.name).trim(),
    slug,
    description: String(input.description || '').trim(),
    isActive: input.isActive === undefined ? true : Boolean(input.isActive),
  });
  res.status(201).json({ ...toApi(category), bookCount: 0 });
}));

/** AC3. PATCH /api/admin/categories/:categoryId (partial) -> Category */
admin.patch('/categories/:categoryId', asyncHandler(async (req, res) => {
  const current = await Category.findById(req.params.categoryId).lean();
  if (!current) throw notFound('NOT_FOUND', 'Không tìm thấy thể loại.');
  const body = req.body || {};
  const merged = { ...current, ...body };
  const errors = validators.categoryInput(merged);
  if (Object.keys(errors).length) throw validators.error(errors);

  const slug = slugify(merged.name);
  await assertSlugUnique(slug, current._id);
  const category = await Category.findByIdAndUpdate(current._id, {
    $set: {
      name: String(merged.name).trim(),
      slug,
      description: String(merged.description || '').trim(),
      isActive: Boolean(merged.isActive),
    },
  }, { returnDocument: 'after', lean: true });
  const bookCount = await Book.countDocuments({ categoryId: current._id });
  res.json({ ...toApi(category), bookCount });
}));

/** AC4. DELETE /api/admin/categories/:categoryId -> 204 | 409 CATEGORY_IN_USE */
admin.delete('/categories/:categoryId', asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  if (!(await Category.exists({ _id: categoryId }))) throw notFound('NOT_FOUND', 'Không tìm thấy thể loại.');
  const bookCount = await Book.countDocuments({ categoryId });
  if (bookCount) {
    throw new ApiError(409, 'CATEGORY_IN_USE',
      `Không thể xóa: còn ${bookCount} sách thuộc thể loại này. Hãy chuyển sách sang thể loại khác hoặc ẩn thể loại.`);
  }
  await Category.deleteOne({ _id: categoryId });
  res.status(204).end();
}));

/* ---------------------------- Admin: orders (AO1–AO3) ----------------- */

/** AO1. GET /api/admin/orders -> (Order & { customer })[] */
admin.get('/orders', asyncHandler(async (req, res) => {
  const orders = await Order.find().select('-idempotencyKey').sort({ createdAt: -1 }).lean();
  const customerIds = [...new Set(orders.map(order => order.customerId))];
  const users = await User.find({ _id: { $in: customerIds } }).select('fullName email phone').lean();
  const usersById = new Map(users.map(user => [user._id, user]));

  res.json(orders.map(order => {
    const customer = usersById.get(order.customerId);
    return {
      ...toApi(order),
      customer: customer
        ? { id: customer._id, fullName: customer.fullName, email: customer.email, phone: customer.phone }
        : { id: order.customerId, fullName: order.shippingAddress?.recipientName || 'Khách đã xóa', email: '', phone: '' },
    };
  }));
}));

/**
 * AO2. PATCH /api/admin/orders/:orderId/status  body: { status, reason? }
 * Theo state machine; optimistic concurrency trên trạng thái hiện tại.
 */
admin.patch('/orders/:orderId/status', asyncHandler(async (req, res) => {
  const status = String(req.body?.status || '');
  const reason = String(req.body?.reason || '').trim().slice(0, 500);
  if (!FULFILLMENT_STATUSES.includes(status)) throw validators.error({ status: 'Trạng thái không hợp lệ.' });

  const order = await Order.findById(req.params.orderId).lean();
  if (!order) throw notFound('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');

  const allowed = FULFILLMENT_TRANSITIONS[order.fulfillmentStatus] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(409, 'INVALID_STATUS_TRANSITION',
      `Không thể chuyển từ "${FULFILLMENT_LABELS[order.fulfillmentStatus]}" sang "${FULFILLMENT_LABELS[status]}".`);
  }

  const set = { fulfillmentStatus: status };
  if (status === 'DELIVERED' && order.paymentMethod === 'COD') set.paymentStatus = 'PAID';
  const historyEntry = { status, at: new Date(), by: req.user._id };
  if (reason) historyEntry.reason = reason;

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, fulfillmentStatus: order.fulfillmentStatus },
    { $set: set, $push: { statusHistory: historyEntry } },
    { returnDocument: 'after', lean: true, projection: { idempotencyKey: 0 } },
  );
  if (!updated) {
    throw new ApiError(409, 'INVALID_STATUS_TRANSITION', 'Đơn hàng vừa được cập nhật bởi người khác. Vui lòng tải lại.');
  }
  res.json(toApi(updated));
}));

/**
 * AO3. PATCH /api/admin/orders/:orderId/payment-status  body: { paymentStatus: 'PAID'|'FAILED' }
 * Chỉ cho đơn PREPAID đang PENDING/FAILED và chưa hủy.
 */
admin.patch('/orders/:orderId/payment-status', asyncHandler(async (req, res) => {
  const paymentStatus = String(req.body?.paymentStatus || '');
  if (!['PAID', 'FAILED'].includes(paymentStatus)) {
    throw validators.error({ paymentStatus: 'Trạng thái thanh toán không hợp lệ.' });
  }
  if (!(await Order.exists({ _id: req.params.orderId }))) throw notFound('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');

  const updated = await Order.findOneAndUpdate(
    {
      _id: req.params.orderId,
      paymentMethod: 'PREPAID',
      paymentStatus: { $in: ['PENDING', 'FAILED'] },
      fulfillmentStatus: { $ne: 'CANCELLED' },
    },
    { $set: { paymentStatus } },
    { returnDocument: 'after', lean: true, projection: { idempotencyKey: 0 } },
  );
  if (!updated) throw new ApiError(409, 'INVALID_PAYMENT_TRANSITION', 'Không thể cập nhật thanh toán cho đơn này.');
  res.json(toApi(updated));
}));

app.use('/api/admin', admin);

/* ================================================================== */
/* 8. Error handling                                                    */
/* ================================================================== */

app.use('/api', (req, res, next) => {
  next(notFound('NOT_FOUND', `Không tìm thấy endpoint ${req.method} ${req.originalUrl}.`));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (err?.type === 'entity.parse.failed') {
      error = new ApiError(400, 'VALIDATION_ERROR', 'Body JSON không hợp lệ.');
    } else if (err?.type === 'entity.too.large') {
      error = new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Dữ liệu gửi lên quá lớn.');
    } else if (err instanceof mongoose.Error.ValidationError) {
      const details = Object.fromEntries(Object.entries(err.errors).map(([field, e]) => [field, e.message]));
      error = new ApiError(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ.', details);
    } else if (err instanceof mongoose.Error.CastError) {
      error = new ApiError(400, 'VALIDATION_ERROR', `Giá trị không hợp lệ cho ${err.path}.`);
    } else if (err?.code === 11000) {
      error = new ApiError(409, 'CONFLICT', 'Dữ liệu bị trùng.', err.keyValue);
    } else {
      console.error(`[error] ${req.method} ${req.originalUrl}`, err);
      error = new ApiError(500, 'INTERNAL_ERROR', 'Đã có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  }

  const payload = { code: error.code, message: error.message };
  if (error.details) payload.details = error.details;
  res.status(error.status).json({ error: payload });
});

/* ================================================================== */
/* 9. Start                                                             */
/* ================================================================== */

async function start() {
  await mongoose.connect(config.mongoUri, { dbName: config.dbName });
  console.log(`[db] Connected to MongoDB database "${config.dbName}"`);
  await Promise.all([User, Category, Book, Cart, Order, Counter].map(model => model.syncIndexes()));

  return new Promise(resolve => {
    const server = app.listen(config.port, config.host, () => {
      console.log(`[api] Server đang chạy tại http://${config.host}:${config.port}/api`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  start().catch(error => {
    console.error('[startup] Không khởi động được server:', error);
    process.exit(1);
  });
}

module.exports = { app, start, config, models: { User, Category, Book, Cart, Order, Counter } };
