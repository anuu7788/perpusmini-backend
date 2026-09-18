'use strict';

const env = require('../config/env');
const { fail } = require('../utils/response');

function notFound(req, res) {
  return fail(res, { status: 404, message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Error bawaan MySQL dipetakan ke pesan yang aman (tidak membocorkan struktur DB)
  const mysqlMap = {
    ER_DUP_ENTRY: [409, 'Data sudah ada / duplikat'],
    ER_NO_REFERENCED_ROW_2: [400, 'Data relasi yang dirujuk tidak ditemukan'],
    ER_ROW_IS_REFERENCED_2: [409, 'Data masih dipakai oleh tabel lain sehingga tidak bisa dihapus'],
  };

  if (err.code && mysqlMap[err.code]) {
    const [status, message] = mysqlMap[err.code];
    return fail(res, { status, message });
  }

  if (err.type === 'entity.parse.failed') {
    return fail(res, { status: 400, message: 'Format JSON tidak valid' });
  }

  const status = err.status || 500;
  const message = err.isOperational ? err.message : 'Terjadi kesalahan pada server';

  if (status >= 500) console.error('[ERROR]', err);

  const body = { status, message, errors: err.errors };
  if (env.nodeEnv !== 'production' && status >= 500) {
    body.errors = { stack: err.stack };
  }
  return fail(res, body);
}

module.exports = { notFound, errorHandler };
