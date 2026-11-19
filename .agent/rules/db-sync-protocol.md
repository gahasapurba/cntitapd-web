# Protocol Sinkronisasi Database & Backup CNT IT APD

Setiap kali melakukan perubahan, penambahan fitur, pembaruan skema, atau modifikasi data master pada project CNT IT APD:
1. **Perbarui `supabase_schema.sql`**: Pastikan semua tabel, kolom baru, tipe data, foreign key, index, dan RLS policy tercatat secara akurat dan idempotent.
2. **Perbarui `supabase_seed.sql`**: Sinkronkan data master terbaru (tenures, divisions, roles, departments, members, brand assets, faqs, forms) ke dalam file seed data.
3. **Backup Cloud Otomatis (Bebas Beban Disk Lokal)**:
   - **JANGAN simpan backup di disk lokal** agar kapasitas laptop tetap bersih dan tidak cepat penuh.
   - Semua backup disimpan sebagai secure artifact di **GitHub Actions Cloud**.
   - Setiap kali `supabase_schema.sql` atau `supabase_seed.sql` di-commit & di-push ke GitHub, GitHub Actions otomatis memicu full backup bertanda **`ANTIGRAVITY`** (`supabase-backup-ANTIGRAVITY-...`).
   - Sistem terjadwal otomatis menjalankan backup harian bertanda **`SYSTEM`** (`supabase-backup-SYSTEM-...`) setiap pukul 02:00 WIB.

