'use strict';

/** Mengisi data awal: 1 admin, 1 anggota, 3 kategori, 5 buku. */
const db = require('../src/config/db');
const { hashPassword, encrypt } = require('../src/utils/crypto');

const KATEGORI = [
  ['Pemrograman', 'Buku seputar bahasa dan teknik pemrograman'],
  ['Basis Data', 'Perancangan dan pengelolaan basis data'],
  ['Jaringan Komputer', 'Topologi, protokol, dan keamanan jaringan'],
];

const BUKU = [
  [1, 'Belajar Node.js dari Nol', 'I Made Ardika', '9786021234567', 2023, 5],
  [1, 'Clean Code untuk Pemula', 'Ni Luh Sari', '9786021234568', 2022, 3],
  [2, 'Perancangan Basis Data Relasional', 'Agus Wirawan', '9786021234569', 2021, 4],
  [2, 'MySQL Tingkat Lanjut', 'Kadek Bagus', '9786021234570', 2024, 2],
  [3, 'Dasar Keamanan Jaringan', 'Putu Andika', '9786021234571', 2023, 6],
];

(async () => {
  try {
    await db.query(
      `INSERT INTO users (nama, email, password_hash, no_telp_enc, role)
       VALUES (?, ?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE nama = VALUES(nama)`,
      ['Administrator', 'admin@perpusmini.test', await hashPassword('Admin1234'), encrypt('081234567890')],
    );
    await db.query(
      `INSERT INTO users (nama, email, password_hash, no_telp_enc, role)
       VALUES (?, ?, ?, ?, 'anggota')
       ON DUPLICATE KEY UPDATE nama = VALUES(nama)`,
      ['Wayan Anggota', 'anggota@perpusmini.test', await hashPassword('Anggota1234'), encrypt('081298765432')],
    );

    for (const [nama, deskripsi] of KATEGORI) {
      await db.query(
        'INSERT INTO kategori (nama, deskripsi) VALUES (?, ?) ON DUPLICATE KEY UPDATE deskripsi = VALUES(deskripsi)',
        [nama, deskripsi],
      );
    }

    for (const [kategoriId, judul, penulis, isbn, tahun, stok] of BUKU) {
      await db.query(
        `INSERT INTO buku (kategori_id, judul, penulis, isbn, tahun_terbit, stok)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE judul = VALUES(judul)`,
        [kategoriId, judul, penulis, isbn, tahun, stok],
      );
    }

    console.log('[SEED] Data awal berhasil dimasukkan.');
    console.log('       admin@perpusmini.test / Admin1234');
    console.log('       anggota@perpusmini.test / Anggota1234');
  } catch (err) {
    console.error('[SEED] Gagal:', err.message);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
})();
