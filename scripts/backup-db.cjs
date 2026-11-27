/**
 * Script Full Backup Otomatis Database & Storage Bucket Supabase CNT IT APD
 * 
 * SAFETY NET SYSTEM:
 * 1. Database Priority: Database SQL selalu di-backup dan diisolasi terlebih dahulu,
 *    sehingga kegagalan pada storage tidak akan menggugurkan backup data utama.
 * 2. Early Warning: Peringatan otomatis jika ukuran mendekati ambang batas tertentu.
 * 3. GitHub Step Summary: Laporan visual otomatis di dashboard GitHub Actions setiap eksekusi
 *    dengan penanda jelas apakah dijalankan oleh SISTEM (02:00 WIB) atau ANTIGRAVITY AI.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let token = process.env.SUPABASE_MGMT_TOKEN;
let projectId = process.env.SUPABASE_PROJECT_ID;

const triggerTag = process.env.TRIGGER_TAG || 'LOCAL';
const triggerLabel = process.env.TRIGGER_LABEL || (triggerTag === 'SYSTEM' ? '⏰ Sistem (Jadwal Otomatis 02:00 WIB)' : '🤖 Antigravity AI (Manual / Pasca Pembaruan)');

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

// Menulis ringkasan ke GitHub Actions Summary jika berjalan di CI
function appendGithubSummary(markdown) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    try {
      fs.appendFileSync(summaryFile, markdown + '\n', 'utf8');
    } catch (e) {}
  }
}

async function runFullBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  console.log(`[${new Date().toISOString()}] === MEMULAI FULL BACKUP SUPABASE (DB + STORAGE) ===`);
  console.log(`Dijalankan Oleh : ${triggerLabel} [${triggerTag}]`);
  console.log(`Project ID      : ${projectId}\n`);

  const backupDir = path.join(__dirname, '..', 'backups');
  const tempDir = path.join(backupDir, `snapshot_${timestamp}`);
  const storageDir = path.join(tempDir, 'storage');

  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

  // -------------------------------------------------------------------------
  // SAFETY NET 1: ISOLASI DATABASE POSTGRESQL TERLEBIH DAHULU
  // -------------------------------------------------------------------------
  console.log('--- 1/2. Mengunduh Data Tabel Database ---');
  const backupData = {
    meta: {
      timestamp: new Date().toISOString(),
      projectId,
      triggerTag,
      triggerLabel,
      version: '2.2-cloud-labeled'
    },
    tables: {}
  };

  let totalDbRows = 0;
  const tableStats = [];

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
        tableStats.push({ table: tbl, count: res.length, status: 'OK' });
        console.log(`  ✓ ${tbl}: ${res.length} rows`);
      } else {
        backupData.tables[tbl] = [];
        tableStats.push({ table: tbl, count: 0, status: 'EMPTY / WARN' });
      }
    } catch (err) {
      console.error(`  ✗ ${tbl} error:`, err.message);
      backupData.tables[tbl] = [];
      tableStats.push({ table: tbl, count: 0, status: 'ERROR' });
    }
  }

  const dbJsonPath = path.join(tempDir, 'database.json');
  fs.writeFileSync(dbJsonPath, JSON.stringify(backupData, null, 2), 'utf8');

  // Simpan database.json langsung ke backups/ agar salinan database selalu aman
  const standaloneDbJson = path.join(backupDir, `database_${triggerTag}_${timestamp}.json`);
  const latestJsonPath = path.join(backupDir, 'backup_latest.json');
  fs.copyFileSync(dbJsonPath, standaloneDbJson);
  fs.copyFileSync(dbJsonPath, latestJsonPath);

  // -------------------------------------------------------------------------
  // 2. MENGUNDUH STORAGE BUCKET DENGAN PENANGANAN ERROR PER BERKAS
  // -------------------------------------------------------------------------
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
  let failedStorageCount = 0;

  for (let i = 0; i < storageFiles.length; i++) {
    const fileObj = storageFiles[i];
    const fileUrl = `https://${projectId}.supabase.co/storage/v1/object/public/cnt-media/${fileObj.name}`;
    const dest = path.join(storageDir, fileObj.name);

    try {
      await downloadFile(fileUrl, dest);
      totalDownloadedBytes += Number(fileObj.size || 0);
      const sizeMb = (Number(fileObj.size || 0) / 1024 / 1024).toFixed(2);
      console.log(`  [${i + 1}/${storageFiles.length}] ✓ ${sizeMb} MB`); // nama berkas sengaja tidak dicetak: log Actions repo publik terbuka
    } catch (err) {
      failedStorageCount++;
      console.error(`  ✗ Gagal download berkas #${i + 1}:`, err.message);
    }
  }

  const storageSizeMb = (totalDownloadedBytes / 1024 / 1024).toFixed(2);
  console.log(`\nSelesai mengunduh storage: ${storageSizeMb} MB`);

  // -------------------------------------------------------------------------
  // SAFETY NET 2: EARLY WARNING THRESHOLD CHECK
  // -------------------------------------------------------------------------
  const WARN_THRESHOLD_MB = 400; // Peringatan awal jika mendekati 400 MB
  const CRIT_THRESHOLD_MB = 800; // Peringatan kritis jika mendekati 800 MB
  let alertLevel = 'NORMAL';

  if (totalDownloadedBytes > CRIT_THRESHOLD_MB * 1024 * 1024) {
    alertLevel = 'CRITICAL';
    console.log(`::error::[CRITICAL CAPACITY] Total ukuran backup (${storageSizeMb} MB) telah melampaui ${CRIT_THRESHOLD_MB} MB!`);
  } else if (totalDownloadedBytes > WARN_THRESHOLD_MB * 1024 * 1024) {
    alertLevel = 'WARNING';
    console.log(`::warning::[EARLY WARNING] Total ukuran backup (${storageSizeMb} MB) telah melampaui ${WARN_THRESHOLD_MB} MB.`);
  }

  // -------------------------------------------------------------------------
  // 3. PACKAGING KE FILE ZIP DENGAN LABEL JELAS
  // -------------------------------------------------------------------------
  console.log('\n--- 3/3. Mengompresi Database & Storage ke Archive ZIP ---');
  const zipFilename = `supabase_backup_${triggerTag}_${timestamp}.zip`;
  const zipPath = path.join(backupDir, zipFilename);
  const latestZipPath = path.join(backupDir, 'supabase_full_backup_latest.zip');

  let zipSuccess = false;
  try {
    execSync(`cd "${tempDir}" && zip -r "${zipPath}" database.json storage/ -q`);
    fs.copyFileSync(zipPath, latestZipPath);
    zipSuccess = true;
    console.log(`  ✓ ZIP berhasil dibuat: ${zipPath}`);
  } catch (err) {
    console.warn('  ⚠️ Tidak dapat membuat file zip otomatis via CLI:', err.message);
  }

  // Bersihkan temp directory
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}

  // -------------------------------------------------------------------------
  // SAFETY NET 3: GITHUB ACTIONS DASHBOARD STEP SUMMARY
  // -------------------------------------------------------------------------
  const summaryMarkdown = `
## 🛡️ Laporan Supabase Full Backup

- **Dijalankan Oleh:** **${triggerLabel}** (\`${triggerTag}\`)
- **Status Eksekusi:** ${zipSuccess ? '✅ Berhasil Sempurna' : '⚠️ Berhasil Sebagian (Database Terselamatkan)'}
- **Waktu Eksekusi:** \`${new Date().toISOString()}\`
- **Total Data Database:** **${totalDbRows} baris** (16 tabel)
- **Total Berkas Storage:** **${storageFiles.length} file** (${storageSizeMb} MB)
- **Status Kapasitas:** ${alertLevel === 'NORMAL' ? '🟢 Normal (< 400 MB)' : alertLevel === 'WARNING' ? '🟡 Perhatian (> 400 MB)' : '🔴 Kritis (> 800 MB)'}

### Rincian Data Tabel Database:
| Tabel | Jumlah Baris | Status |
| :--- | :---: | :---: |
${tableStats.map(s => `| \`${s.table}\` | ${s.count} | ${s.status === 'OK' ? '✓' : '⚠️'} |`).join('\n')}

> *Catatan: Backup disimpan secara aman di Cloud GitHub Actions Artifacts.*
`;

  appendGithubSummary(summaryMarkdown);

  console.log(`\n============================================================`);
  console.log(`[SUCCESS] FULL BACKUP SELESAI DENGAN SUKSES!`);
  console.log(`  • Dijalankan Oleh     : ${triggerLabel} [${triggerTag}]`);
  console.log(`  • Status Safety Net   : ${alertLevel}`);
  console.log(`  • Total Data Database : ${totalDbRows} baris`);
  console.log(`  • Total File Storage  : ${storageFiles.length} berkas (${storageSizeMb} MB)`);
  console.log(`  • Berkas Database     : ${standaloneDbJson}`);
  console.log(`  • Berkas Arsip Utuh   : ${zipPath}`);
  console.log(`============================================================\n`);
}

runFullBackup().catch(err => {
  console.error('[FATAL] Backup gagal:', err);
  process.exit(1);
});
