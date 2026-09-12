# PerpusMini — Back-End Web Application

Tugas Ujian Remedial **TI253305 – Pengembangan Web Sisi Server**
Kelas AA244 — Program Studi Teknologi Informasi, ITB STIKOM Bali.

REST API sistem perpustakaan mini yang dibangun dengan **Node.js + Express + MySQL**,
menerapkan CRUD pada seluruh entitas, validasi input, sanitasi data, mitigasi SQL Injection
dan XSS, enkripsi dasar, library eksternal, serta alur kerja kolaborasi Git.

---

## 1. Pemenuhan Soal

| Poin soal | Ketentuan | Implementasi | Berkas |
|---|---|---|---|
| a (CPMK091) | Skema basis data relasional min. 2 tabel + CRUD tiap entitas | 4 tabel: `users`, `kategori`, `buku`, `peminjaman` dengan foreign key; CRUD penuh untuk keempatnya | `database/schema.sql`, `src/controllers/*` |
| b (CPMK093) | Input dan validasi | `express-validator` pada seluruh endpoint (body, param, query) + respons error 422 terstruktur | `src/validators/index.js`, `src/middlewares/validate.js` |
| c (CPMK091) | Sanitasi data, mitigasi SQLi & XSS, enkripsi dasar | Sanitasi global `sanitize-html`, prepared statement `mysql2`, header keamanan `helmet`, bcrypt + AES-256-GCM | `src/middlewares/sanitize.js`, `src/config/db.js`, `src/utils/crypto.js`, `src/app.js` |
| d (CPMK103) | Minimal 1 library eksternal | 10 library: express, mysql2, express-validator, sanitize-html, helmet, bcryptjs, jsonwebtoken, express-rate-limit, cors, morgan, dotenv | `package.json` |
| e (CPMK104) | Kolaborasi dibuktikan dengan repository Git | Riwayat commit multi-kontributor, branching `main`/`develop`/`feature/*`, konvensi commit, template PR | `docs/git-workflow.md`, `git log` |

Penjelasan rinci tiap poin ada di **`LAPORAN.md`**.

---

## 2. Teknologi

| Komponen | Pilihan |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Basis data | MySQL 8 / MariaDB 10.4+ (InnoDB) |
| Autentikasi | JWT (Bearer token) |
| Arsitektur | Layered: routes → middlewares → controllers → database |

---

## 3. Cara Menjalankan

```bash
# 1. Salin kode dan pasang dependensi
git clone <url-repository-anda> perpusmini
cd perpusmini
npm install

# 2. Siapkan konfigurasi
cp .env.example .env
node scripts/genkey.js     # salin hasilnya ke JWT_SECRET & ENCRYPTION_KEY di .env
#    lalu sesuaikan DB_USER / DB_PASSWORD sesuai MySQL lokal (XAMPP/Laragon)

# 3. Buat database + tabel, lalu isi data contoh
npm run db:migrate
npm run db:seed

# 4. Jalankan server
npm run dev        # mode pengembangan (nodemon)
# atau
npm start
```

Server berjalan di `http://localhost:3000`.
Buka alamat tersebut di browser untuk memakai **halaman penguji API** bawaan.

Akun hasil seeding:

| Email | Password | Role |
|---|---|---|
| admin@perpusmini.test | Admin1234 | admin |
| anggota@perpusmini.test | Anggota1234 | anggota |

---

## 4. Daftar Endpoint

Semua endpoint di bawah `/api` kecuali `register`, `login`, dan `/health` membutuhkan
header `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| POST | `/api/auth/register` | publik | Registrasi anggota baru |
| POST | `/api/auth/login` | publik | Login, mengembalikan JWT (dibatasi 10x / 15 menit) |
| GET | `/api/auth/me` | login | Profil pengguna aktif |

### Kategori (CRUD)
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/api/kategori?page=&limit=&q=&sort=` | login |
| GET | `/api/kategori/:id` | login |
| POST | `/api/kategori` | admin, petugas |
| PUT | `/api/kategori/:id` | admin, petugas |
| DELETE | `/api/kategori/:id` | admin |

### Buku (CRUD)
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/api/buku?page=&limit=&q=&kategori_id=&sort=` | login |
| GET | `/api/buku/:id` | login |
| POST | `/api/buku` | admin, petugas |
| PUT | `/api/buku/:id` | admin, petugas |
| DELETE | `/api/buku/:id` | admin |

### Peminjaman (CRUD, memakai transaksi)
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/api/peminjaman` | login (anggota hanya melihat miliknya) |
| GET | `/api/peminjaman/:id` | login |
| POST | `/api/peminjaman` | login |
| PUT | `/api/peminjaman/:id` | login (pengembalian buku) |
| DELETE | `/api/peminjaman/:id` | admin, petugas |

### Users (CRUD)
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/api/users?page=&limit=&q=` | admin |
| GET | `/api/users/:id` | admin |
| PUT | `/api/users/:id` | admin |
| DELETE | `/api/users/:id` | admin |

Format respons seragam:

```json
{
  "success": true,
  "message": "Daftar buku",
  "data": [],
  "meta": { "page": 1, "limit": 10, "total": 5, "total_page": 1 }
}
```

Contoh pemanggilan siap pakai tersedia di `docs/api.http` (ekstensi REST Client VS Code)
dan skenario pengujian keamanan di `docs/uji-keamanan.md`.

---

## 5. Struktur Folder

```
perpusmini/
├── database/schema.sql          # skema relasional + foreign key
├── docs/
│   ├── api.http                 # kumpulan request siap pakai
│   ├── git-workflow.md          # aturan kolaborasi Git
│   └── uji-keamanan.md          # skenario uji SQLi, XSS, validasi
├── public/index.html            # halaman penguji API
├── scripts/
│   ├── genkey.js                # generator JWT_SECRET & ENCRYPTION_KEY
│   ├── migrate.js               # membuat database & tabel
│   └── seed.js                  # data contoh
├── src/
│   ├── app.js                   # konfigurasi Express + middleware keamanan
│   ├── server.js                # entry point
│   ├── config/                  # env & connection pool MySQL
│   ├── controllers/             # logika CRUD tiap entitas
│   ├── middlewares/             # auth, sanitize, validate, errorHandler
│   ├── routes/                  # definisi endpoint
│   ├── utils/                   # crypto & helper respons
│   └── validators/              # aturan validasi express-validator
├── .env.example
└── LAPORAN.md
```

---

## 6. Catatan Keamanan

- Berkas `.env` **tidak** diikutkan ke Git (lihat `.gitignore`); yang dibagikan hanya `.env.example`.
- `ENCRYPTION_KEY` wajib 64 karakter heksadesimal (32 byte) agar AES-256-GCM dapat berjalan.
- Kredensial pada seeding hanya untuk keperluan demonstrasi tugas, bukan untuk produksi.
