# 🚀 Culture Network Team (CNT) IT APD Web Portal

> **Official Culture, Community, and Organizational Hub for IT Application Delivery (APD) — PT Bank Mandiri (Persero) Tbk.**  
> Production URL: [https://cntitapd.netlify.app](https://cntitapd.netlify.app)

---

## 🌟 Overview

**CNT IT APD** (Culture Network Team - Group IT Application Delivery) merupakan inisiatif budaya kerja di lingkungan Direktorat Information Technology Bank Mandiri yang berfokus pada internalisasi nilai-nilai utama **AKHLAK** (Amanah, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif), peningkatan *employee engagement*, kolaborasi lintas tim, serta akselerasi kapabilitas talenta digital.

Aplikasi web ini berfungsi sebagai portal informasi interaktif, etalase program kerja, direktori kepengurusan lintas periode, galeri dokumentasi kegiatan, pusat aset branding resmi, serta sarana apresiasi (*Kudos AKHLAK*).

---

## ✨ Fitur Utama

### 1. 🏛️ Multi-Tenure Organization & Dynamic Leadership
- **Multi-Periode**: Mendukung pergantian periode kepengurusan (misal: *2026/2027*, *2025/2026*).
- **Struktur Organisasi Interaktif**: Menampilkan Pembina, Ketua, Wakil Ketua, Sekretaris & Bendahara, serta 4 Divisi Budaya dengan modal profil anggota lengkap (*foto, job role, unit, bio, dan motto*).
- **Visi, Misi & Motto Dinamis**: Setiap periode dapat menyesuaikan visi, misi, dan tagline kepemimpinan secara mandiri via Admin Portal.

### 2. 🎯 Program Kerja & Kalender Kegiatan (12 Authentic Prokers)
Terbagi ke dalam 4 divisi budaya utama dengan status progres (*Upcoming*, *In Progress*, *Completed*):
- **Experience & Activity**: *Townhall APD, Welcoming New Hires, Onsite Gathering & Outing*.
- **Collective Wellbeing**: *Wellness Day & Mental Health Talk, Sports Club Weekly, APD CSR & Charity*.
- **Creative Media**: *Tech Culture Podcast, Monthly Newsletter & TechDigest, Social Media Reels & Showcase*.
- **Talent & Interest**: *Hackathon & Innovation Sprint, Tech Sharing & Peer Learning, Community Interest Guilds*.

### 3. 📸 Dynamic Gallery & Multi-Link Documentation
- **Showcase Dokumentasi Kegiatan**: Carousel foto interaktif dengan viewer lightbox layar penuh.
- **Multi-Link External Documentation**: Input fleksibel untuk link album Google Drive, OneDrive Mandiri, slide presentasi, atau YouTube dengan label kustom (misal: *"Download Foto High-Res"*, *"Tonton Rekaman Acara"*).
- **Upload Foto Interaktif**: Dukungan penyimpanan foto lokal via browser / Supabase Storage.

### 4. 🎨 Official Asset Kit & Brand Guidelines
- **Logo Suite Lengkap**: APD Master Brand, Inverse, Black Alternative, White Transparent, Navy, dan Horizontal Logomark.
- **One-Click Asset Download**: Tombol download instan paket aset resmi `CNTITAPD.zip`.
- **Integrasi Identitas Mandiri & Danantara**: Penyelarasan visual identitas BUMN Bank Mandiri dan Danantara Indonesia.

### 5. 💌 Kudos AKHLAK Wall
- Wadah apresiasi rekan kerja antar-tim berbasis 6 pilar AKHLAK:
  - 🛡️ **Amanah**
  - ⚡ **Kompeten**
  - 🤝 **Harmonis**
  - 🇮🇩 **Loyal**
  - 🚀 **Adaptif**
  - 🌐 **Kolaboratif**
- Filter kategori pilar dan timestamp pesan secara real-time.

### 6. 📝 Open Recruitment Portal
- Formulir pendaftaran calon anggota CNT baru per divisi minat.
- Dilengkapi kuesioner motivasi dan preferensi kontribusi.

### 7. 🔒 Secure Admin Portal (`/#admin`)
- Login dengan akun **Supabase Auth** (email & password); akses hanya untuk akun yang terdaftar di tabel `admin_profiles`.
- Dua peran: **super admin** (seluruh data + menu *Kelola Admin*) dan **admin divisi** (pengurus, acara, formulir, pendaftaran & galeri divisinya).
- Manajemen data real-time: edit visi/misi periode, kelola anggota divisi, buat program kerja baru, kelola galeri & tautan dokumentasi, serta export rekap data recruitment / kudos ke PDF.

### 8. 🌓 Theme Switcher (Default: Light Mode)
- Desain antarmuka modern bernuansa *Financial Tech & Enterprise Mandiri*.
- Toggle cepat antara **Light Mode** (default elegan dan bersih) dan **Dark Glassmorphism Mode** (futuristik dengan latar belakang bintang interaktif).

---

## 🛠️ Tech Stack & Arsitektur

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/) | Performa cepat dengan Hot Module Replacement |
| **Icons & UI Elements** | [lucide-react](https://lucide.dev/) | Ikon vektor modern dan responsif |
| **Styling** | Vanilla CSS Design Tokens | Variabel CSS kustom untuk Dark & Light mode tanpa framework CSS yang memberatkan |
| **Autentikasi Admin** | Supabase Auth + `admin_profiles` | Login admin berbasis peran (super admin / admin divisi) |
| **Database & Backend** | [Supabase](https://supabase.com/) | PostgreSQL dengan Row Level Security per tabel & RPC publik |
| **Dokumen / Report Export**| `jspdf` & `jspdf-autotable` | Ekspor data pendaftar & kudos ke dokumen PDF formal |
| **Hosting & CI/CD** | [Netlify](https://www.netlify.com/) | Auto-deploy dengan edge caching & custom headers |
| **Version Control** | Git (`master` branch) | GitHub Repository (`https://github.com/gahasapurba/cntitapd-web.git`) |

---

## 📁 Struktur Direktori

```text
cnt-it-apd-web/
├── .env.example              # Template variabel lingkungan Supabase
├── .gitignore                # Konfigurasi filter Git (node_modules, dist, .env aman)
├── index.html                # Entry point HTML dengan tema default Light
├── netlify.toml              # Konfigurasi routing & header Netlify
├── package.json              # Dependency & script build
├── supabase_schema.sql       # Skema master 16 tabel Supabase, RLS, & bucket
├── supabase_seed.sql         # Seed data master awal (periode, divisi, roles, unit kerja, form)
├── vite.config.js            # Konfigurasi bundler Vite
│
├── public/                   # Asset statis publik
│   └── assets/               # Logo master suite, zip asset pack, Danantara & Mandiri
│
└── src/                      # Source code aplikasi
    ├── components/           # Komponen modular UI
    │   ├── AdminModal.jsx            # Modal cepat pengelolaan
    │   ├── AdminPortal.jsx           # Halaman manajemen portal lengkap (/#admin)
    │   ├── AssetKitSection.jsx       # Showcase aset logo & download bundle
    │   ├── CrewMemberCard.jsx        # Kartu profil pengurus per divisi
    │   ├── Footer.jsx                # Footer dengan logo partner Mandiri & Danantara
    │   ├── GallerySection.jsx        # Galeri kegiatan, viewer, & link dokumentasi
    │   ├── HomeSection.jsx           # Beranda, visi-misi dinamis & ringkasan BPH
    │   ├── KudosSection.jsx          # Papan apresiasi pilar AKHLAK
    │   ├── Navbar.jsx                # Navigasi sticky, selector periode, & theme toggle
    │   ├── OrganizationSection.jsx   # Struktur lengkap 4 divisi budaya
    │   ├── ProgramSection.jsx        # Daftar 12 proker kerja & status kegiatan
    │   ├── RecruitmentSection.jsx    # Formulir pendaftaran open recruitment
    │   └── StarfieldBackground.jsx   # Efek animasi latar belakang
    │
    ├── data/
    │   └── (Database-driven via Supabase)
    ├── lib/
    │   └── supabase.js       # Client connection Supabase
    ├── utils/
    │   ├── audio.js          # Feedback suara interaktif
    │   └── exportPdf.js      # Generator laporan PDF
    ├── App.jsx               # Komponen root & navigasi halaman/hash
    ├── index.css             # Desain token, styling global, responsivitas
    └── main.jsx              # Mount point React DOM
```

---

## 🚀 Panduan Memulai (Local Development)

### Prasyarat
- **Node.js**: Versi `18.x` atau lebih baru
- **npm**: Versi `9.x` atau lebih baru

### 1. Kloning Repository
```bash
git clone https://github.com/gahasapurba/cntitapd-web.git cnt-it-apd-web
cd cnt-it-apd-web
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Setup Database Supabase & Seed Data (Direkomendasikan)
Untuk menghubungkan aplikasi ke backend Supabase sendiri dari nol:
1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka menu **SQL Editor** di dashboard Supabase.
3. **Bangun Struktur Database:**
   - Buka berkas `supabase_schema.sql` yang ada di root project.
   - Salin seluruh kodenya dan jalankan (*Run*) di SQL Editor Supabase.
   - Langkah ini akan membuat otomatis **16 tabel**, seluruh relasi foreign key, optimasi index, Row Level Security (RLS), dan storage bucket `cnt-media`.
4. **Isi Master Data Awal (Seed Data):**
   - Buka berkas `supabase_seed.sql` yang ada di root project.
   - Salin kodenya dan jalankan (*Run*) di SQL Editor Supabase.
   - Langkah ini akan mengisi data master: periode kepengurusan, divisi, role anggota, unit kerja IT APD, form oprec, FAQs, hingga aset logo resmi.
5. **Konfigurasi Berkas `.env`:**
   Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Isi dengan URL dan Anon Key project Supabase Anda:
   ```env
   VITE_SUPABASE_URL=https://<project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```
6. **Keamanan & Akun Admin:** jalankan berkas di `supabase/migrations/` secara berurutan, buat user di **Authentication → Users**, lalu tetapkan sebagai super admin (perintah SQL ada di akhir berkas migration). Uji aturan akses secara lokal dengan `npm run test:rls`.

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Akses aplikasi melalui browser di: `http://localhost:5173` (atau port yang tertera di terminal).

### 5. Build untuk Produksi
```bash
npm run build
```
Hasil build siap rilis akan dihasilkan di folder `dist/`.

---

## 🔐 Keamanan & Kebijakan Kredensial (Security Notice)

1. **Bebas Kredensial Teks Mentah (Zero Plaintext Secrets)**:
   - Tidak ada kata sandi, private key, atau access token backend yang tersimpan dalam repositori Git.
   - History commit Git telah diaudit dan dibersihkan dari informasi sensitif.
2. **Proteksi Akses Admin & Data**:
   - Portal Admin (`/#admin`) memakai Supabase Auth; peran disimpan di `admin_profiles` dan diperiksa oleh Row Level Security di database, bukan di browser.
   - Pengunjung hanya dapat membaca konten publik. Data pendaftar (NIP, email, WhatsApp, CV), RSVP, hasil undian & isi aspirasi hanya dapat dibaca admin yang berwenang dan tidak disimpan di cache browser.
   - Pendaftaran formulir, RSVP, kudos, like & aspirasi masuk lewat fungsi database (RPC) yang memeriksa tenggat, kuota, keunikan & panjang isian secara atomik.
3. **Penyimpanan Berkas Lingkungan**:
   - Berkas `.env`, `.netlify`, `dist/`, dan `node_modules/` telah terdaftar dalam `.gitignore` sehingga tidak akan terunggah ke repositori Git.

---

## 👥 Tim Pengembang & Kontributor

- **Group**: IT Application Delivery (APD)
- **Direktorat**: Information Technology — PT Bank Mandiri (Persero) Tbk.
- **Divisi Budaya**: Culture Network Team (CNT) IT APD

---

*Hak Cipta © 2026 PT Bank Mandiri (Persero) Tbk. — Group IT Application Delivery.*
