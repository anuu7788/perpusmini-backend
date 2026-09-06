'use strict';

const db = require('../config/db');
const { success, AppError, asyncHandler } = require('../utils/response');

const SORT_MAP = {
  terbaru: 'b.id DESC',
  terlama: 'b.id ASC',
  judul: 'b.judul ASC',
};

const SELECT_BUKU = `
  SELECT b.id, b.judul, b.penulis, b.isbn, b.tahun_terbit, b.stok, b.sinopsis,
         b.kategori_id, k.nama AS kategori_nama, b.created_at, b.updated_at
    FROM buku b
    JOIN kategori k ON k.id = b.kategori_id`;

/** GET /api/buku */
const index = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const orderBy = SORT_MAP[req.query.sort] || SORT_MAP.terbaru;

  const clauses = [];
  const params = [];

  if (req.query.q) {
    clauses.push('(b.judul LIKE ? OR b.penulis LIKE ? OR b.isbn LIKE ?)');
    const key = `%${req.query.q}%`;
    params.push(key, key, key);
  }
  if (req.query.kategori_id) {
    clauses.push('b.kategori_id = ?');
    params.push(Number(req.query.kategori_id) || 0);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const totalRows = await db.query(
    `SELECT COUNT(*) AS total FROM buku b ${where}`, params,
  );
  const rows = await db.query(
    `${SELECT_BUKU} ${where} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  const total = totalRows[0].total;
  return success(res, {
    message: 'Daftar buku',
    data: rows,
    meta: { page, limit, total, total_page: Math.ceil(total / limit) },
  });
});

/** GET /api/buku/:id */
const show = asyncHandler(async (req, res) => {
  const rows = await db.query(`${SELECT_BUKU} WHERE b.id = ?`, [req.params.id]);
  if (!rows.length) throw new AppError('Buku tidak ditemukan', 404);
  return success(res, { message: 'Detail buku', data: rows[0] });
});

/** POST /api/buku */
const store = asyncHandler(async (req, res) => {
  const { kategori_id: kategoriId, judul, penulis, isbn, tahun_terbit: tahun, stok = 0, sinopsis = null } = req.body;

  const kategori = await db.query('SELECT id FROM kategori WHERE id = ? LIMIT 1', [kategoriId]);
  if (!kategori.length) throw new AppError('Kategori tidak ditemukan', 400);

  const dup = await db.query('SELECT id FROM buku WHERE isbn = ? LIMIT 1', [isbn]);
  if (dup.length) throw new AppError('ISBN sudah terdaftar', 409);

  const result = await db.query(
    `INSERT INTO buku (kategori_id, judul, penulis, isbn, tahun_terbit, stok, sinopsis)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [kategoriId, judul, penulis, isbn, tahun, stok, sinopsis],
  );

  const created = await db.query(`${SELECT_BUKU} WHERE b.id = ?`, [result.insertId]);
  return success(res, { status: 201, message: 'Buku berhasil ditambahkan', data: created[0] });
});

/** PUT /api/buku/:id */
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rows = await db.query('SELECT id FROM buku WHERE id = ?', [id]);
  if (!rows.length) throw new AppError('Buku tidak ditemukan', 404);

  if (req.body.kategori_id !== undefined) {
    const kategori = await db.query('SELECT id FROM kategori WHERE id = ? LIMIT 1', [req.body.kategori_id]);
    if (!kategori.length) throw new AppError('Kategori tidak ditemukan', 400);
  }
  if (req.body.isbn !== undefined) {
    const dup = await db.query('SELECT id FROM buku WHERE isbn = ? AND id <> ? LIMIT 1', [req.body.isbn, id]);
    if (dup.length) throw new AppError('ISBN sudah dipakai buku lain', 409);
  }

  const allowed = ['kategori_id', 'judul', 'penulis', 'isbn', 'tahun_terbit', 'stok', 'sinopsis'];
  const fields = [];
  const params = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`); // nama kolom berasal dari whitelist, bukan input user
      params.push(req.body[key] === '' ? null : req.body[key]);
    }
  }
  if (!fields.length) throw new AppError('Tidak ada data yang diperbarui', 400);

  params.push(id);
  await db.query(`UPDATE buku SET ${fields.join(', ')} WHERE id = ?`, params);

  const updated = await db.query(`${SELECT_BUKU} WHERE b.id = ?`, [id]);
  return success(res, { message: 'Buku berhasil diperbarui', data: updated[0] });
});

/** DELETE /api/buku/:id */
const destroy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rows = await db.query('SELECT id FROM buku WHERE id = ?', [id]);
  if (!rows.length) throw new AppError('Buku tidak ditemukan', 404);

  const aktif = await db.query(
    "SELECT COUNT(*) AS total FROM peminjaman WHERE buku_id = ? AND status = 'dipinjam'", [id],
  );
  if (aktif[0].total > 0) throw new AppError('Buku sedang dipinjam sehingga tidak dapat dihapus', 409);

  await db.query('DELETE FROM buku WHERE id = ?', [id]);
  return success(res, { message: 'Buku berhasil dihapus', data: { id: Number(id) } });
});

module.exports = { index, show, store, update, destroy };
