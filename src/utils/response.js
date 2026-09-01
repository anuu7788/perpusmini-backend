'use strict';

function success(res, { status = 200, message = 'OK', data = null, meta = undefined }) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

function fail(res, { status = 400, message = 'Permintaan tidak valid', errors = undefined }) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
}

/** Error aplikasi yang aman ditampilkan ke klien. */
class AppError extends Error {
  constructor(message, status = 400, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.isOperational = true;
  }
}

/** Membungkus handler async agar error otomatis diteruskan ke errorHandler. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { success, fail, AppError, asyncHandler };
