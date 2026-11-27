# Catatan Serah-Terima Pengembangan — CNT IT APD Web

Dokumen ini merangkum status perombakan website **Culture Network Team (CNT) Group IT Application Delivery, Bank Mandiri** agar pekerjaan bisa dilanjutkan dari perangkat lain (atau sesi AI baru) tanpa kehilangan konteks. **Tidak berisi rahasia** — kredensial disimpan terpisah di luar repo (QuickDrop).

Terakhir diperbarui: 27 November 2026 (Fase 0 selesai; Fase 1 berikutnya, dikerjakan di laptop kantor).

---

## 1. Cara melanjutkan di perangkat lain

1. `git pull origin master` (wajib, sesuai [standar kerja](../.agent/rules/standar-kerja.md)).
2. Pastikan `.env` ada di root repo (tidak ikut Git) dengan empat variabel:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_MGMT_TOKEN`, `BACKUP_PASSPHRASE`.
3. `npm install` lalu `npm run build`.
4. Untuk AI (Claude Code): baca dokumen ini dan `.agent/rules/standar-kerja.md`, lalu lanjutkan dari bagian **6. Fase 1**.

---

## 2. Tentang project

- Portal internal tim budaya **Culture Network Team** (nama resmi; bukan "Culture & Change Agent Network" seperti di README lama) Group IT APD, Direktorat IT Bank Mandiri. Audiens: pegawai IT APD, mayoritas membuka dari **laptop kantor**.
- Periode aktif 2027; 4 divisi: Experience & Activity, Collective Wellbeing, Creative Media, Talent & Interest.
- Fitur: profil & organigram lintas periode, acara + RSVP + formulir (Townhall), open recruitment (mengumpulkan NIP, email, WhatsApp, CV), galeri, Kudos & Aspirasi, kit aset logo, Admin Portal (statistik pendaftar, lucky draw, poster QR).
- Stack: React 19 + Vite 6 (JSX, tanpa TypeScript), Supabase (DB + storage `cnt-media`), Netlify (auto-deploy dari `master`, edge function `og-preview`).
- Produksi: https://cntitapd.netlify.app — Supabase project `xarcxbfgeoetyhpqsick` — repo publik `gahasapurba/cntitapd-web`.

---

## 3. Keputusan yang sudah disepakati (27 Nov 2026)

| Topik | Keputusan |
|---|---|
| Alur | Sama seperti bapekkris-web: Fase 0 darurat → 1 keamanan & integritas data → 2 arsitektur → 3 redesign → 4 fitur → 5 uji Master Checklist → 6 rilis publik |
| Data | **Data produksi tidak boleh dihapus.** Migration hanya aditif; bandingkan jumlah baris sebelum/sesudah dengan baseline (bagian 5) |
| Nama | **Culture Network Team** |
| Kudos | Wajib **6 nilai AKHLAK**: Amanah, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif (set sekarang — Kolaboratif, Inovatif, Harmonis, Integritas, Dedikasi — salah) |
| Repo | Tetap **publik**; backup artifact dienkripsi |
| Target rilis | Tidak ada tenggat |
| Akses DB | Pemilik mengizinkan SQL lewat Management API; perubahan RLS/skema di produksi tetap minta OK dulu |
| Cara kerja AI | Proses lama (unduhan, CI, tes) diberi batas waktu pendek, dicek berkala, dan selalu dilaporkan — jangan menunggu diam-diam. Balas dalam Bahasa Indonesia, laporan 5 bagian sesuai standar kerja |

---

## 4. Fase 0 — Darurat ✅ SELESAI (27 Nov 2026)

- Backup GitHub Actions **dienkripsi** (AES-256 + PBKDF2, `openssl`): artifact repo publik bisa diunduh akun GitHub mana pun, dan backup berisi data pendaftar. Secret `BACKUP_PASSPHRASE` (salinan di `.env` dan QuickDrop). Tanpa secret workflow sengaja gagal.
- Dua artifact per backup: `…-database` (±90 KB) dan `…-full` (database + storage, ±122 MB; salinan ganda `*_latest` tidak lagi diunggah).
- Membuka: `export BACKUP_PASSPHRASE=…` lalu
  `openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -md sha256 -pass env:BACKUP_PASSPHRASE -in <nama>-database.json.enc -out backups/backup_latest.json`
  (arsip lengkap: `-in <nama>-full.zip.enc -out backups/supabase_full_backup_latest.zip`). Nama keluaran itu yang dibaca skrip restore.
- Diverifikasi: backup terenkripsi dibuka ulang → 94 baris, identik dengan baseline. 13 artifact lama (tanpa enkripsi) dihapus.
- Log backup tidak lagi mencetak nama berkas storage.
- 9 nomor WhatsApp pengurus di `supabase_seed.sql` → `NULL` (nilai asli tetap di DB produksi & backup). Riwayat Git lama sengaja tidak ditulis ulang.
- Hal yang sama diterapkan ke bapekkris-web.

---

## 5. Baseline produksi (27 Nov 2026, sebelum Fase 1)

| Tabel | Baris | Tabel | Baris |
|---|---|---|---|
| tenures | 1 | forms | 2 |
| tenure_roles | 6 | submissions | **16** |
| departments | 13 | lucky_draws | 0 |
| divisions | 4 | event_rsvps | 0 |
| members | 30 | faqs | 5 |
| events | 1 | brand_assets | 2 |
| galleries | 9 | page_settings | 3 |
| kudos | 1 | aspirasi | 1 |

Total **94 baris**. Storage `cnt-media`: 39 berkas, 123 MB. DB 13 MB. `auth.users`: 0. Fungsi di schema public: tidak ada.

Policy aktif: semua tabel `FOR ALL` untuk `public` ("Public full access …"), ditambah policy duplikat lama di `lucky_draws`, `tenure_roles`, `departments`; storage `Public Access cnt-media` `FOR ALL` untuk anon.

---

## 6. Fase 1 — Keamanan & integritas data (BERIKUTNYA)

### Temuan yang harus ditutup
| # | Masalah | Lokasi |
|---|---|---|
| K1 | RLS `FOR ALL USING (true)` di 16 tabel — anon bisa baca/ubah/hapus semua | `supabase_schema.sql` |
| K2 | Browser setiap pengunjung mengunduh seluruh `submissions` (NIP, email, WA, CV) | `fetchAllCloudState` di `src/lib/supabase.js` |
| K4 | Login admin hanya di klien, hash SHA-256 tanpa salt di repo publik | `src/components/AdminPortal.jsx:94-104, 769-800` |
| K5 | Storage `cnt-media` `FOR ALL` untuk anon | skema |
| K6 | `pushCloudState` menulis seluruh list lalu menghapus ID yang tidak ada → admin dengan list basi menghapus data baru orang lain; `lucky_draws` `delete not in` | `src/lib/supabase.js:1330-1480`, dipanggil 76× di `src/App.jsx` |
| K8 | Semua data (termasuk pendaftar) di-cache di `localStorage` | `saveLocalCache` |

### Rencana (acuan: bapekkris-web `supabase/migrations/20261125000000_secure_access_and_admin_roles.sql`, template asalnya sama)
1. Backup manual dulu (`gh workflow run daily-backup.yml`), verifikasi artifact `-database` bisa dibuka.
2. Migration `supabase/migrations/<ts>_secure_access_and_admin_roles.sql` (idempotent, aditif):
   - `admin_profiles` + peran `super_admin` / `division_admin`; helper `is_admin`, `is_super_admin`, `can_manage_division`, `can_manage_event`, `can_manage_form`.
   - Hapus semua policy "Public full access" & duplikat lama; RLS per tabel: konten publik dibaca semua orang, ditulis admin; acara draft (`is_public=false`) tersembunyi dari anon; FAQ belum terbit tersembunyi.
   - `submissions`, `event_rsvps`, `lucky_draws`, `aspirasi` (isi non-publik) hanya untuk admin berwenang.
   - RPC publik SECURITY DEFINER: `get_registration_counts`, `get_event_attendees`, `is_submission_value_taken`, `track_submissions`, `get_accepted_submissions`, `submit_form` (kuota, tenggat WIB lewat `parse_wib_deadline`, field unik — atomik), `submit_rsvp`, **khusus CNT**: `submit_kudos`, `like_kudos` (satu like per perangkat, tidak lewat upsert baris), `submit_aspirasi`, `get_public_aspirasi`. Admin: `assign_admin_role`, `revoke_admin_role`.
   - Storage: anon hanya INSERT ke folder unggahan formulir dengan batas tipe/ukuran; update/hapus hanya admin.
   - Unique index pemenang undian per acara.
3. Kode:
   - Login lewat Supabase Auth, hapus `sha256` & hash; tab "Kelola Admin" (super admin).
   - Ganti `pushCloudState` dengan penulisan per baris (`saveRow`/`deleteRow`, cek error); form publik, RSVP, kudos, aspirasi lewat RPC.
   - Tabel pribadi hanya di-fetch saat admin login; buang cache data pribadi di localStorage.
   - Buang 17 probe `check*Column()` (menghasilkan 7 error 400 setiap halaman dimuat) setelah kolom live dipastikan.
   - Validasi input publik (panjang, email, tipe & ukuran file ≤ 20 MB).
4. Bug yang ikut diperbaiki di Fase 1:
   - Kartu formulir yang lewat tenggat tetap berlabel "✓ Sedang Dibuka" (bersebelahan dengan badge "DITUTUP").
   - Beranda "Event & Kegiatan Terdekat" menampilkan acara yang sudah selesai.
   - Kategori Kudos → 6 nilai AKHLAK; data lama dipetakan, tidak dihapus (Inovatif→Adaptif, Integritas→Amanah, Dedikasi→Loyal — konfirmasi pemetaan ke pemilik dulu).
   - Footer "© 2027" mengikuti tahun periode, seharusnya tahun berjalan.
   - Nama "Culture Network Team" diseragamkan (README, meta, footer).
5. Pemilik membuat akun admin pertama (Supabase → Authentication → Users), lalu AI menetapkannya `super_admin`.
6. Minta OK pemilik → terapkan migration ke produksi → bandingkan jumlah baris dengan baseline → uji RLS lewat REST sebagai anon / super admin / admin divisi (akun uji sementara, hapus setelahnya) → uji UI Playwright → perbarui `supabase_schema.sql` & seed → push.

---

## 7. Fase berikutnya (ringkas)

- **Fase 2 — Arsitektur:** TypeScript bertahap, React Router (tombol Back; format link `/?event=`, `/?form=`, `/?gallery=`, `/?stats=`, `/admin` dipertahankan), TanStack Query (ganti polling 12 dtk + realtime semua tabel yang memuat ulang total — ±80 request per 30 dtk per pengunjung), pecah `AdminPortal.jsx` (16.210 baris, 168 `useState`), zod + react-hook-form, Vitest.
- **Fase 3 — Redesign:** gaya editorial korporat (navy Mandiri, emas hemat, aksen 6 warna AKHLAK) menggantikan starfield/gradasi pelangi; Bahasa Indonesia konsisten; Beranda dipangkas (5.100 px desktop / 9.100 px ponsel), FAQ ke halaman sendiri, Kudos & Aspirasi dipisah; skeleton loading; Admin bergaya dashboard; axe WCAG AA 0 pelanggaran (sekarang hanya 3 atribut `aria-`, 3.022 inline style, 246 baris berisi emoji).
- **Fase 4 — Fitur:** Kudos AKHLAK (moderasi, rate limit, AKHLAK Champion bulanan, kartu kudos), pelacak Aspirasi dengan status & balasan, check-in QR + e-sertifikat, pulse survey pasca-acara (eNPS) + dashboard, dashboard dampak program (partisipasi per 13 departemen, RAB vs realisasi, LPJ), pengingat .ics, ganti password admin, log aktivitas, statistik pengunjung tanpa cookie, arsip newsletter/podcast Creative Media.
- **Fase 5 — Uji Master Checklist** (`Master_Test_Checklist_CNT_IT_APD.xlsx` di root): 4 matriks (Web Light/Dark 1366×900, Mobile Light/Dark iPhone 17 Pro Max), audit visual, runner disimpan **di repo** (`e2e/`), hasil ke Google Sheet.
- **Fase 6 — Rilis:** domain kustom atau whitelist (Chrome/Edge laptop kantor memblokir `*.netlify.app`), pemberitahuan privasi UU PDP untuk pengumpulan NIP, soft launch ke pengurus, README & CLAUDE.md baru.

---

## 8. Catatan operasional

- **SQL di produksi** (butuh `SUPABASE_MGMT_TOKEN`):
  ```bash
  TOKEN=$(grep '^SUPABASE_MGMT_TOKEN=' .env | cut -d= -f2)
  curl -s -X POST "https://api.supabase.com/v1/projects/xarcxbfgeoetyhpqsick/database/query" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"query":"select 1"}'
  ```
- **Backup:** `gh workflow run daily-backup.yml` (manual), `gh run list` (status). Harian otomatis 02.00 WIB.
- **Uji UI di laptop kantor:** `*.netlify.app` diblokir browser kantor (MDM) → uji ke `http://localhost:5173` (`npm run dev`), matikan dev server setelahnya (Zero Background Task).
