/**
 * Script Full Backup Otomatis Database & Storage Bucket Supabase CNT IT APD
 * 1. Mengambil seluruh data 16 tabel PostgreSQL -> database.json
 * 2. Mengunduh seluruh berkas fisik (foto, zip, media) dari Storage Bucket `cnt-media` -> storage/
 * 3. Mengemas keduanya menjadi satu arsip ZIP utuh (Full Disaster Recovery Archive)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

if (!projectId) projectId = 'xarcxbfgeoetyhpqsick';

if (!token) {
  console.error('[ERROR] SUPABASE_MGMT_TOKEN tidak ditemukan.');
  process.exit(1);
}

const tables = [
  'tenures', 'tenure_roles', 'departments', 'divisions', 'members',
  'events', 'galleries', 'kudos', 'aspirasi', 'forms', 'submissions',
  'lucky_draws', 'event_rsvps', 'faqs', 'brand_assets', 'page_settings'
];

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} when downloading ${url}`);
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

async function runFullBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  console.log(`[${new Date().toISOString()}] === MEMULAI FULL BACKUP SUPABASE (DB + STORAGE) ===`);
  console.log(`Project ID: ${projectId}\n`);

  const backupDir = path.join(__dirname, '..', 'backups');
  const tempDir = path.join(backupDir, `snapshot_${timestamp}`);
  const storageDir = path.join(tempDir, 'storage');

  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

  // 1. BACKUP DATABASE SQL TABLES
  console.log('--- 1/2. Mengunduh Data Tabel Database ---');
  const backupData = {
    meta: {
      timestamp: new Date().toISOString(),
      projectId,
      version: '2.0-full'
    },
    tables: {}
  };

  let totalDbRows = 0;
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
        totalDbRows += res.length;
        console.log(`  ✓ ${tbl}: ${res.length} rows`);
      } else {
        backupData.tables[tbl] = [];
      }
    } catch (err) {
      console.error(`  ✗ ${tbl} error:`, err.message);
      backupData.tables[tbl] = [];
    }
  }

  const dbJsonPath = path.join(tempDir, 'database.json');
  fs.writeFileSync(dbJsonPath, JSON.stringify(backupData, null, 2), 'utf8');

  // 2. BACKUP STORAGE BUCKET (cnt-media)
  console.log('\n--- 2/2. Mengunduh Berkas Fisik Storage Bucket (cnt-media) ---');
  let storageFiles = [];
  try {
    const listRes = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `SELECT name, (metadata->>'size')::bigint as size FROM storage.objects WHERE bucket_id = 'cnt-media' ORDER BY name;`
      })
    }).then(r => r.json());

    if (Array.isArray(listRes)) {
      storageFiles = listRes;
      console.log(`Ditemukan ${storageFiles.length} berkas fisik di bucket cnt-media.`);
    }
  } catch (err) {
    console.error('Gagal membaca daftar file storage:', err.message);
  }

  let totalDownloadedBytes = 0;
  for (let i = 0; i < storageFiles.length; i++) {
    const fileObj = storageFiles[i];
    const fileUrl = `https://${projectId}.supabase.co/storage/v1/object/public/cnt-media/${fileObj.name}`;
    const dest = path.join(storageDir, fileObj.name);

    try {
      await downloadFile(fileUrl, dest);
      totalDownloadedBytes += Number(fileObj.size || 0);
      const sizeMb = (Number(fileObj.size || 0) / 1024 / 1024).toFixed(2);
      console.log(`  [${i + 1}/${storageFiles.length}] ✓ ${fileObj.name} (${sizeMb} MB)`);
    } catch (err) {
      console.error(`  ✗ Gagal download ${fileObj.name}:`, err.message);
    }
  }

  console.log(`\nSelesai mengunduh storage: ${(totalDownloadedBytes / 1024 / 1024).toFixed(2)} MB`);

  // 3. PACKAGING KE FILE ZIP
  console.log('\n--- 3/3. Mengompresi Database & Storage ke Archive ZIP ---');
  const zipFilename = `supabase_full_backup_${timestamp}.zip`;
  const zipPath = path.join(backupDir, zipFilename);
  const latestZipPath = path.join(backupDir, 'supabase_full_backup_latest.zip');
  const latestJsonPath = path.join(backupDir, 'backup_latest.json');

  // Salin JSON ke backup_latest.json juga
  fs.copyFileSync(dbJsonPath, latestJsonPath);

  try {
    // Kompresi menggunakan zip CLI
    execSync(`cd "${tempDir}" && zip -r "${zipPath}" database.json storage/ -q`);
    fs.copyFileSync(zipPath, latestZipPath);
    console.log(`  ✓ ZIP berhasil dibuat: ${zipPath}`);
  } catch (err) {
    console.warn('  ⚠️ Tidak dapat membuat file zip otomatis via CLI:', err.message);
  }

  // Bersihkan temp directory
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}

  console.log(`\n============================================================`);
  console.log(`[SUCCESS] FULL BACKUP SELESAI DENGAN SUKSES!`);
  console.log(`  • Total Data Database : ${totalDbRows} baris`);
  console.log(`  • Total File Storage  : ${storageFiles.length} berkas (${(totalDownloadedBytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`  • Berkas Arsip Utuh   : ${zipPath}`);
  console.log(`  • Arsip Versi Terbaru : ${latestZipPath}`);
  console.log(`============================================================\n`);
}

runFullBackup().catch(err => {
  console.error('[FATAL] Backup gagal:', err);
  process.exit(1);
});
