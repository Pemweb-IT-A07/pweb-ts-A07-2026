# TODO — Soal Praktikum Modul 3 (Antrian Rumah Sakit)

Checklist dibuat dari `Soal Praktikum Modul 3.pdf` dibandingkan dengan kode di `src/` dan `*.html` saat ini (commit `f47a44b`).

## 0. Administratif (Ketentuan Umum)

- [x] Repository GitHub (public — **cek ulang Settings > General > visibility**, belum diverifikasi dari sini): `Pemweb-IT-A07/pweb-ts-A07-2026`
- [ ] Submit link repo ke Google Form: https://its.id/m/SubmitPemweb2026
- [ ] Pastikan deadline: Selasa, 13 Oktober 2026 23:59 (demo mulai 14 Oktober 2026)
- [ ] Pastikan pembagian beban kerja antar anggota kelompok merata (untuk dijelaskan saat demo)

## 1. Ketentuan Website (global)

- [x] Native, tanpa framework/library JS atau CSS (React/Vue/jQuery/Bootstrap/Tailwind dll) — dicek, tidak ada dependency semacam itu
- [x] Seluruh kode ditulis TypeScript (`src/**/*.ts`), dikompilasi ke `dist/`
- [x] Script dihubungkan dengan `<script type="module" src="dist/xxx.js" defer>` di semua 5 halaman
- [x] `tsconfig.json` ada di root repo
- [x] Auth: `POST /auth/login` → `accessToken`, lalu `GET /users/{id}` untuk role (`api.service.ts`, `auth.service.ts`)
- [x] Session (token, role, firstName), Jenis Antrian, dan Tiket semuanya di Local Storage (`storage.service.ts`)

## 2. Halaman Login (`login.html` / `login.ts`)

- [x] Form username + password dengan indikator loading state ("Memproses...", tombol disabled)
- [x] POST ke dummyjson, role dari response `/users/{id}` (admin/moderator/user)
- [x] `moderator` diperlakukan setara `admin` (`isAdminRole`)
- [x] Simpan token, role, firstName ke Local Storage setelah login sukses
- [x] Error handling visual dengan try...catch (kredensial salah / jaringan gagal)
- [x] Auto redirect: admin/moderator → `index.html`; user biasa → `ambil-antrian.html`
  - ⚠️ Spec menyebut user biasa boleh ke `operator.html` **atau** `ambil-antrian.html` — saat ini selalu ke `ambil-antrian.html`. Kemungkinan sudah cukup (spec pakai "atau"), tapi cek lagi kalau asisten minta keduanya.
- [x] `layar.html` publik tanpa login; pengambilan antrian di `ambil-antrian.html` perlu login

## 3. Halaman Dashboard Admin (`index.html` / `admin.ts`)

- [x] Auth guard + role guard (`enforceAdmin`) → redirect ke `login.html` jika belum login / bukan admin-moderator
- [x] Navbar: nama pengguna, role, tombol Logout (hapus session, redirect login)
- [x] Buat jenis antrian baru: kode 1 huruf kapital + nama, validasi duplikat case-insensitive (`createQueueType`)
- [x] Aktifkan/Nonaktifkan jenis antrian (nonaktif tidak muncul di pilihan ambil tiket baru)
- [x] Hapus jenis antrian (ikut hapus tiket terkait)
- [x] Reset Antrian (kosongkan semua tiket → penomoran balik ke 1)
- [x] Form penerbitan tiket manual: pilih jenis antrian + prioritas (Normal/Lansia/Disabilitas/VIP)

## 4. Halaman Operator (`operator.html` / `operator.ts`)

- [x] Auth guard (`enforceLogin`) → redirect ke `login.html` jika belum login
- [x] Tampilkan tiket sedang Dipanggil + tiket berikutnya (urut prioritas VIP>Disabilitas>Lansia>Normal)
- [x] Tombol "Panggil Berikutnya": selesaikan tiket aktif sebelumnya + panggil tiket berikutnya (`callNextInQueue`)
- [x] Tombol "Lewati": tandai tiket jadi Dilewati (`skipTicket`)
- [x] Tombol "Selesai": tutup tiket dipanggil tanpa auto-panggil berikutnya (`completeTicket`)

## 5. Halaman Layar Antrian (`layar.html` / `layar.ts`)

- [x] Publik, tanpa auth guard
- [x] Polling otomatis tanpa reload (interval 2.5 detik — dalam rentang 2-3 detik yang diminta)
- [x] Fitur Layar Penuh via Fullscreen API
- [x] Layout kartu per jenis antrian — diubah dari tab (1 kartu per waktu) ke grid yang menampilkan semua jenis antrian aktif sekaligus, sesuai mockup di soal
- [x] (Bonus) Pengumuman suara nomor dipanggil via Web Speech API — nilai tambahan di luar requirement wajib

## 6. Halaman Ambil Antrian (`ambil-antrian.html` / `ambil-antrian.ts`)

- [x] Self-service setelah login, pilih jenis antrian + prioritas (Normal/Lansia/Disabilitas/VIP)
- [x] Format nomor tiket `Kode-3Digit` (`formatTicketCode`, contoh A-001)
- [x] Jenis antrian baru dari admin otomatis muncul tanpa reload (polling 2.5 detik)

## 7. Cek sebelum demo (tidak ada test/lint otomatis di repo)

- [ ] `npm run build` lalu jalankan via Live Server dari **root folder** — pastikan semua 5 halaman jalan tanpa console error
- [ ] `npm run dev` sebagai alternatif — pastikan live-reload & polling bekerja
- [ ] Uji ulang alur penuh: ambil nomor → muncul di layar admin/operator/layar → panggil → selesai/lewati → cek layar antrian update
- [ ] Uji skenario role: login sebagai `admin`, `moderator`, dan `user` biasa dari dummyjson, cek redirect masing-masing
- [ ] Uji refresh browser di tiap halaman — pastikan session & data tidak hilang (Local Storage)

## 8. Nilai tambahan (opsional, bonus)

- [x] Desain antarmuka — `css/style.css` sudah diisi (976 baris, bukan placeholder kosong lagi; `CLAUDE.md`/README perlu diperbarui agar tidak menyebut "kosong")
- [x] Respon suara/audio panggilan antrian (di `layar.ts`)
- [ ] Fitur pendukung lain (opsional, belum ada — misal highlight animasi nomor baru, notifikasi, dsb.)
