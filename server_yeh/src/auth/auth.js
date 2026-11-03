/**
 * Auth module – xác thực, phân quyền và các endpoint /api/auth/* (APIContract §4: A1–A4).
 *
 * Module được khởi tạo bằng factory `createAuth(deps)` để dùng chung model/helper định nghĩa
 * trong server.js mà không bị require vòng.
 *
 *   const auth = createAuth({ User, Cart, ApiError, asyncHandler, validators, toPublicUser });
 *   app.use('/api/auth', auth.router);
 *   router.get('/cart', auth.authenticate, auth.requireRole('CUSTOMER'), handler);
 *
 * Token: JWT HS256, gửi qua header `Authorization: Bearer <token>`.
 * Payload: { sub: userId, role, jti }. Hết hạn sau JWT_EXPIRES_IN (mặc định 7d).
 */
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const BCRYPT_ROUNDS = 10;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/* ------------------------------------------------------------------ */
/* Secret                                                               */
/* ------------------------------------------------------------------ */

function resolveJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  // Dev: secret ngẫu nhiên mỗi lần khởi động -> token cũ mất hiệu lực khi restart server.
  console.warn('[auth] JWT_SECRET chưa được cấu hình trong .env – dùng secret tạm thời (chỉ cho dev).');
  return crypto.randomBytes(48).toString('hex');
}

/* ------------------------------------------------------------------ */
/* Password                                                             */
/* ------------------------------------------------------------------ */

async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

// Hash giả để so sánh khi email không tồn tại -> thời gian phản hồi tương đương, tránh dò email.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

/* ------------------------------------------------------------------ */
/* Token revocation (logout)                                            */
/* ------------------------------------------------------------------ */

/**
 * Danh sách jti đã logout, lưu in-memory tới khi token hết hạn.
 * Giới hạn: mất khi restart và không chia sẻ giữa nhiều instance. Khi scale ngang,
 * chuyển sang Redis hoặc collection `revoked_tokens` có TTL index trên `expiresAt`.
 */
const revokedTokens = new Map(); // jti -> exp (epoch seconds)

function revokeToken(jti, exp) {
  if (jti) revokedTokens.set(jti, exp);
}

function isRevoked(jti) {
  return revokedTokens.has(jti);
}

setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const [jti, exp] of revokedTokens) if (exp <= now) revokedTokens.delete(jti);
}, 10 * 60 * 1000).unref();

/* ------------------------------------------------------------------ */
/* Login rate limit                                                     */
/* ------------------------------------------------------------------ */

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;
const loginFailures = new Map(); // key -> { count, resetAt }

function loginKeys(req, email) {
  return [`ip:${req.ip}`, `email:${email}`];
}

function isLoginBlocked(keys) {
  const now = Date.now();
  return keys.some(key => {
    const entry = loginFailures.get(key);
    if (!entry) return false;
    if (entry.resetAt <= now) {
      loginFailures.delete(key);
      return false;
    }
    return entry.count >= LOGIN_MAX_FAILURES;
  });
}

function recordLoginFailure(keys) {
  const now = Date.now();
  keys.forEach(key => {
    const entry = loginFailures.get(key);
    if (!entry || entry.resetAt <= now) loginFailures.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    else entry.count += 1;
  });
}

function clearLoginFailures(keys) {
  keys.forEach(key => loginFailures.delete(key));
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of loginFailures) if (entry.resetAt <= now) loginFailures.delete(key);
}, 10 * 60 * 1000).unref();

/* ------------------------------------------------------------------ */
/* Factory                                                              */
/* ------------------------------------------------------------------ */

function createAuth({ User, Cart, ApiError, asyncHandler, validators, toPublicUser }) {
  const secret = resolveJwtSecret();

  function signToken(user) {
    return jwt.sign(
      { sub: user._id, role: user.role, jti: crypto.randomUUID() },
      secret,
      { algorithm: 'HS256', expiresIn: JWT_EXPIRES_IN },
    );
  }

  function unauthenticated(message = 'Vui lòng đăng nhập để tiếp tục.') {
    return new ApiError(401, 'UNAUTHENTICATED', message);
  }

  /**
   * Middleware: bắt buộc đăng nhập. Gắn `req.user` (document mới nhất từ DB) và `req.auth` (payload).
   * Đọc lại user từ DB mỗi request để khóa tài khoản / đổi role có hiệu lực ngay.
   */
  const authenticate = asyncHandler(async (req, res, next) => {
    const header = req.get('authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw unauthenticated();

    let payload;
    try {
      payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    } catch {
      throw unauthenticated('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (isRevoked(payload.jti)) throw unauthenticated('Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.');

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) throw unauthenticated('Phiên đăng nhập không còn hiệu lực.');

    req.auth = payload;
    req.user = user;
    next();
  });

  /** Middleware: kiểm tra role (dùng sau authenticate). */
  function requireRole(...roles) {
    return (req, res, next) => {
      if (!req.user) return next(unauthenticated());
      if (!roles.includes(req.user.role)) {
        return next(new ApiError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.'));
      }
      return next();
    };
  }

  const router = express.Router();

  /**
   * A1. POST /api/auth/register  (public)
   * body: { fullName, email, phone?, password } -> 201 { token, user }
   */
  router.post('/register', asyncHandler(async (req, res) => {
    const input = req.body || {};
    const errors = validators.registerInput(input);
    if (Object.keys(errors).length) throw validators.error(errors);

    const email = input.email.trim().toLowerCase();
    if (await User.exists({ email })) {
      throw new ApiError(409, 'EMAIL_TAKEN', 'Email đã được sử dụng.', { email: 'Email đã được sử dụng.' });
    }

    let user;
    try {
      user = await User.create({
        _id: `user-customer-${Date.now().toString(36)}${crypto.randomBytes(2).toString('hex')}`,
        fullName: input.fullName.trim(),
        email,
        phone: String(input.phone || '').trim(),
        passwordHash: await hashPassword(input.password),
        role: 'CUSTOMER', // luôn là CUSTOMER, bỏ qua role client gửi
        defaultShippingAddress: null,
        isActive: true,
      });
    } catch (error) {
      // Hai request đăng ký cùng email chạy song song -> unique index chặn.
      if (error?.code === 11000) {
        throw new ApiError(409, 'EMAIL_TAKEN', 'Email đã được sử dụng.', { email: 'Email đã được sử dụng.' });
      }
      throw error;
    }

    await Cart.updateOne(
      { customerId: user._id },
      { $setOnInsert: { _id: `cart-${user._id}`, customerId: user._id, items: [] } },
      { upsert: true },
    );

    res.status(201).json({ token: signToken(user), user: toPublicUser(user) });
  }));

  /**
   * A2. POST /api/auth/login  (public)
   * body: { email, password } -> 200 { token, user }
   */
  router.post('/login', asyncHandler(async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!validators.isEmail(email) || !password) {
      throw validators.error({ email: 'Nhập email và mật khẩu.' });
    }

    const keys = loginKeys(req, email);
    if (isLoginBlocked(keys)) {
      throw new ApiError(429, 'TOO_MANY_ATTEMPTS', 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.');
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    const passwordOk = await verifyPassword(password, user?.passwordHash || DUMMY_HASH);
    if (!user || !passwordOk) {
      recordLoginFailure(keys);
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');
    }
    if (!user.isActive) throw new ApiError(403, 'ACCOUNT_DISABLED', 'Tài khoản đã bị khóa.');

    clearLoginFailures(keys);
    res.json({ token: signToken(user), user: toPublicUser(user) });
  }));

  /**
   * A3. GET /api/auth/me  (auth) -> 200 { user }
   */
  router.get('/me', authenticate, (req, res) => {
    res.json({ user: toPublicUser(req.user) });
  });

  /**
   * A4. POST /api/auth/logout  (auth) -> 204
   * Thu hồi token hiện tại (jti) tới khi hết hạn.
   */
  router.post('/logout', authenticate, (req, res) => {
    revokeToken(req.auth.jti, req.auth.exp);
    res.status(204).end();
  });

  return { router, authenticate, requireRole, signToken };
}

module.exports = { createAuth, hashPassword, verifyPassword };
