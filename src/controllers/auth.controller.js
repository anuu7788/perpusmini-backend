'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');
const { success, AppError, asyncHandler } = require('../utils/response');
const { hashPassword, verifyPassword, encrypt, decrypt, maskPhone } = require('../utils/crypto');

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  );
}

/** POST /api/auth/register */
const register = asyncHandler(async (req, res) => {
  const { nama, email, password, no_telp: noTelp } = req.body;

  const existing = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing.length) throw new AppError('Email sudah terdaftar', 409);

  // Registrasi publik selalu role "anggota" -> mencegah privilege escalation
  // walaupun penyerang mengirim field role di body.
  const result = await db.query(
    `INSERT INTO users (nama, email, password_hash, no_telp_enc, role)
     VALUES (?, ?, ?, ?, 'anggota')`,
    [nama, email, await hashPassword(password), encrypt(noTelp || null)],
  );

  return success(res, {
    status: 201,
    message: 'Registrasi berhasil',
    data: { id: result.insertId, nama, email, role: 'anggota' },
  });
});

/** POST /api/auth/login */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const rows = await db.query(
    'SELECT id, nama, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1',
    [email],
  );
  const user = rows[0];

  // Pesan error dibuat sama untuk email/password salah agar tidak terjadi user enumeration.
  if (!user) throw new AppError('Email atau password salah', 401);
  const match = await verifyPassword(password, user.password_hash);
  if (!match) throw new AppError('Email atau password salah', 401);
  if (!user.is_active) throw new AppError('Akun dinonaktifkan, hubungi administrator', 403);

  return success(res, {
    message: 'Login berhasil',
    data: {
      token: signToken(user),
      expires_in: env.jwt.expiresIn,
      user: { id: user.id, nama: user.nama, email: user.email, role: user.role },
    },
  });
});

/** GET /api/auth/me */
const me = asyncHandler(async (req, res) => {
  const rows = await db.query(
    'SELECT id, nama, email, no_telp_enc, role, is_active, created_at FROM users WHERE id = ? LIMIT 1',
    [req.user.sub],
  );
  if (!rows.length) throw new AppError('Pengguna tidak ditemukan', 404);

  const { no_telp_enc: enc, ...user } = rows[0];
  return success(res, {
    message: 'Profil pengguna',
    data: { ...user, no_telp: decrypt(enc), no_telp_masked: maskPhone(decrypt(enc)) },
  });
});

module.exports = { register, login, me };
