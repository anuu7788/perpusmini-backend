-- =========================================================
-- PerpusMini - Skema Basis Data Relasional (MySQL 8 / MariaDB 10.4+)
-- Memenuhi soal 1.a : minimal 2 tabel relasional + CRUD tiap entitas
-- =========================================================

CREATE DATABASE IF NOT EXISTS perpusmini
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE perpusmini;

-- Urutan drop mengikuti dependensi foreign key
DROP TABLE IF EXISTS peminjaman;
DROP TABLE IF EXISTS buku;
DROP TABLE IF EXISTS kategori;
DROP TABLE IF EXISTS users;

-- ---------------------------------------------------------
-- Tabel 1 : users  (entitas pengguna / petugas / anggota)
-- password disimpan sebagai hash bcrypt (enkripsi satu arah)
-- no_telp disimpan terenkripsi AES-256-GCM (enkripsi dua arah)
-- ---------------------------------------------------------
CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama          VARCHAR(100) NOT NULL,
  email         VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  no_telp_enc   VARCHAR(255) NULL COMMENT 'AES-256-GCM: iv:tag:ciphertext (base64)',
  role          ENUM('admin','petugas','anggota') NOT NULL DEFAULT 'anggota',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel 2 : kategori  (entitas master kategori buku)
-- ---------------------------------------------------------
CREATE TABLE kategori (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama       VARCHAR(80) NOT NULL,
  deskripsi  VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kategori_nama (nama)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel 3 : buku  (relasi many-to-one ke kategori)
-- ---------------------------------------------------------
CREATE TABLE buku (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  kategori_id  INT UNSIGNED NOT NULL,
  judul        VARCHAR(180) NOT NULL,
  penulis      VARCHAR(120) NOT NULL,
  isbn         VARCHAR(20) NOT NULL,
  tahun_terbit SMALLINT UNSIGNED NOT NULL,
  stok         INT UNSIGNED NOT NULL DEFAULT 0,
  sinopsis     TEXT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_buku_isbn (isbn),
  KEY idx_buku_kategori (kategori_id),
  KEY idx_buku_judul (judul),
  CONSTRAINT fk_buku_kategori
    FOREIGN KEY (kategori_id) REFERENCES kategori (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Tabel 4 : peminjaman  (relasi ke users dan buku)
-- ---------------------------------------------------------
CREATE TABLE peminjaman (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NOT NULL,
  buku_id      INT UNSIGNED NOT NULL,
  tgl_pinjam   DATE NOT NULL,
  tgl_kembali  DATE NULL,
  status       ENUM('dipinjam','dikembalikan','terlambat') NOT NULL DEFAULT 'dipinjam',
  catatan      VARCHAR(255) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pinjam_user (user_id),
  KEY idx_pinjam_buku (buku_id),
  CONSTRAINT fk_pinjam_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pinjam_buku FOREIGN KEY (buku_id) REFERENCES buku (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
