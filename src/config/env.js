'use strict';

require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Environment variable ${name} wajib diisi (cek file .env)`);
  }
  return value;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  db: {
    host: required('DB_HOST', 'localhost'),
    port: Number(required('DB_PORT', '3306')),
    user: required('DB_USER', 'root'),
    password: process.env.DB_PASSWORD ?? '',
    database: required('DB_NAME', 'perpusmini'),
    connectionLimit: Number(process.env.DB_POOL || 10),
  },
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  },
  // Kunci AES-256 (32 byte) dalam bentuk hex 64 karakter
  encryptionKey: required('ENCRYPTION_KEY'),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
};
