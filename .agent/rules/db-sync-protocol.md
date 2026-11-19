# Protocol Sinkronisasi Database & Backup CNT IT APD

Setiap kali melakukan perubahan, penambahan fitur, pembaruan skema, atau modifikasi data master pada project CNT IT APD:
1. **Perbarui `supabase_schema.sql`**: Pastikan semua tabel, kolom baru, tipe data, foreign key, index, dan RLS policy tercatat secara akurat dan idempotent.
2. **Perbarui `supabase_seed.sql`**: Sinkronkan data master terbaru (tenures, divisions, roles, departments, members, brand assets, faqs, forms) ke dalam file seed data.
3. **Jalankan `npm run backup`**: Selalu generate snapshot backup terbaru (`supabase_full_backup_latest.zip` dan `backup_latest.json`) sehingga cadangan lokal selalu dalam kondisi paling mutakhir.
