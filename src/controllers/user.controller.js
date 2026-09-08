'use strict';

const db = require('../config/db');
const { success, AppError, asyncHandler } = require('../utils/response');
const { encrypt, decrypt, maskPhone } = require('../utils/crypto');

/** GET /api/users  (READ - list, admin) */
const index = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const keyword = req.query.q ? `%${req.query.q}%` : null;

  const where = keyword ? 'WHERE nama LIKE ? OR email LIKE ?' : '';
  const params = keyword ? [keyword, keyword] : [];

  const totalRows = await db.query(`SELECT COUNT(*) AS total FROM users ${where}`, params);
  // limit/offset sudah dipaksa menjadi integer oleh validator + Number(),
  // sehingga aman disisipkan (tidak mungkin berisi string SQL).
  const rows = await db.query(
    `SELECT id, nama, email, no_telp_enc, role, is_active, created_at
       FROM users ${where}
      ORDER BY id DESC
      LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  const data = rows.map(({ no_telp_enc: enc, ...u }) => ({ ...u, no_telp: maskPhone(decrypt(enc)) }));
  const total = totalRows[0].total;

  return success(res, {
    message: 'Daftar pengguna',
    data,
    meta: { page, limit, total, total_page: Math.ceil(total / limit) },
  });
});

/** GET /api/users/:id  (READ - detail) */
const show = asyncHandler(async (req, res) => {
  const rows = await db.query(
    'SELECT id, nama, email, no_telp_enc, role, is_active, created_at, updated_at FROM users WHERE id = ?',
    [req.params.id],
  );
  if (!rows.length) throw new AppError('Pengguna tidak ditemukan', 404);

  const { no_telp_enc: enc, ...user } = rows[0];
  return success(res, { message: 'Detail pengguna', data: { ...user, no_telp: maskPhone(decrypt(enc)) } });
});

/** PUT /api/users/:id  (UPDATE) */
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rows = await db.query('SELECT id FROM users WHERE id = ?', [id]);
  if (!rows.length) throw new AppError('Pengguna tidak ditemukan', 404);

  const fields = [];
  const params = [];
  if (req.body.nama !== undefined) { fields.push('nama = ?'); params.push(req.body.nama); }
  if (req.body.no_telp !== undefined) { fields.push('no_telp_enc = ?'); params.push(encrypt(req.body.no_telp)); }
  if (req.body.role !== undefined) { fields.push('role = ?'); params.push(req.body.role); }
  if (req.body.is_active !== undefined) { fields.push('is_active = ?'); params.push(req.body.is_active ? 1 : 0); }
  if (!fields.length) throw new AppError('Tidak ada data yang diperbarui', 400);

  params.push(id);
  await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

  return success(res, { message: 'Pengguna berhasil diperbarui', data: { id: Number(id) } });
});

/** DELETE /api/users/:id  (DELETE) */
const destroy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (Number(id) === Number(req.user.sub)) throw new AppError('Anda tidak bisa menghapus akun sendiri', 400);

  const rows = await db.query('SELECT id FROM users WHERE id = ?', [id]);
  if (!rows.length) throw new AppError('Pengguna tidak ditemukan', 404);

  await db.query('DELETE FROM users WHERE id = ?', [id]);
  return success(res, { message: 'Pengguna berhasil dihapus', data: { id: Number(id) } });
});

module.exports = { index, show, update, destroy };
