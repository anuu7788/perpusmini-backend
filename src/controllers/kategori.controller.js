'use strict';

const db = require('../config/db');
const { success, AppError, asyncHandler } = require('../utils/response');

const SORT_MAP = {
  terbaru: 'k.id DESC',
  terlama: 'k.id ASC',
  nama: 'k.nama ASC',
};

/** GET /api/kategori  (CREATE-READ-UPDATE-DELETE : READ list) */
const index = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const keyword = req.query.q ? `%${req.query.q}%` : null;
  const orderBy = SORT_MAP[req.query.sort] || SORT_MAP.terbaru; // whitelist, bukan input mentah

  const where = keyword ? 'WHERE k.nama LIKE ?' : '';
  const params = keyword ? [keyword] : [];

  const totalRows = await db.query(`SELECT COUNT(*) AS total FROM kategori k ${where}`, params);
  const rows = await db.query(
    `SELECT k.id, k.nama, k.deskripsi, k.created_at, k.updated_at,
            (SELECT COUNT(*) FROM buku b WHERE b.kategori_id = k.id) AS jumlah_buku
       FROM kategori k
       ${where}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  const total = totalRows[0].total;
  return success(res, {
    message: 'Daftar kategori',
    data: rows,
    meta: { page, limit, total, total_page: Math.ceil(total / limit) },
  });
});

/** GET /api/kategori/:id */
const show = asyncHandler(async (req, res) => {
  const rows = await db.query('SELECT * FROM kategori WHERE id = ?', [req.params.id]);
  if (!rows.length) throw new AppError('Kategori tidak ditemukan', 404);
  return success(res, { message: 'Detail kategori', data: rows[0] });
});

/** POST /api/kategori */
const store = asyncHandler(async (req, res) => {
  const { nama, deskripsi = null } = req.body;

  const dup = await db.query('SELECT id FROM kategori WHERE nama = ? LIMIT 1', [nama]);
  if (dup.length) throw new AppError('Nama kategori sudah digunakan', 409);

  const result = await db.query('INSERT INTO kategori (nama, deskripsi) VALUES (?, ?)', [nama, deskripsi]);
  return success(res, {
    status: 201,
    message: 'Kategori berhasil ditambahkan',
    data: { id: result.insertId, nama, deskripsi },
  });
});

/** PUT /api/kategori/:id */
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rows = await db.query('SELECT id FROM kategori WHERE id = ?', [id]);
  if (!rows.length) throw new AppError('Kategori tidak ditemukan', 404);

  const fields = [];
  const params = [];
  if (req.body.nama !== undefined) { fields.push('nama = ?'); params.push(req.body.nama); }
  if (req.body.deskripsi !== undefined) { fields.push('deskripsi = ?'); params.push(req.body.deskripsi || null); }
  if (!fields.length) throw new AppError('Tidak ada data yang diperbarui', 400);

  params.push(id);
  await db.query(`UPDATE kategori SET ${fields.join(', ')} WHERE id = ?`, params);

  const updated = await db.query('SELECT * FROM kategori WHERE id = ?', [id]);
  return success(res, { message: 'Kategori berhasil diperbarui', data: updated[0] });
});

/** DELETE /api/kategori/:id */
const destroy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rows = await db.query('SELECT id FROM kategori WHERE id = ?', [id]);
  if (!rows.length) throw new AppError('Kategori tidak ditemukan', 404);

  const used = await db.query('SELECT COUNT(*) AS total FROM buku WHERE kategori_id = ?', [id]);
  if (used[0].total > 0) {
    throw new AppError('Kategori masih memiliki buku, hapus/pindahkan bukunya terlebih dahulu', 409);
  }

  await db.query('DELETE FROM kategori WHERE id = ?', [id]);
  return success(res, { message: 'Kategori berhasil dihapus', data: { id: Number(id) } });
});

module.exports = { index, show, store, update, destroy };
