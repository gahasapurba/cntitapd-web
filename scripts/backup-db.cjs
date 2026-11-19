/**
 * Script Backup Otomatis Database Supabase CNT IT APD
 * Mengambil seluruh data 16 tabel dan menyimpannya ke dalam file JSON bertanggal
 * Bisa dijalankan secara manual (npm run backup) atau otomatis via GitHub Actions.
 */

const fs = require('fs');
const path = require('path');

// Ambil token & project id dari environment variable atau dari file .env lokal
let token = process.env.SUPABASE_MGMT_TOKEN;
let projectId = process.env.SUPABASE_PROJECT_ID;

if (!token || !projectId) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const tokenMatch = envContent.match(/SUPABASE_MGMT_TOKEN=([^\s]+)/);
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=https:\/\/([^.]+)\.supabase\.co/);
    if (!token && tokenMatch) token = tokenMatch[1];
    if (!projectId && urlMatch) projectId = urlMatch[1];
  }
}

if (!projectId) {
  projectId = 'xarcxbfgeoetyhpqsick';
}

if (!token) {
  console.error('[ERROR] SUPABASE_MGMT_TOKEN tidak ditemukan.');
  console.error('Silakan set SUPABASE_MGMT_TOKEN di environment variable atau di file .env lokal.');
  process.exit(1);
}

const tables = [
  'tenures', 'tenure_roles', 'departments', 'divisions', 'members',
  'events', 'galleries', 'kudos', 'aspirasi', 'forms', 'submissions',
  'lucky_draws', 'event_rsvps', 'faqs', 'brand_assets', 'page_settings'
];

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  console.log(`[${new Date().toISOString()}] Memulai proses backup Supabase (Project: ${projectId})...`);

  const backupData = {
    meta: {
      timestamp: new Date().toISOString(),
      projectId,
      version: '1.0'
    },
    tables: {}
  };

  let totalRows = 0;

  for (const tbl of tables) {
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: `SELECT * FROM public.${tbl};` })
      }).then(r => r.json());

      if (Array.isArray(res)) {
        backupData.tables[tbl] = res;
        totalRows += res.length;
        console.log(`  ✓ ${tbl}: ${res.length} rows`);
      } else {
        backupData.tables[tbl] = [];
        console.warn(`  ⚠️ ${tbl}: respons kosong atau format tidak sesuai`, res);
      }
    } catch (err) {
      console.error(`  ✗ ${tbl} error:`, err.message);
      backupData.tables[tbl] = [];
    }
  }

  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filename = `backup_${timestamp}.json`;
  const filePath = path.join(backupDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');

  // Simpan juga versi latest untuk kemudahan restore instan
  const latestPath = path.join(backupDir, 'backup_latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(backupData, null, 2), 'utf8');

  console.log(`[SUCCESS] Backup selesai! Total ${totalRows} baris disimpan ke:`);
  console.log(`  📁 ${filePath}`);
  console.log(`  📁 ${latestPath}`);
}

runBackup().catch(err => {
  console.error('[FATAL] Backup gagal:', err);
  process.exit(1);
});
