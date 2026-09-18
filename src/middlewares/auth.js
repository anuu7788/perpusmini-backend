'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { fail } = require('../utils/response');

/** Memverifikasi token JWT pada header Authorization: Bearer <token>. */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return fail(res, { status: 401, message: 'Token akses tidak ditemukan' });
  }
  try {
    req.user = jwt.verify(token, env.jwt.secret);
    return next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token sudah kedaluwarsa' : 'Token tidak valid';
    return fail(res, { status: 401, message });
  }
}

/** Membatasi akses berdasarkan role, contoh: authorize('admin', 'petugas'). */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return fail(res, { status: 401, message: 'Belum terautentikasi' });
    if (roles.length && !roles.includes(req.user.role)) {
      return fail(res, { status: 403, message: 'Anda tidak memiliki hak akses untuk aksi ini' });
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
