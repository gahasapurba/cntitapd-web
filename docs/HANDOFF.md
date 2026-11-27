# Catatan Serah-Terima Pengembangan — CNT IT APD Web

Dokumen ini merangkum status perombakan website **Culture Network Team (CNT) Group IT Application Delivery, Bank Mandiri** agar pekerjaan bisa dilanjutkan dari perangkat lain (atau sesi AI baru) tanpa kehilangan konteks. **Tidak berisi rahasia** — kredensial disimpan terpisah di luar repo (QuickDrop).

Terakhir diperbarui: 27 November 2026 malam (Fase 0, 1 & 2 selesai; Fase 3 — redesign — sedang berjalan, lihat 6c).

---

## 1. Cara melanjutkan di perangkat lain

1. `git pull origin master` (wajib, sesuai [standar kerja](../.agent/rules/standar-kerja.md)).
2. Pastikan `.env` ada di root repo (tidak ikut Git) dengan empat variabel:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_MGMT_TOKEN`, `BACKUP_PASSPHRASE`.
3. `npm install` lalu `npm run build`.
4. Untuk AI (Claude Code): baca dokumen ini dan `.agent/rules/standar-kerja.md`, lalu lanjutkan dari bagian **6c. Status Fase 3** (halaman berikutnya: Formulir). Status Fase 1 & 2 di 6a–6b.
5. Uji aturan akses database secara lokal (tanpa menyentuh produksi): `npm run test:rls` (50 uji, Postgres WASM/PGlite).
6. Uji UI lokal: `npm i --no-save puppeteer-core`, lalu `node scripts/ui/ui-smoke.mjs` dan `node scripts/ui/ui-router.mjs` (lihat `scripts/ui/README.md`).

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

## 6a. Status Fase 1 (27 Nov 2026)

**Diterapkan di produksi** (migration `20261127000000_secure_access_and_admin_roles.sql`, OK pemilik):
- Backup manual sebelum migration diverifikasi (94 baris). Sesudah migration: **94 baris, identik per tabel** dengan baseline; storage 39 berkas; 0 policy lama tersisa; 34 policy & 20 fungsi identik dengan `supabase_schema.sql`.
- Uji REST produksi sebagai anon: data pribadi, tabel aspirasi, admin_profiles & semua penulisan ditolak; RPC publik berjalan (tenggat Townhall terbaca WIB, kategori kudos lama ditolak, like/batal like bersih); upload anon ke `gallery/` & `.exe` ditolak.
- Kode klien (commit `118dca7`): penulisan per baris, Supabase Auth + peran, RPC publik, tanpa cache data pribadi, 17 probe kolom dihapus, validasi input & berkas ≤ 20 MB, bug kartu "Sedang Dibuka", event terdekat, tahun footer, nama Culture Network Team.
- Uji UI localhost (headless Chrome, 15 cek pengunjung) lulus: tanpa request gagal, tanpa request tabel pribadi, localStorage bersih.
- Kudos: data lama hanya 1 baris berkategori "Harmonis" (sudah AKHLAK) → **tidak perlu pemetaan**.
- `forms.deadline` di produksi bertipe TIMESTAMPTZ berisi digit jam WIB berlabel UTC; `form_deadline_wib()` menafsirkannya. `supabase_schema.sql` kini identik dengan kolom produksi.
- Backup kini juga menyimpan `admin_profiles` & `kudos_likes` (backup 07:36 UTC diverifikasi, 94 baris).

**Sisa langkah Fase 1:**
1. ~~Akun super admin pertama~~ — selesai 27 Nov: akun `gahasapurba.tech@gmail.com` disalin dari project Bapekkris (`zkvjudumhhnwxchhakjl`) atas permintaan pemilik, **password sama dengan Bapekkris**, lalu ditetapkan `super_admin`. Catatan: kedua project kini terpisah — mengganti password di satu project tidak mengubah yang lain.
2. Uji produksi sebagai super admin & admin divisi (login UI, simpan/hapus data uji, Kelola Admin). Uji REST dengan akun uji sementara via service_role ditolak oleh izin otomatis Claude Code di laptop kantor — minta izin pemilik atau uji lewat akun nyata.
3. ~~Hapus drop Quick Drop "LANGKAH LANJUT DI LAPTOP KANTOR"~~ — sudah dihapus 27 Nov (drop passphrase tetap).

## 6. Fase 1 — Keamanan & integritas data (rencana awal, untuk referensi)

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

## 6b. Status Fase 2 — Arsitektur ✅ SELESAI (27 Nov 2026)

- **TypeScript** (`tsconfig` strict + allowJs, `npm run typecheck`, build menjalankan `tsc`). Tipe tabel di `src/types/database.ts`; regenerate setiap ada perubahan skema:
  `curl -s "https://api.supabase.com/v1/projects/xarcxbfgeoetyhpqsick/types/typescript" -H "Authorization: Bearer $TOKEN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.parse(s).types))' > src/types/database.ts`
  `src/lib/supabase.ts` & seluruh `src/utils/*` sudah `.ts` (output esbuild identik dengan JS lama).
- **React Router** (`src/lib/appNavigation.tsx`): Back/Forward berfungsi, format link lama tetap (`/?event=`, `/?form=`, `/?gallery=`, `/?stats=`, `/admin`; `?galeri=` lama ikut didukung).
- **TanStack Query** (`src/lib/queries.ts`): satu query per tabel, realtime hanya memuat ulang tabel yang berubah; polling 60 dtk (berhenti saat tab tersembunyi), staleTime 30 dtk. Muat awal 14 request (dulu: semua tabel setiap 60 dtk + setiap perubahan). Aspirasi: super admin dari tabel, lainnya lewat RPC publik.
- **Pecah komponen**: `AdminPortal.jsx` 16.210 → ±2.250 baris (`src/admin/tabs/*`, `modals/*`, `modals/edit/*Fields.tsx`, state dibagikan lewat `AdminPortalContext`); `EventRegistrationStats` → `registration-stats/` (hook + 11 section); `DynamicFormSection` → `dynamic-form/` (hook + 8 section). Hook masih `.jsx`; section `.tsx` dengan nilai context `any` — ditipekan saat redesign Fase 3.
- **zod + react-hook-form**: `src/admin/validation/schemas.ts`; `AdminLoginForm.tsx`, `AdminAccountsPanel.tsx`.
- **Vitest** (`npm test`, 24 uji: kesetaraan skema vs kode lama ±39.000 input + skema URL). `npm run test:rls` tetap terpisah.
- Verifikasi tiap langkah: tampilan teks 14 tab admin + 11 dialog edit, halaman formulir & statistik, pesan validasi — identik dengan versi sebelumnya (sesi admin tiruan khusus browser uji, semua penulisan diblokir).
- Bug lama yang ikut ditemukan & diperbaiki: pemilih field diagram statistik memanggil `setOptionFilter` yang tidak pernah ada (ReferenceError); dua hook sempat kehilangan import konstanta saat dipindah (tertangkap pemindai sebelum commit).
- Uji dengan login super admin sungguhan (localhost → Supabase produksi, 27 Nov): login, 16 pendaftar terlihat, Kelola Admin, aspirasi, statistik acara, tambah+hapus FAQ uji, logout — lulus. Bug lama ikut diperbaiki: form tambah FAQ mewajibkan kategori tanpa kolom kategori (FAQ tak pernah bisa disimpan).
- **Insiden 27 Nov:** skrip uji awal mengklik tombol "Hapus" yang salah dan menghapus `faq-1`; dipulihkan persis dari backup terenkripsi 07:57 UTC dalam beberapa menit (isi seluruh tabel diverifikasi identik dengan backup). Aturan uji sejak itu: backup dulu, hapus hanya baris uji bertanda "UJI OTOMATIS …", konfirmasi hanya bila dialog menyebut baris uji itu, bandingkan jumlah baris sebelum/sesudah.
- Catatan: CNT belum punya perbaikan zona waktu WIB untuk tenggat/“hari ini” di browser (bapekkris `f745aca`); layak dibawa di Fase 3/4.

## 6c. Status Fase 3 — Redesign 🔄 SEDANG BERJALAN (27 Nov 2026)

**Konsep disetujui pemilik: "B (Dashboard Modern) + aksen C"** — mockup di `docs/design/fase3/` (PNG web/mobile terang/gelap + `mockup-D-Gabungan.html`). Konsep A (editorial) ditolak karena terlalu mirip Bapekkris.
- Font Plus Jakarta Sans; latar abu-biru dingin (`#f3f5f9`), kartu putih; hero navy + stat tile; aksen emas (kartu kudos kuning); pita 6 warna AKHLAK di header/footer; judul besar tebal; kartu divisi bernomor 01–04 berwarna AKHLAK.
- Rilis **langsung ke master per halaman**; tiap halaman: build + typecheck + vitest + `scripts/ui/ui-smoke.mjs` + `ui-router.mjs` + screenshot terang/gelap/ponsel, commit, push, laporan 5 bagian.

**Fondasi (selesai):**
- Tailwind v4 (`@tailwindcss/vite`, tanpa preflight), cascade layer `@layer theme, legacy, utilities`. Token di `src/styles/tokens.css` (terang/gelap, tint/ink AKHLAK, hero); CSS lama di `src/styles/legacy.css`; pemetaan kelas di `src/index.css` (`@theme inline`: page, surface, subtle, line, ink, muted, dim, navy, hero*, gold*, field*, pill*, amanah…kolaboratif + `-tint`/`-ink`).
- Warna hanya hex (tanpa oklch/color-mix) — ekspor PDF organigram memakai html2canvas.
- Tema mengikuti OS sampai pengunjung memilih (`src/lib/theme.ts`, kunci `cnt_theme_choice`; skrip pre-paint di `index.html`).
- Kit UI `src/ui/`: Button/ButtonLink, Card/Eyebrow, Chip (+akhlakTone), AkhlakBand, Container/SectionHeader, Skeleton, EmptyState, **Dialog** (portal, focus trap bertumpuk, Esc, fokus kembali, bottom sheet di ponsel).
- `SiteHeader.tsx` / `SiteFooter.tsx` (ganti Navbar/Footer/Starfield). `FULL_BLEED_TABS` di `App.jsx` = tab yang sudah memakai `Container` sendiri.

**Halaman:**
| # | Halaman | Status |
|---|---|---|
| 1 | Beranda (`components/home/HomePage.tsx`) | ✅ |
| 2 | FAQ halaman sendiri (`components/faq/FaqPage.tsx`) | ✅ |
| 3 | Acara (`components/events/EventsPage.tsx` + hook `useProgram.jsx`) — commit `62b0f3e` | ✅ (kalender `EventCalendarView` masih gaya lama, label "COMPLETED" masih Inggris) |
| 4 | **Formulir** (`dynamic-form/` hook + sections) | ⏭️ berikutnya |
| 5 | Organisasi | ⏳ |
| 6 | Galeri | ⏳ |
| 7 | Kudos & Aspirasi — dipisah jadi dua halaman (ubah `NAV_ITEMS`) | ⏳ |
| 8 | Aset | ⏳ |
| 9 | Statistik pendaftaran / lucky draw | ⏳ |
| 10 | Admin portal bergaya dashboard | ⏳ |
| 11 | Audit aksesibilitas axe WCAG AA = 0 pelanggaran | ⏳ |

**Cara kerja yang terbukti aman untuk memindah halaman:** pindahkan logika komponen lama apa adanya ke hook (`useXxx.jsx`, return semua nilai), lalu tulis markup baru `.tsx` yang memakai hook itu (`useXxx(props as any) as Record<string, any>`); daftar semua perilaku JSX lama dulu agar tidak ada yang hilang (tombol, banner, keadaan kosong/tutup/penuh, deep link). Hapus file lama setelah build lulus.

**Catatan:** hanya ada 1 acara (Townhall 17 Nov, sudah lewat) sehingga filter bawaan "Mendatang & berjalan" kosong — perilaku sama dengan versi lama. Perbaikan zona waktu WIB (bapekkris `f745aca`) masih belum dibawa.

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
- **Uji UI di laptop kantor:** `*.netlify.app` dan `claude.ai` diblokir browser kantor (MDM) → uji ke `http://localhost:5173` (`npm run dev`), matikan dev server setelahnya (Zero Background Task). Gambar desain untuk pemilik ditampilkan sebagai PNG lokal, bukan Artifact.
