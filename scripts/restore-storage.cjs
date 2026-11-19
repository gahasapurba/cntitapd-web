/**
 * Script Restore Otomatis Berkas Fisik ke Storage Bucket Supabase `cnt-media`
 * Membaca folder backups/storage/ (atau mengekstrak dari backup_latest.zip)
 * dan mengunggah kembali semua berkas ke Supabase Storage.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=([^\s]+)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=([^\s]+)/);
    if (!supabaseUrl && urlMatch) supabaseUrl = urlMatch[1];
    if (!supabaseKey && keyMatch) supabaseKey = keyMatch[1];
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error('[ERROR] Kredensial Supabase (URL / ANON KEY) tidak ditemukan.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function getAllFiles(dir, all = []) {
  if (!fs.existsSync(dir)) return all;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) getAllFiles(full, all);
    else all.push(full);
  });
  return all;
}

async function restoreStorage() {
  console.log(`[${new Date().toISOString()}] === MEMULAI RESTORE STORAGE KE SUPABASE ===`);
  const backupDir = path.join(__dirname, '..', 'backups');
  let storageDir = path.join(backupDir, 'storage');

  // Jika folder storage belum ada, coba ekstrak dari zip latest
  if (!fs.existsSync(storageDir)) {
    const latestZip = path.join(backupDir, 'supabase_full_backup_latest.zip');
    if (fs.existsSync(latestZip)) {
      console.log('Mengekstrak berkas storage dari', latestZip, '...');
      execSync(`unzip -q -o "${latestZip}" -d "${backupDir}"`);
    }
  }

  if (!fs.existsSync(storageDir)) {
    console.error('[ERROR] Folder backups/storage/ atau file zip backup tidak ditemukan.');
    process.exit(1);
  }

  const allFiles = getAllFiles(storageDir);
  console.log(`Ditemukan ${allFiles.length} berkas lokal untuk diunggah ke bucket cnt-media...\n`);

  let successCount = 0;
  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];
    const relPath = path.relative(storageDir, filePath).replace(/\\/g, '/');
    const fileBuffer = fs.readFileSync(filePath);

    let mime = 'application/octet-stream';
    if (relPath.endsWith('.jpg') || relPath.endsWith('.jpeg')) mime = 'image/jpeg';
    else if (relPath.endsWith('.png')) mime = 'image/png';
    else if (relPath.endsWith('.zip')) mime = 'application/zip';

    try {
      const { error } = await supabase.storage.from('cnt-media').upload(relPath, fileBuffer, {
        contentType: mime,
        upsert: true
      });

      if (error) {
        console.error(`  [${i + 1}/${allFiles.length}] ✗ Gagal upload ${relPath}:`, error.message);
      } else {
        successCount++;
        console.log(`  [${i + 1}/${allFiles.length}] ✓ ${relPath} berhasil diunggah.`);
      }
    } catch (err) {
      console.error(`  ✗ Error upload ${relPath}:`, err.message);
    }
  }

  console.log(`\n[SELESAI] Berhasil memulihkan ${successCount} dari ${allFiles.length} berkas ke Storage Bucket cnt-media!`);
}

restoreStorage().catch(err => {
  console.error('[FATAL] Restore gagal:', err);
  process.exit(1);
});
