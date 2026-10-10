# pweb-ts-A07-2026 — Antrian Rumah Sakit

Aplikasi antrian rumah sakit sederhana. Dibuat *native* (tanpa framework/library JS maupun CSS) dengan TypeScript, sesuai Soal Praktikum Modul 3.

> **Catatan styling:** Repository ini sengaja hanya berisi struktur HTML dan logika TypeScript. Berkas `css/style.css` dibiarkan kosong karena styling akan dikerjakan secara manual.

## Struktur Proyek

```
├── login.html               Halaman login (publik)
├── index.html                Dashboard Admin (butuh login admin/moderator)
├── operator.html             Panel Operator (butuh login)
├── layar.html                 Layar antrian publik (polling 2.5 detik)
├── ambil-antrian.html         Ambil nomor antrian (publik, self-service)
├── css/style.css            Kosong — diisi manual, disalin ke dist/css/ saat build
├── scripts/
│   └── copy-assets.mjs      Menyalin *.html (root) + css/ ke dist/ (dipakai build & dev)
├── tsconfig.json
├── package.json
└── src/
    ├── types/               Interface & type (auth, queue) + barrel index.ts
    ├── services/
    │   ├── api.service.ts       Request ke dummyjson (login, detail user/role)
    │   ├── auth.service.ts      Login, logout, auth guard, role guard
    │   ├── storage.service.ts   Wrapper Local Storage bertipe
    │   └── queue.service.ts     Seluruh logika jenis antrian & tiket (CRUD, prioritas, panggil)
    ├── utils/               Helper DOM & format nomor tiket
    ├── login.ts             Entry script login.html
    ├── admin.ts             Entry script index.html
    ├── operator.ts          Entry script operator.html
    ├── layar.ts             Entry script layar.html
    └── ambil-antrian.ts     Entry script ambil-antrian.html
```

HTML tetap di root proyek dan memuat script-nya lewat `<script type="module" src="dist/nama.js">`, supaya repo bisa langsung dibuka dari root dengan Live Server (VS Code) tanpa langkah build apa pun — `dist/` yang dibutuhkan selalu dibangkitkan lewat `npm run build`/`npm run dev` sebelum demo. Modul-modul `services/`, `types/`, dan `utils/` diimpor langsung dengan `import`/`export` (ES module native, tanpa bundler).

## Setup & Build

```bash
npm install

npm run build    # tsc (kompilasi src/**/*.ts -> dist/) lalu menyalin *.html (root) & css/ ke dist/
npm run dev      # build sekali, lalu: tsc --watch + pemantau html/css + web server (live reload) di dist/
```

Script lain:

```bash
npm run watch         # tsc --watch saja (tanpa menyalin html/css otomatis)
npm run typecheck     # cek tipe saja, tanpa emit
npm run copy:assets   # salin *.html (root) + css/ ke dist/ sekali, tanpa compile
```

`npm run dev` menjalankan tiga proses sekaligus (lewat `concurrently`): `tsc --watch` (recompile TS saat berubah), pemantau `scripts/copy-assets.mjs --watch` (menyalin ulang HTML/CSS saat berubah), dan `live-server` yang menyajikan folder `dist/` dengan auto-reload browser. Folder `dist/` **tidak** di-commit (lihat `.gitignore`) karena sepenuhnya bisa dibangkitkan ulang lewat `npm run build`.

Karena HTML di root mereferensikan script lewat prefix `dist/...js` (dibutuhkan saat proyek dibuka langsung dari root), `scripts/copy-assets.mjs` melepas prefix itu saat menyalin HTML ke dalam `dist/` — di sana HTML dan JS-nya sudah satu folder, jadi `dist/` tetap bisa disajikan sendiri sebagai web root (dipakai oleh `npm run dev` / `live-server dist`).

Dua cara menjalankan aplikasi — pilih salah satu:
1. `npm run build`, lalu buka **folder root proyek** dengan ekstensi Live Server (sesuai contoh di soal).
2. `npm run dev` — otomatis build, watch, dan buka server sendiri yang menyajikan `dist/`.

## Alur Role & Autentikasi

- Login mengirim `POST /auth/login` ke dummyjson untuk mendapatkan `accessToken`.
- Karena respons login **tidak** menyertakan field `role`, aplikasi memanggil `GET /users/{id}` untuk mengambil role pengguna (`admin` / `moderator` / `user`).
- `moderator` diperlakukan setara `admin` di seluruh pemeriksaan akses.
- Sesi (`token`, `role`, `firstName`, dst.) disimpan di Local Storage sehingga bertahan saat refresh.
- `index.html` dan `operator.html` dilindungi auth guard (redirect ke `login.html` bila belum login / role tidak sesuai). `layar.html` dan `ambil-antrian.html` bersifat publik.

Akun uji bisa dilihat di <https://dummyjson.com/users> atau difilter per role:
`https://dummyjson.com/users/filter?key=role&value=admin` dan `.../?key=role&value=user`.

## Data & Penyimpanan

Seluruh data master jenis antrian dan daftar tiket disimpan di Local Storage (`antrian:queue-types`, `antrian:tickets`, `antrian:session`). Saat pertama kali dibuka dan belum ada data, aplikasi otomatis mengisi 3 jenis antrian contoh (Umum, Gigi, Farmasi).

## Fitur Tambahan

- `layar.html` mengumumkan nomor yang baru dipanggil lewat Web Speech API (`speechSynthesis`), selain polling otomatis tiap 2.5 detik.
- `layar.html` memiliki tombol Layar Penuh menggunakan Fullscreen API.
