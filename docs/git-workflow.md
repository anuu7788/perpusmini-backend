# Alur Kerja Git — Bukti Kolaborasi (CPMK104)

Dokumen ini menjadi acuan kerja tim sekaligus bukti pemenuhan poin 1.e pada soal.

## 1. Pembagian Tugas

| Anggota | Peran | Branch yang dikerjakan |
|---|---|---|
| _(Nama 1 / NIM)_ | Setup project, konfigurasi database, middleware keamanan | `feature/setup`, `feature/security` |
| _(Nama 2 / NIM)_ | CRUD kategori & buku, validasi input | `feature/crud-kategori`, `feature/crud-buku`, `feature/validasi` |
| _(Nama 3 / NIM)_ | Autentikasi, CRUD users & peminjaman, dokumentasi | `feature/auth`, `feature/peminjaman`, `feature/docs` |

> Ganti tanda kurung di atas dengan nama dan NIM anggota kelompok sebelum dikumpulkan.

## 2. Model Branch

```
main            ← hanya menerima merge dari develop yang sudah stabil
 └── develop    ← integrasi seluruh fitur
      ├── feature/setup
      ├── feature/auth
      ├── feature/crud-kategori
      ├── feature/crud-buku
      ├── feature/peminjaman
      └── feature/security
```

Aturan:
- Dilarang melakukan commit langsung ke `main`.
- Satu branch untuk satu fitur, umur branch sependek mungkin.
- Sebelum membuat Pull Request, lakukan `git pull --rebase origin develop`.

## 3. Konvensi Pesan Commit (Conventional Commits)

```
<tipe>(<cakupan>): <ringkasan singkat dalam bahasa Indonesia>
```

| Tipe | Dipakai untuk |
|---|---|
| `feat` | Menambah fitur baru |
| `fix` | Memperbaiki bug |
| `docs` | Perubahan dokumentasi |
| `refactor` | Merapikan kode tanpa mengubah perilaku |
| `test` | Menambah atau memperbaiki pengujian |
| `chore` | Konfigurasi, dependensi, berkas pendukung |

Contoh:

```
feat(buku): tambah endpoint CRUD buku dengan pagination
fix(auth): samakan pesan error login agar tidak terjadi user enumeration
docs(readme): lengkapi tabel endpoint dan cara instalasi
```

## 4. Perintah Harian

```bash
# Mulai fitur baru
git checkout develop
git pull origin develop
git checkout -b feature/crud-buku

# Menyimpan pekerjaan
git add src/controllers/buku.controller.js src/routes/buku.routes.js
git commit -m "feat(buku): tambah endpoint CRUD buku dengan pagination"
git push -u origin feature/crud-buku

# Menyelesaikan fitur → buat Pull Request ke develop, minta review 1 anggota lain
```

## 5. Penanganan Konflik

```bash
git checkout feature/crud-buku
git fetch origin
git rebase origin/develop
# selesaikan konflik pada berkas yang ditandai, lalu:
git add <berkas>
git rebase --continue
git push --force-with-lease
```

## 6. Template Pull Request

```markdown
### Deskripsi
Menambahkan CRUD buku beserta pencarian dan pagination.

### Poin soal yang dipenuhi
- [x] 1.a CRUD entitas buku
- [x] 1.b Validasi input buku

### Cara menguji
1. `npm run dev`
2. Login sebagai admin, panggil `POST /api/buku` dengan body contoh di `docs/api.http`

### Checklist
- [ ] Tidak ada kredensial yang ikut ter-commit
- [ ] Seluruh query memakai prepared statement
- [ ] Sudah direview oleh 1 anggota lain
```

## 7. Bukti yang Dikumpulkan

1. Tautan repository (GitHub/GitLab) dengan akses untuk dosen.
2. Tangkapan layar halaman *Contributors* / *Insights*.
3. Keluaran perintah berikut, disalin ke laporan:

```bash
git log --graph --oneline --all --decorate
git shortlog -sne          # jumlah commit per anggota
```
