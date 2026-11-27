# Uji UI lokal (puppeteer-core + Chrome sistem)

Menjalankan Vite di port 5179 (terhubung ke Supabase produksi lewat `.env`), membuka Chrome headless, lalu mematikan keduanya. **Tidak menulis data** (pengunjung biasa; login salah saja).

```bash
npm i --no-save puppeteer-core     # sekali per laptop
node scripts/ui/ui-smoke.mjs       # 15 cek pengunjung
node scripts/ui/ui-router.mjs      # 20 cek navigasi/URL
node scripts/ui/look.mjs <folder> "nama|/#event|light|1440" "nama-hp|/#event|dark|390"   # screenshot
node scripts/ui/look-events.mjs <folder>   # screenshot + uji dialog halaman Acara
```

Chrome di lokasi lain: `CHROME_PATH=/path/ke/chrome node scripts/ui/...`.
Aturan uji yang menulis ke produksi: lihat `docs/HANDOFF.md` (insiden 27 Nov).
