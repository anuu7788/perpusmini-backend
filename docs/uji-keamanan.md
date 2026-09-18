# Skenario Pengujian — Validasi, Sanitasi, SQLi, XSS

Jalankan `npm run dev` lalu uji melalui halaman `http://localhost:3000`, Postman, atau `curl`.
Ambil token terlebih dahulu dengan login sebagai admin.

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@perpusmini.test","password":"Admin1234"}' | jq -r .data.token)
```

## 1. Validasi Input (poin 1.b)

| No | Uji | Perintah | Hasil yang diharapkan |
|---|---|---|---|
| 1.1 | Registrasi data kosong/salah | `POST /api/auth/register` body `{"nama":"A","email":"bukan-email","password":"123"}` | 422, daftar error per field |
| 1.2 | Password lemah | password `password` | 422 "Password harus memuat huruf kapital" & "…angka" |
| 1.3 | Konfirmasi password beda | password ≠ konfirmasi_password | 422 "Konfirmasi password tidak sama" |
| 1.4 | ISBN salah format | `"isbn":"123"` | 422 "Format ISBN-10/ISBN-13 tidak valid" |
| 1.5 | Tahun terbit di luar rentang | `"tahun_terbit":1500` | 422 |
| 1.6 | Parameter id bukan angka | `GET /api/buku/abc` | 422 "ID harus berupa angka bulat positif" |
| 1.7 | limit berlebihan | `GET /api/buku?limit=9999` | 422 "limit antara 1 - 100" |

```bash
curl -s -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"nama":"A","email":"bukan-email","password":"123","konfirmasi_password":"456","no_telp":"123"}'
```

## 2. Sanitasi & XSS (poin 1.c)

| No | Uji | Payload | Hasil yang diharapkan |
|---|---|---|---|
| 2.1 | Stored XSS pada judul buku | `"judul":"<script>alert('xss')</script>Belajar Express"` | Tersimpan sebagai `Belajar Express`, tanpa tag |
| 2.2 | XSS melalui atribut event | `"penulis":"<img src=x onerror=alert(1)>Budi"` | Tersimpan sebagai `Budi` |
| 2.3 | XSS pada parameter pencarian | `GET /api/buku?q=<svg onload=alert(1)>` | Dicari sebagai teks polos, tidak dieksekusi |
| 2.4 | Header keamanan | `curl -I http://localhost:3000/health` | Ada `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`; tidak ada `X-Powered-By` |
| 2.5 | Prototype pollution | body `{"__proto__":{"admin":true},"nama":"Test"}` | Kunci `__proto__` dibuang |

```bash
curl -s -X POST http://localhost:3000/api/buku \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"kategori_id":1,"judul":"<script>alert(1)</script>Belajar Express","penulis":"<img src=x onerror=alert(1)>Budi","isbn":"9786020000011","tahun_terbit":2024,"stok":2}'
```

## 3. SQL Injection (poin 1.c)

| No | Uji | Payload | Hasil yang diharapkan |
|---|---|---|---|
| 3.1 | Bypass login klasik | `{"email":"admin@perpusmini.test' OR '1'='1","password":"apa saja"}` | 422/401, tidak pernah berhasil login |
| 3.2 | Injeksi pada pencarian | `GET /api/buku?q=' OR 1=1--` | Hasil pencarian kosong/normal, tidak membocorkan seluruh data |
| 3.3 | Stacked query | `GET /api/buku/1;DROP TABLE buku` | 422 (validasi id), tabel tetap ada |
| 3.4 | Injeksi pada kolom urutan | `GET /api/buku?sort=judul;DROP TABLE buku` | 422 "Nilai sort tidak dikenali" |
| 3.5 | Verifikasi tabel utuh | `SHOW TABLES FROM perpusmini;` | Keempat tabel masih ada |

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"admin@perpusmini.test' OR '1'='1\",\"password\":\"x\"}"
```

## 4. Autentikasi & Otorisasi

| No | Uji | Hasil yang diharapkan |
|---|---|---|
| 4.1 | Akses `/api/buku` tanpa token | 401 "Token akses tidak ditemukan" |
| 4.2 | Token diubah satu karakter | 401 "Token tidak valid" |
| 4.3 | Anggota mencoba `POST /api/buku` | 403 "Anda tidak memiliki hak akses untuk aksi ini" |
| 4.4 | Anggota membuka `/api/users` | 403 |
| 4.5 | Anggota membuka peminjaman milik orang lain | 403 |
| 4.6 | Registrasi dengan `"role":"admin"` | Akun tetap dibuat sebagai `anggota` |
| 4.7 | Login salah 11 kali | 429, dibatasi rate limiter |

## 5. Integritas Data

| No | Uji | Hasil yang diharapkan |
|---|---|---|
| 5.1 | Menambah kategori dengan nama yang sudah ada | 409 "Nama kategori sudah digunakan" |
| 5.2 | Menambah buku dengan ISBN duplikat | 409 "ISBN sudah terdaftar" |
| 5.3 | Menghapus kategori yang masih punya buku | 409, foreign key menahan |
| 5.4 | Menambah buku dengan `kategori_id` tidak ada | 400 "Kategori tidak ditemukan" |
| 5.5 | Meminjam buku berstok 0 | 409 "Stok buku habis" |
| 5.6 | Mengembalikan buku | Stok bertambah 1, status `dikembalikan` |

## 6. Enkripsi

| No | Uji | Hasil yang diharapkan |
|---|---|---|
| 6.1 | `SELECT password_hash FROM users` | Berisi hash bcrypt `$2a$12$...`, bukan teks asli |
| 6.2 | `SELECT no_telp_enc FROM users` | Berisi `iv:tag:ciphertext` base64, tidak terbaca |
| 6.3 | `GET /api/auth/me` | Nomor telepon kembali seperti semula setelah didekripsi |
| 6.4 | `GET /api/users` (admin) | Nomor telepon tampil tersamarkan `0812****7890` |
| 6.5 | Ubah manual satu karakter `no_telp_enc` di DB | Dekripsi gagal → nilai `null` (auth tag GCM bekerja) |
