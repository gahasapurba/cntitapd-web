// Organisation page checks (read-only: a write request fails the run).
//   node scripts/ui/ui-organization.mjs [screenshot-folder]
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, readdirSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const REPO = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const require = createRequire(REPO + '/');
const puppeteer = require('puppeteer-core');
const out = process.argv[2];
const PORT = 5181;

const results = [];
const check = (name, ok, info = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${info}`); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const isWrite = (req) => {
  const u = req.url();
  if (u.includes('/storage/v1/object') && req.method() !== 'GET') return true;
  if (u.includes('/rest/v1/rpc/')) return /submit_|like_|pray_/.test(u);
  return u.includes('/rest/v1/') && !['GET', 'HEAD', 'OPTIONS'].includes(req.method());
};

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
await new Promise(r => vite.stdout.on('data', d => { if (String(d).includes('Local')) r(); }));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const downloads = mkdtempSync(join(tmpdir(), 'cnt-org-pdf-'));

try {
  const page = await browser.newPage();
  const blocked = []; const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setRequestInterception(true);
  page.on('request', (req) => { if (isWrite(req)) { blocked.push(req.url()); return req.abort(); } req.continue(); });
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`http://localhost:${PORT}/#organisasi`, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForSelector('#org-tree-export-container', { timeout: 20000 }).catch(() => {});

  const chart = await page.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent,
    cards: document.querySelectorAll('#org-tree-export-container [data-org-card]').length,
    divisions: document.querySelectorAll('#org-tree-export-container section[aria-label^="Divisi"]').length,
    profileButtons: document.querySelectorAll('#org-tree-export-container button[aria-label^="Lihat profil"]').length
  }));
  check('chart renders people and divisions', chart.cards > 0 && chart.divisions > 0, JSON.stringify(chart));
  const unlabeled = await page.evaluate(() => [...document.querySelectorAll('main input, main select')].filter(el => !document.querySelector(`label[for="${el.id}"]`)).length);
  check('search and filters have labels', unlabeled === 0, `(${unlabeled} unlabeled)`);

  // Profile dialog
  const opened = await page.evaluate(() => {
    const b = document.querySelector('#org-tree-export-container button[aria-label^="Lihat profil"]');
    b?.click();
    return b?.getAttribute('aria-label') || '';
  });
  await page.waitForSelector('[role=dialog]', { timeout: 5000 }).catch(() => {});
  const dialog = await page.evaluate(() => {
    const d = document.querySelector('[role=dialog]');
    return d ? { title: d.querySelector('h2')?.textContent, vcard: [...d.querySelectorAll('button')].some(b => b.textContent.includes('Simpan kontak')), focusInside: d.contains(document.activeElement) } : null;
  });
  check('profile dialog opens for the clicked person', Boolean(dialog && opened.includes(dialog.title || '#')), JSON.stringify({ opened, dialog }));
  check('profile dialog offers the contact download', Boolean(dialog?.vcard));
  check('focus moves into the profile dialog', Boolean(dialog?.focusInside));
  if (out) await page.screenshot({ path: `${out}/org-dialog.png` });
  await page.keyboard.press('Escape');
  await sleep(300);
  check('Escape closes the profile', await page.evaluate(() => !document.querySelector('[role=dialog]')));

  // Search
  const someName = await page.evaluate(() => document.querySelector('#org-tree-export-container button[aria-label^="Lihat profil"]')?.textContent?.trim() || '');
  await page.type('#org-search', someName.split(' ')[0]);
  await sleep(400);
  const found = await page.evaluate(() => ({ chip: [...document.querySelectorAll('main span')].find(s => /pengurus ditemukan/.test(s.textContent))?.textContent, chartHidden: document.querySelector('#org-tree-export-container')?.closest('.hidden') !== null }));
  check('search shows matching people and hides the chart', /^[1-9]\d* pengurus ditemukan/.test(found.chip || '') && found.chartHidden, JSON.stringify(found));
  await page.type('#org-search', 'zzzz-tidak-ada');
  await sleep(300);
  check('no-match search shows the empty state', await page.evaluate(() => document.body.innerText.includes('Tidak ada yang cocok')));
  await page.evaluate(() => [...document.querySelectorAll('main button')].find(b => b.textContent.trim() === 'Hapus filter')?.click());
  await sleep(300);
  check('clearing the filter brings the chart back', await page.evaluate(() => document.querySelector('#org-tree-export-container')?.closest('.hidden') === null && document.querySelector('#org-search').value === ''));

  // PDF export produces a file
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });
  await page.evaluate(() => [...document.querySelectorAll('main button')].find(b => b.textContent.includes('Unduh bagan'))?.click());
  let pdf = null;
  for (let i = 0; i < 40 && !pdf; i++) {
    await sleep(500);
    const f = readdirSync(downloads).find(n => n.endsWith('.pdf'));
    if (f) pdf = { name: f, kb: Math.round(statSync(join(downloads, f)).size / 1024) };
  }
  check('PDF export downloads a chart file', Boolean(pdf && pdf.kb > 20), JSON.stringify(pdf));

  check('no write request was attempted', blocked.length === 0, JSON.stringify(blocked));
  check('no page errors (desktop)', errors.length === 0, JSON.stringify(errors));
  await page.close();

  // Phone
  const m = await browser.newPage();
  const mErrors = [];
  m.on('pageerror', e => mErrors.push(e.message));
  await m.setViewport({ width: 440, height: 900 });
  await m.goto(`http://localhost:${PORT}/#organisasi`, { waitUntil: 'networkidle2', timeout: 45000 });
  await m.waitForSelector('#org-tree-export-container', { timeout: 20000 }).catch(() => {});
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('phone: no horizontal scroll', overflow <= 0, `(${overflow}px)`);
  const stems = await m.evaluate(() => [...document.querySelectorAll('#org-tree-export-container [aria-hidden="true"].bg-line-strong')].filter(el => getComputedStyle(el).display !== 'none').length);
  check('phone: connector lines are hidden', stems === 0, `(${stems} visible)`);
  check('no page errors (phone)', mErrors.length === 0, JSON.stringify(mErrors));
} finally {
  await browser.close();
  try { process.kill(-vite.pid, 'SIGTERM'); } catch { vite.kill('SIGTERM'); }
  rmSync(downloads, { recursive: true, force: true });
}
const failed = results.filter(r => !r).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
