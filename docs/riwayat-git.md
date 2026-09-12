# Riwayat Git — Bukti Kolaborasi

Berkas ini dihasilkan otomatis dari repository sebagai lampiran bukti poin 1.e (CPMK104).
Ganti nama "Anggota 1/2/3" dengan nama dan email asli anggota kelompok saat mengerjakan.

## Jumlah commit per anggota (tanpa merge)

```
     6	Anggota 1 <anggota1@example.com>
     5	Anggota 3 <anggota3@example.com>
     4	Anggota 2 <anggota2@example.com>
```

## Riwayat branch dan commit

```
*   07c68e0 (tag: v1.0.0, main) release: versi 1.0.0 tugas ujian remedial TI253305
|\  
| *   191ca4f (HEAD -> develop) merge: feature/docs ke develop
| |\  
| | * a991c9e (feature/docs) docs: lengkapi README, laporan CPMK, alur kerja Git, dan skenario uji
| |/  
| *   a37b741 merge: fix/sanitasi ke develop
| |\  
| | * e7c029a (fix/sanitasi) fix(security): batasi panjang string saat sanitasi untuk cegah payload berlebihan
| |/  
| *   61198ce merge: feature/seeder ke develop
| |\  
| | * a17beff (feature/seeder) feat(seeder): data awal dan halaman penguji API sederhana
| |/  
| *   19153db merge: feature/peminjaman ke develop
| |\  
| | * 3d118c5 (feature/peminjaman) feat(users): CRUD pengguna khusus admin dengan penyamaran nomor telepon
| | * dd39a4c feat(peminjaman): transaksi pinjam dan kembali dengan penguncian stok
| |/  
| *   405388b merge: feature/crud-buku ke develop
| |\  
| | * 53701eb (feature/crud-buku) feat(buku): CRUD buku beserta relasi kategori dan filter pencarian
| |/  
| *   f7463e9 merge: feature/crud-kategori ke develop
| |\  
| | * 8867dc8 (feature/crud-kategori) feat(kategori): CRUD kategori dengan pagination dan pencarian
| |/  
| *   c5ebe7d merge: feature/auth ke develop
| |\  
| | * c023d1b (feature/auth) feat(auth): endpoint register, login, dan profil dengan rate limit
| | * 8025886 feat(auth): tambah middleware JWT, otorisasi role, dan aturan validasi
| |/  
| *   e241acc merge: feature/security ke develop
| |\  
| | * da68b78 (feature/security) feat(security): sanitasi input global untuk mitigasi XSS dan prototype pollution
| | * 9b89759 feat(security): tambah hashing bcrypt dan enkripsi AES-256-GCM
| |/  
| *   c2edaab merge: feature/database ke develop
| |\  
| | * b9ad6f7 (feature/database) feat(db): rancang skema relasional users, kategori, buku, dan peminjaman
| |/  
| * a154d4e merge: feature/setup ke develop
|/| 
| * bd6a327 (feature/setup) feat(core): siapkan aplikasi Express, error handler, dan router utama
| * 421cb08 chore(setup): tambah dependensi, konfigurasi env, dan connection pool MySQL
|/  
* b7eabc2 chore: inisialisasi repository dan konfigurasi dasar
```

## Daftar branch

```
* develop
  feature/auth
  feature/crud-buku
  feature/crud-kategori
  feature/database
  feature/docs
  feature/peminjaman
  feature/security
  feature/seeder
  feature/setup
  fix/sanitasi
  main
```
