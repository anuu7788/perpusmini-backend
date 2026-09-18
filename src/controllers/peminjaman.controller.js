'use strict';

const db = require('../config/db');
const { success, AppError, asyncHandler } = require('../utils/response');

const SELECT_PINJAM = `
  SELECT p.id, p.user_id, u.nama AS nama_peminjam, p.buku_id, b.judul AS judul_buku,
         p.tgl_pinjam, p.tgl_kembali, p.status, p.catatan, p.created_at, p.updated_at
    FROM peminjaman p
    JOIN users u ON u.id = p.user_id
    JOIN buku  b ON b.id = p.buku_id`;

/** GET /api/peminjaman */
const index = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const clauses = [];
  const params = [];

  // Anggota hanya boleh melihat data peminjamannya sendiri (broken access control mitigation)
  if (req.user.role === 'anggota') {
    clauses.push('p.user_id = ?');
    params.push(req.user.sub);
  }
  if (req.query.status) {
    clauses.push('p.status = ?');
    params.push(req.query.status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const totalRows = await db.query(`SELECT COUNT(*) AS total FROM peminjaman p ${where}`, params);
  const rows = await db.query(
    `${SELECT_PINJAM} ${where} ORDER BY p.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  const total = totalRows[0].total;
  return success(res, {
    message: 'Daftar peminjaman',
    data: rows,
    meta: { page, limit, total, total_page: Math.ceil(total / limit) },
  });
});

/** GET /api/peminjaman/:id */
const show = asyncHandler(async (req, res) => {
  const rows = await db.query(`${SELECT_PINJAM} WHERE p.id = ?`, [req.params.id]);
  if (!rows.length) throw new AppError('Data peminjaman tidak ditemukan', 404);
  if (req.user.role === 'anggota' && rows[0].user_id !== req.user.sub) {
    throw new AppError('Anda tidak berhak mengakses data ini', 403);
  }
  return success(res, { message: 'Detail peminjaman', data: rows[0] });
});

/** POST /api/peminjaman  (stok dikurangi dalam satu transaksi) */
const store = asyncHandler(async (req, res) => {
  const bukuId = req.body.buku_id;
  const tglPinjam = req.body.tgl_pinjam || new Date().toISOString().slice(0, 10);
  const catatan = req.body.catatan || null;
  // Anggota hanya boleh meminjam untuk dirinya sendiri
  const userId = req.user.role === 'anggota' ? req.user.sub : (req.body.user_id || req.user.sub);

  const id = await db.withTransaction(async (conn) => {
    const [buku] = await conn.execute('SELECT id, stok FROM buku WHERE id = ? FOR UPDATE', [bukuId]);
    if (!buku.length) throw new AppError('Buku tidak ditemukan', 404);
    if (buku[0].stok < 1) throw new AppError('Stok buku habis', 409);

    const [user] = await conn.execute('SELECT id FROM users WHERE id = ? AND is_active = 1', [userId]);
    if (!user.length) throw new AppError('Peminjam tidak ditemukan atau non-aktif', 400);

    const [aktif] = await conn.execute(
      "SELECT COUNT(*) AS total FROM peminjaman WHERE user_id = ? AND buku_id = ? AND status = 'dipinjam'",
      [userId, bukuId],
    );
    if (aktif[0].total > 0) throw new AppError('Buku ini masih dipinjam dan belum dikembalikan', 409);

    await conn.execute('UPDATE buku SET stok = stok - 1 WHERE id = ?', [bukuId]);
    const [result] = await conn.execute(
      `INSERT INTO peminjaman (user_id, buku_id, tgl_pinjam, status, catatan)
       VALUES (?, ?, ?, 'dipinjam', ?)`,
      [userId, bukuId, tglPinjam, catatan],
    );
    return result.insertId;
  });

  const created = await db.query(`${SELECT_PINJAM} WHERE p.id = ?`, [id]);
  return success(res, { status: 201, message: 'Peminjaman berhasil dicatat', data: created[0] });
});

/** PUT /api/peminjaman/:id  (mis. pengembalian buku) */
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await db.withTransaction(async (conn) => {
    const [rows] = await conn.execute('SELECT * FROM peminjaman WHERE id = ? FOR UPDATE', [id]);
    if (!rows.length) throw new AppError('Data peminjaman tidak ditemukan', 404);
    const pinjam = rows[0];

    const statusBaru = req.body.status || pinjam.status;
    const tglKembali = req.body.tgl_kembali
      || (statusBaru === 'dikembalikan' ? new Date().toISOString().slice(0, 10) : pinjam.tgl_kembali);

    // Stok dikembalikan hanya saat transisi dipinjam -> dikembalikan
    if (pinjam.status === 'dipinjam' && statusBaru === 'dikembalikan') {
      await conn.execute('UPDATE buku SET stok = stok + 1 WHERE id = ?', [pinjam.buku_id]);
    }

    await conn.execute(
      'UPDATE peminjaman SET status = ?, tgl_kembali = ?, catatan = ? WHERE id = ?',
      [statusBaru, tglKembali || null, req.body.catatan ?? pinjam.catatan, id],
    );
  });

  const updated = await db.query(`${SELECT_PINJAM} WHERE p.id = ?`, [id]);
  return success(res, { message: 'Data peminjaman berhasil diperbarui', data: updated[0] });
});

/** DELETE /api/peminjaman/:id */
const destroy = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await db.withTransaction(async (conn) => {
    const [rows] = await conn.execute('SELECT * FROM peminjaman WHERE id = ? FOR UPDATE', [id]);
    if (!rows.length) throw new AppError('Data peminjaman tidak ditemukan', 404);
    if (rows[0].status === 'dipinjam') {
      await conn.execute('UPDATE buku SET stok = stok + 1 WHERE id = ?', [rows[0].buku_id]);
    }
    await conn.execute('DELETE FROM peminjaman WHERE id = ?', [id]);
  });

  return success(res, { message: 'Data peminjaman berhasil dihapus', data: { id: Number(id) } });
});

module.exports = { index, show, store, update, destroy };
