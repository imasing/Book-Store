/**
 * Xuất dữ liệu DB tạm (../../db.json) thành file JSON cho từng collection MongoDB.
 *
 *   npm run export-data            -> ghi vào server_yeh/database/<collection>.json
 *
 * Định dạng: MongoDB Extended JSON (relaxed) dạng mảng – Date được ghi là { "$date": "..." }.
 * Import:
 *   mongoimport --uri "mongodb://127.0.0.1:27017" --db <DBNAME> --collection books --jsonArray --file database/books.json
 *   (hoặc MongoDB Compass > Add data > Import JSON)
 *
 * Chuyển đổi so với db.json:
 *   - `id` -> `_id` (giữ nguyên chuỗi id để quan hệ giữa các collection không đổi)
 *   - users: `password` (plaintext mock) -> `passwordHash` (bcrypt)
 *   - chuỗi ISO -> Date; thêm createdAt/updatedAt còn thiếu
 *   - orders: bổ sung shippingFee, note, statusHistory nếu thiếu
 *   - sinh thêm collection `counters` cho mã đơn order-YYYY-NNNN
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { EJSON } = require('mongoose').mongo.BSON;

const SOURCE = path.resolve(__dirname, '..', '..', 'db.json');
const OUT_DIR = path.resolve(__dirname, '..', 'database');
const DEFAULT_TIMESTAMP = '2026-10-01T08:00:00.000Z';

const toDate = value => new Date(value || DEFAULT_TIMESTAMP);

function withId({ id, ...rest }) {
  if (!id) throw new Error(`Bản ghi thiếu id: ${JSON.stringify(rest).slice(0, 80)}`);
  return { _id: id, ...rest };
}

function exportCategories(categories) {
  return categories.map(category => {
    const doc = withId(category);
    return {
      _id: doc._id,
      name: doc.name,
      slug: doc.slug,
      description: doc.description || '',
      isActive: doc.isActive !== false,
      createdAt: toDate(doc.createdAt),
      updatedAt: toDate(doc.updatedAt || doc.createdAt),
    };
  });
}

function exportBooks(books) {
  return books.map(book => {
    const { imageUrl, imageUrls, createdAt, updatedAt, ...doc } = withId(book);
    return {
      ...doc,
      publisher: doc.publisher || '',
      isbn: doc.isbn || '',
      description: doc.description || '',
      imageUrls: Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : (imageUrl ? [imageUrl] : []),
      isPublished: Boolean(doc.isPublished),
      createdAt: toDate(createdAt),
      updatedAt: toDate(updatedAt || createdAt),
    };
  });
}

function exportUsers(users) {
  return users.map(user => {
    const { password, passwordHash, createdAt, updatedAt, ...doc } = withId(user);
    if (!password && !passwordHash) throw new Error(`User ${doc._id} không có password để hash.`);
    return {
      ...doc,
      email: doc.email.trim().toLowerCase(),
      passwordHash: passwordHash || bcrypt.hashSync(password, 10),
      phone: doc.phone || '',
      defaultShippingAddress: doc.defaultShippingAddress || null,
      isActive: doc.isActive !== false,
      createdAt: toDate(createdAt),
      updatedAt: toDate(updatedAt || createdAt),
    };
  });
}

function exportCarts(carts) {
  return carts.map(cart => {
    const doc = withId(cart);
    return {
      _id: doc._id,
      customerId: doc.customerId,
      items: (doc.items || []).map(item => ({
        bookId: item.bookId,
        quantity: item.quantity,
        addedAt: toDate(item.addedAt || doc.updatedAt),
      })),
      createdAt: toDate(doc.createdAt || doc.updatedAt),
      updatedAt: toDate(doc.updatedAt),
    };
  });
}

function exportOrders(orders, adminId) {
  return orders.map(order => {
    const { createdAt, updatedAt, statusHistory, ...doc } = withId(order);
    let history = statusHistory;
    if (!Array.isArray(history) || !history.length) {
      history = [{ status: 'RECEIVED', at: createdAt, by: doc.customerId }];
      if (doc.fulfillmentStatus !== 'RECEIVED') {
        history.push({ status: doc.fulfillmentStatus, at: updatedAt, by: adminId });
      }
    }
    return {
      ...doc,
      note: doc.note || '',
      shippingFee: doc.shippingFee || 0,
      statusHistory: history.map(entry => ({ ...entry, at: toDate(entry.at) })),
      createdAt: toDate(createdAt),
      updatedAt: toDate(updatedAt || createdAt),
    };
  });
}

/** counters: { _id: 'order-2026', seq: <số lớn nhất đã dùng> } */
function exportCounters(orders) {
  const maxByYear = {};
  orders.forEach(order => {
    const match = /^order-(\d{4})-(\d+)$/.exec(order._id);
    if (!match) return;
    const key = `order-${match[1]}`;
    maxByYear[key] = Math.max(maxByYear[key] || 0, Number(match[2]));
  });
  return Object.entries(maxByYear).map(([_id, seq]) => ({ _id, seq }));
}

function main() {
  const db = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  const users = exportUsers(db.users || []);
  const adminId = users.find(user => user.role === 'ADMIN')?._id;
  const orders = exportOrders(db.orders || [], adminId);

  const collections = {
    categories: exportCategories(db.categories || []),
    books: exportBooks(db.books || []),
    users,
    carts: exportCarts(db.carts || []),
    orders,
    counters: exportCounters(orders),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  Object.entries(collections).forEach(([name, docs]) => {
    const file = path.join(OUT_DIR, `${name}.json`);
    fs.writeFileSync(file, `${EJSON.stringify(docs, null, 2, { relaxed: true })}\n`);
    console.log(`  ${name.padEnd(11)} ${String(docs.length).padStart(3)} docs -> ${path.relative(process.cwd(), file)}`);
  });
}

main();
