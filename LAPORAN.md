# Laporan Tugas Ujian Remedial

**Mata Kuliah** : TI253305 – Pengembangan Web Sisi Server
**Kelas** : AA244 — Teknologi Informasi, ITB STIKOM Bali
**Judul Project** : PerpusMini — Back-End Web Application Sistem Perpustakaan
**Nama / NIM** : _(isi nama dan NIM anggota kelompok di sini)_

---

## A. Deskripsi Singkat

PerpusMini adalah REST API sisi server untuk mengelola data perpustakaan: pengguna, kategori
buku, koleksi buku, dan transaksi peminjaman. Aplikasi dibangun dengan Node.js dan Express,
memakai MySQL sebagai basis data relasional, serta JWT untuk autentikasi berbasis token.

Arsitektur dibuat berlapis agar tiap tanggung jawab terpisah:

```
Request → helmet/cors/rate-limit → sanitasi input → validasi → autentikasi/otorisasi
        → controller → prepared statement (mysql2) → MySQL → respons JSON seragam
```

---

## B. Poin 1.a — Skema Basis Data Relasional & CRUD (CPMK091)

Soal mensyaratkan minimal 2 tabel; project ini memakai **4 tabel** yang saling berelasi.

| Tabel | Peran | Relasi |
|---|---|---|
| `users` | data pengguna (admin, petugas, anggota) | 1 : N ke `peminjaman` |
| `kategori` | master kategori buku | 1 : N ke `buku` |
| `buku` | koleksi buku | N : 1 ke `kategori`, 1 : N ke `peminjaman` |
| `peminjaman` | transaksi pinjam/kembali | N : 1 ke `users` dan `buku` |

Relasi diagram (ERD ringkas):

```
users (1) ────< peminjaman >──── (1) buku >──── (1) kategori
```

Ketentuan integritas yang diterapkan:

- Semua tabel memakai engine **InnoDB** agar foreign key benar-benar ditegakkan.
- `fk_buku_kategori` memakai `ON DELETE RESTRICT` sehingga kategori yang masih memiliki buku
  tidak dapat dihapus.
- Kolom unik: `users.email`, `kategori.nama`, `buku.isbn`.
- Indeks tambahan pada kolom yang sering difilter (`buku.judul`, `buku.kategori_id`).

**CRUD tersedia lengkap untuk setiap entitas** (Create, Read list, Read detail, Update, Delete),
lihat tabel endpoint pada `README.md`. Operasi peminjaman memakai **transaksi** dan
`SELECT ... FOR UPDATE` agar stok buku tidak bentrok ketika ada permintaan bersamaan
(`src/controllers/peminjaman.controller.js`).

---

## C. Poin 1.b — Input dan Validasi (CPMK093)

Validasi memakai library **express-validator** dan dijalankan lewat middleware
`src/middlewares/validate.js`, sehingga controller hanya menerima data yang sudah valid.

Contoh aturan yang diterapkan:

| Field | Aturan |
|---|---|
| `nama` | wajib, 3–100 karakter, hanya huruf dan tanda baca umum |
| `email` | wajib, format email valid, dinormalisasi, maksimal 120 karakter |
| `password` | 8–72 karakter, wajib memuat huruf besar, huruf kecil, dan angka |
| `konfirmasi_password` | custom validator, harus sama dengan `password` |
| `no_telp` | pola nomor Indonesia `^(\+62\|62\|0)8[1-9][0-9]{6,11}$` |
| `isbn` | pola ISBN-10 / ISBN-13 |
| `tahun_terbit` | integer 1900 sampai tahun berjalan + 1 |
| `stok` | integer 0–100000 |
| `:id` (param) | integer positif, dikonversi otomatis dengan `.toInt()` |
| `page`, `limit` | integer, `limit` dibatasi maksimal 100 |
| `sort`, `status`, `role` | hanya menerima nilai dari daftar putih (`isIn`) |

Bila validasi gagal, server membalas **HTTP 422** dengan daftar kesalahan per field:

```json
{
  "success": false,
  "message": "Validasi input gagal",
  "errors": [
    { "field": "email", "message": "Format email tidak valid" },
    { "field": "password", "message": "Password harus memuat angka" }
  ]
}
```

Validasi juga berlapis dengan constraint basis data (UNIQUE, NOT NULL, FOREIGN KEY) sehingga
data tetap konsisten walaupun ada permintaan yang tidak lewat aplikasi.

---

## D. Poin 1.c — Sanitasi, Mitigasi SQLi & XSS, Enkripsi Dasar (CPMK091)

### D.1 Sanitasi Data

`src/middlewares/sanitize.js` dipasang secara global sebelum validator. Middleware ini menelusuri
`body`, `query`, dan `params` secara rekursif lalu:

1. Menghapus seluruh tag HTML dan atributnya memakai **sanitize-html**
   (`allowedTags: []`, mode `discard`, isi tag `script`/`style`/`iframe` ikut dibuang).
2. Menghapus karakter kontrol dan NUL byte.
3. Memangkas spasi berlebih di awal/akhir.
4. Memblokir kunci `__proto__`, `constructor`, `prototype` untuk mencegah **prototype pollution**.
5. Membatasi kedalaman objek maksimal 6 tingkat agar payload bersarang tidak membebani server.

Hasil pengujian nyata:

| Input | Hasil setelah sanitasi |
|---|---|
| `<script>alert("xss")</script>Judul Buku` | `Judul Buku` |
| `<img src=x onerror=alert(1)> Halo` | `Halo` |
| `  Novel <b>Laskar</b> Pelangi  ` | `Novel Laskar Pelangi` |

### D.2 Mitigasi SQL Injection

- Seluruh akses basis data melewati `db.query()` yang memanggil `pool.execute()`, yaitu
  **prepared statement** milik mysql2. Nilai dari pengguna dikirim terpisah dari perintah SQL,
  sehingga tidak pernah ikut diinterpretasikan sebagai sintaks SQL.
- Opsi `multipleStatements` dimatikan pada connection pool → serangan *stacked query*
  seperti `1; DROP TABLE buku;--` tidak mungkin dieksekusi.
- Bagian SQL yang tidak bisa diparameterkan (`ORDER BY`, nama kolom pada UPDATE) memakai
  **daftar putih** (`SORT_MAP`, array `allowed`), bukan string dari pengguna.
- `LIMIT`/`OFFSET` dipaksa menjadi integer lewat validator dan `Number()` sebelum dipakai.
- Akun MySQL aplikasi sebaiknya dibuat dengan hak seperlunya (SELECT, INSERT, UPDATE, DELETE),
  bukan akun root.

Contoh: input pencarian `Robert'); DROP TABLE buku;--` tersimpan/terbaca sebagai **teks biasa**,
tabel tetap utuh.

### D.3 Mitigasi XSS

- Sanitasi input di atas mencegah **stored XSS** (payload tidak pernah tersimpan di basis data).
- **helmet** mengirim header keamanan: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options`/`frame-ancestors 'none'` (anti clickjacking), `Referrer-Policy: no-referrer`.
- Header `X-Powered-By` dimatikan agar informasi teknologi server tidak bocor.
- API selalu membalas `application/json`, bukan HTML yang di-render server.
- Halaman penguji di `public/index.html` menampilkan respons memakai `textContent`,
  bukan `innerHTML`, sehingga aman dari **reflected/DOM-based XSS** di sisi klien.

### D.4 Enkripsi Dasar

| Data | Metode | Alasan |
|---|---|---|
| Password | **bcrypt** (`bcryptjs`, 12 rounds, salt otomatis) | Hash satu arah — password tidak perlu dan tidak boleh dikembalikan ke bentuk asli |
| Nomor telepon | **AES-256-GCM** (modul `crypto` bawaan Node) | Enkripsi dua arah dengan IV acak per data dan auth tag (menjamin kerahasiaan + integritas) |
| Token sesi | **JWT** HMAC-SHA256 bertanda tangan, masa berlaku 2 jam | Menjamin token tidak bisa dipalsukan |

Format penyimpanan nomor telepon: `iv:authTag:ciphertext` (base64). Jika data diubah pihak lain,
verifikasi auth tag gagal dan fungsi `decrypt()` mengembalikan `null`. Saat ditampilkan pada
daftar pengguna, nomor disamarkan menjadi `0812****7890` (*data masking*).

### D.5 Pengamanan Tambahan

- **Autentikasi JWT** + **otorisasi berbasis role** (`admin`, `petugas`, `anggota`).
- Registrasi publik selalu dipaksa role `anggota` → mencegah *privilege escalation*.
- Anggota hanya dapat melihat data peminjaman miliknya → mencegah *broken access control*.
- **express-rate-limit**: 10 percobaan login / 15 menit dan 120 permintaan / menit secara global.
- Pesan login salah dibuat seragam ("Email atau password salah") → mencegah *user enumeration*.
- Ukuran body dibatasi 100 KB.
- Error internal tidak membocorkan detail basis data; kode error MySQL dipetakan ke pesan umum.
- Rahasia aplikasi disimpan di `.env` yang di-*ignore* oleh Git.

---

## E. Poin 1.d — Library Eksternal (CPMK103)

Soal mensyaratkan minimal 1 library eksternal; project memakai 11 dependensi.

| Library | Fungsi dalam project |
|---|---|
| `express` | Framework HTTP dan routing |
| `mysql2` | Driver MySQL dengan dukungan prepared statement & promise |
| `express-validator` | Validasi input (poin 1.b) |
| `sanitize-html` | Sanitasi data / mitigasi XSS (poin 1.c) |
| `helmet` | Header keamanan HTTP |
| `bcryptjs` | Hashing password |
| `jsonwebtoken` | Pembuatan & verifikasi token JWT |
| `express-rate-limit` | Pembatasan laju permintaan |
| `cors` | Pengaturan akses lintas origin |
| `morgan` | Logging permintaan HTTP |
| `dotenv` | Memuat konfigurasi dari `.env` |
| `nodemon` (dev) | Auto-reload saat pengembangan |

---

## F. Poin 1.e — Kolaborasi dengan Repository Git (CPMK104)

Aturan lengkap ada di `docs/git-workflow.md`. Ringkasnya:

- **Branching model**: `main` (rilis/stabil) ← `develop` (integrasi) ← `feature/<nama-fitur>`.
- **Konvensi commit**: *Conventional Commits* (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- **Pembagian tugas antar anggota** dicatat pada tabel di `docs/git-workflow.md` dan terlihat
  pada riwayat commit (`git log --pretty='%h %an %s'`) yang memuat lebih dari satu *author*.
- **Pull Request** dipakai untuk menggabungkan `feature/*` ke `develop`, dengan review minimal
  satu anggota lain.
- Berkas rahasia (`.env`) dan `node_modules/` dikecualikan lewat `.gitignore`.

Bukti yang dilampirkan saat pengumpulan:
1. Tautan repository (GitHub/GitLab).
2. Tangkapan layar `Insights → Contributors` atau daftar commit per anggota.
3. Keluaran perintah `git log --graph --oneline --all`.

---

## G. Pengujian

Skenario pengujian beserta hasil yang diharapkan ada di `docs/uji-keamanan.md`, mencakup:
validasi gagal (422), akses tanpa token (401), akses beda role (403), percobaan SQL Injection,
percobaan XSS tersimpan, duplikasi data (409), dan penghapusan data yang masih direferensikan (409).

Hasil uji cepat yang sudah dijalankan pada project ini:

| Uji | Hasil |
|---|---|
| `GET /health` | 200, server hidup |
| `GET /api/buku` tanpa token | 401 "Token akses tidak ditemukan" |
| `GET /api/endpoint-salah` | 404 dengan pesan yang jelas |
| Registrasi dengan data tidak valid | 422 dengan 7 pesan kesalahan per field |
| Sanitasi payload `<script>` dan `onerror` | Tag dan isinya terhapus |
| Enkripsi/dekripsi AES-256-GCM | Nilai kembali utuh, tampilan tersamarkan `0812****7890` |

---

## H. Kesimpulan

Seluruh ketentuan soal (poin a sampai e) telah diimplementasikan: skema relasional empat tabel
dengan CRUD lengkap, validasi input berlapis, sanitasi data disertai mitigasi SQL Injection dan
XSS, enkripsi bcrypt serta AES-256-GCM, pemanfaatan sebelas library eksternal, dan alur kerja
kolaborasi Git yang terdokumentasi.
