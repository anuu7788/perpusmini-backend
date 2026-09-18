'use strict';

const { body, param, query } = require('express-validator');

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('ID harus berupa angka bulat positif').toInt(),
];

const listQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page minimal 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit antara 1 - 100').toInt(),
  query('q').optional().isLength({ max: 100 }).withMessage('Kata kunci maksimal 100 karakter'),
  query('sort').optional().isIn(['terbaru', 'terlama', 'judul', 'nama']).withMessage('Nilai sort tidak dikenali'),
];

// ------------------------- AUTH -------------------------
const register = [
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi')
    .isLength({ min: 3, max: 100 }).withMessage('Nama 3 - 100 karakter')
    .matches(/^[a-zA-Z.,'\s-]+$/).withMessage('Nama hanya boleh huruf dan tanda baca umum'),
  body('email').trim().notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid')
    .isLength({ max: 120 }).withMessage('Email maksimal 120 karakter')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password wajib diisi')
    .isLength({ min: 8, max: 72 }).withMessage('Password 8 - 72 karakter')
    .matches(/[A-Z]/).withMessage('Password harus memuat huruf kapital')
    .matches(/[a-z]/).withMessage('Password harus memuat huruf kecil')
    .matches(/[0-9]/).withMessage('Password harus memuat angka'),
  body('konfirmasi_password').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Konfirmasi password tidak sama');
    return true;
  }),
  body('no_telp').optional({ values: 'falsy' })
    .matches(/^(\+62|62|0)8[1-9][0-9]{6,11}$/).withMessage('Nomor telepon Indonesia tidak valid'),
  body('role').optional().isIn(['admin', 'petugas', 'anggota']).withMessage('Role tidak dikenali'),
];

const login = [
  body('email').trim().notEmpty().withMessage('Email wajib diisi').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('password').notEmpty().withMessage('Password wajib diisi').isLength({ max: 72 }),
];

const updateUser = [
  body('nama').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Nama 3 - 100 karakter'),
  body('no_telp').optional({ values: 'falsy' })
    .matches(/^(\+62|62|0)8[1-9][0-9]{6,11}$/).withMessage('Nomor telepon Indonesia tidak valid'),
  body('role').optional().isIn(['admin', 'petugas', 'anggota']).withMessage('Role tidak dikenali'),
  body('is_active').optional().isBoolean().withMessage('is_active harus true/false').toBoolean(),
];

// ----------------------- KATEGORI -----------------------
const createKategori = [
  body('nama').trim().notEmpty().withMessage('Nama kategori wajib diisi')
    .isLength({ min: 3, max: 80 }).withMessage('Nama kategori 3 - 80 karakter'),
  body('deskripsi').optional({ values: 'falsy' }).trim()
    .isLength({ max: 255 }).withMessage('Deskripsi maksimal 255 karakter'),
];

const updateKategori = [
  body('nama').optional().trim().isLength({ min: 3, max: 80 }).withMessage('Nama kategori 3 - 80 karakter'),
  body('deskripsi').optional({ values: 'falsy' }).trim().isLength({ max: 255 }).withMessage('Deskripsi maksimal 255 karakter'),
];

// ------------------------- BUKU -------------------------
const tahunMax = new Date().getFullYear() + 1;

const createBuku = [
  body('kategori_id').notEmpty().withMessage('Kategori wajib dipilih')
    .isInt({ min: 1 }).withMessage('kategori_id harus angka positif').toInt(),
  body('judul').trim().notEmpty().withMessage('Judul wajib diisi')
    .isLength({ min: 3, max: 180 }).withMessage('Judul 3 - 180 karakter'),
  body('penulis').trim().notEmpty().withMessage('Penulis wajib diisi')
    .isLength({ min: 3, max: 120 }).withMessage('Penulis 3 - 120 karakter'),
  body('isbn').trim().notEmpty().withMessage('ISBN wajib diisi')
    .matches(/^(97(8|9))?[0-9]{9}([0-9]|X)$/i).withMessage('Format ISBN-10/ISBN-13 tidak valid (tanpa tanda hubung)'),
  body('tahun_terbit').notEmpty().withMessage('Tahun terbit wajib diisi')
    .isInt({ min: 1900, max: tahunMax }).withMessage(`Tahun terbit antara 1900 - ${tahunMax}`).toInt(),
  body('stok').optional().isInt({ min: 0, max: 100000 }).withMessage('Stok 0 - 100000').toInt(),
  body('sinopsis').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }).withMessage('Sinopsis maksimal 2000 karakter'),
];

const updateBuku = [
  body('kategori_id').optional().isInt({ min: 1 }).withMessage('kategori_id harus angka positif').toInt(),
  body('judul').optional().trim().isLength({ min: 3, max: 180 }).withMessage('Judul 3 - 180 karakter'),
  body('penulis').optional().trim().isLength({ min: 3, max: 120 }).withMessage('Penulis 3 - 120 karakter'),
  body('isbn').optional().trim().matches(/^(97(8|9))?[0-9]{9}([0-9]|X)$/i).withMessage('Format ISBN tidak valid'),
  body('tahun_terbit').optional().isInt({ min: 1900, max: tahunMax }).withMessage(`Tahun terbit antara 1900 - ${tahunMax}`).toInt(),
  body('stok').optional().isInt({ min: 0, max: 100000 }).withMessage('Stok 0 - 100000').toInt(),
  body('sinopsis').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }).withMessage('Sinopsis maksimal 2000 karakter'),
];

// ---------------------- PEMINJAMAN ----------------------
const createPeminjaman = [
  body('buku_id').notEmpty().withMessage('Buku wajib dipilih').isInt({ min: 1 }).toInt(),
  body('user_id').optional().isInt({ min: 1 }).toInt(),
  body('tgl_pinjam').optional().isISO8601().withMessage('tgl_pinjam harus format YYYY-MM-DD'),
  body('catatan').optional({ values: 'falsy' }).trim().isLength({ max: 255 }).withMessage('Catatan maksimal 255 karakter'),
];

const updatePeminjaman = [
  body('status').optional().isIn(['dipinjam', 'dikembalikan', 'terlambat']).withMessage('Status tidak dikenali'),
  body('tgl_kembali').optional({ values: 'falsy' }).isISO8601().withMessage('tgl_kembali harus format YYYY-MM-DD'),
  body('catatan').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
];

module.exports = {
  idParam,
  listQuery,
  register,
  login,
  updateUser,
  createKategori,
  updateKategori,
  createBuku,
  updateBuku,
  createPeminjaman,
  updatePeminjaman,
};
