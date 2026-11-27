# Uji UI lokal (puppeteer-core + Chrome sistem)

Menjalankan Vite di port 5179 (terhubung ke Supabase produksi lewat `.env`), membuka Chrome headless, lalu mematikan keduanya. **Tidak menulis data** (pengunjung biasa; login salah saja).

```bash
npm i --no-save puppeteer-core     # sekali per laptop
node scripts/ui/ui-smoke.mjs       # 15 cek pengunjung
node scripts/ui/ui-router.mjs      # 20 cek navigasi/URL
node scripts/ui/ui-form-open.mjs [folder]   # 14 cek formulir TERBUKA (tenggat diundur di memori browser, semua request tulis diblokir, tombol kirim terakhir tidak pernah ditekan)
node scripts/ui/look.mjs <folder> "nama|/#event|light|1440" "nama-hp|/#event|dark|390"   # screenshot
node scripts/ui/look-events.mjs <folder>   # screenshot + uji dialog halaman Acara
```

Chrome di lokasi lain: `CHROME_PATH=/path/ke/chrome node scripts/ui/...` (laptop rumah tanpa Chrome: Chromium Playwright di `~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`).
Skrip menjalankan Vite di grup proses sendiri dan mematikannya di akhir (Zero Background Task).
Aturan uji yang menulis ke produksi: lihat `docs/HANDOFF.md` (insiden 27 Nov).
