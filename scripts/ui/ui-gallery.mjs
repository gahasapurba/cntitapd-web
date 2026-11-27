// Gallery page checks (read-only: a write request fails the run).
//   node scripts/ui/ui-gallery.mjs [screenshot-folder]
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const require = createRequire(REPO + '/');
const puppeteer = require('puppeteer-core');
const out = process.argv[2];
const PORT = 5184;
const BASE = `http://localhost:${PORT}`;

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

async function open(path, width) {
  const page = await browser.newPage();
  const blocked = []; const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setRequestInterception(true);
  page.on('request', (req) => { if (isWrite(req)) { blocked.push(req.url()); return req.abort(); } req.continue(); });
  await page.setViewport({ width, height: 900 });
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForSelector('#gallery-viewer, [class*="border-dashed"]', { timeout: 20000 }).catch(() => {});
  return { page, blocked, errors };
}
const counter = (page) => page.evaluate(() => document.querySelector('#gallery-viewer [aria-live="polite"]')?.textContent?.trim());
const viewerTitle = (page) => page.evaluate(() => document.querySelector('#gallery-title')?.textContent?.trim());

try {
  const { page, blocked, errors } = await open('/#galeri', 1440);
  const firstTitle = await viewerTitle(page);
  check('viewer shows an album', Boolean(firstTitle), `(${firstTitle})`);
  const before = await counter(page);
  const hasNext = await page.evaluate(() => Boolean(document.querySelector('#gallery-viewer button[aria-label="Foto berikutnya"]')));
  if (hasNext) {
    await page.click('#gallery-viewer button[aria-label="Foto berikutnya"]');
    await sleep(200);
    check('next photo advances the counter', (await counter(page)) !== before, `${before} → ${await counter(page)}`);
    await page.click('#gallery-viewer button[aria-label="Foto 1"]');
    await sleep(200);
    check('thumbnail selects that photo (aria-current)', await page.evaluate(() => document.querySelector('#gallery-viewer button[aria-label="Foto 1"]')?.getAttribute('aria-current') === 'true'));
  }

  // Lightbox
  await page.click('#gallery-viewer button[aria-label="Perbesar foto ke layar penuh"]');
  await page.waitForSelector('[role=dialog][aria-modal=true]', { timeout: 5000 }).catch(() => {});
  const lb = await page.evaluate(() => {
    const d = document.querySelector('[role=dialog][aria-modal=true]');
    return d ? { label: d.getAttribute('aria-label'), focus: document.activeElement?.getAttribute('aria-label') } : null;
  });
  check('lightbox opens with focus on close', Boolean(lb && lb.focus === 'Tutup layar penuh'), JSON.stringify(lb));
  if (out) await page.screenshot({ path: `${out}/lightbox.png` });
  if (hasNext) {
    const l1 = await page.evaluate(() => document.querySelector('[role=dialog][aria-modal=true]')?.getAttribute('aria-label'));
    await page.keyboard.press('ArrowRight');
    await sleep(200);
    const l2 = await page.evaluate(() => document.querySelector('[role=dialog][aria-modal=true]')?.getAttribute('aria-label'));
    check('ArrowRight moves to the next photo in the lightbox', l1 !== l2, `${l1} → ${l2}`);
  }
  await page.keyboard.press('Escape');
  await sleep(300);
  const after = await page.evaluate(() => ({ open: Boolean(document.querySelector('[role=dialog][aria-modal=true]')), focus: document.activeElement?.getAttribute('aria-label'), scrollLock: document.body.style.overflow }));
  check('Escape closes the lightbox and returns focus', !after.open && after.focus === 'Perbesar foto ke layar penuh' && after.scrollLock !== 'hidden', JSON.stringify(after));

  // Pick another album from the list
  const picked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('article h3 button[aria-pressed="false"]')][0];
    b?.click();
    return b?.textContent?.trim() || '';
  });
  await sleep(500);
  const url = await page.evaluate(() => location.search + location.hash);
  check('choosing an album updates the viewer and the URL', (await viewerTitle(page)) === picked && /\?gallery=/.test(url), JSON.stringify({ picked, viewer: await viewerTitle(page), url }));
  const galleryId = new URLSearchParams(url.split('#')[0]).get('gallery');

  // Search
  await page.type('#gallery-search', 'zzzz-tidak-ada');
  await sleep(300);
  check('no-match search shows the empty state', await page.evaluate(() => document.body.innerText.includes('Tidak ada album yang cocok')));
  const unlabeled = await page.evaluate(() => [...document.querySelectorAll('main input, main select')].filter(el => !document.querySelector(`label[for="${el.id}"]`)).length);
  check('search and division filter have labels', unlabeled === 0);
  check('no write request was attempted', blocked.length === 0, JSON.stringify(blocked));
  check('no page errors (desktop)', errors.length === 0, JSON.stringify(errors));
  await page.close();

  // Deep links
  const deep = await open(`/?gallery=${encodeURIComponent(galleryId)}#galeri`, 1440);
  check('deep link opens the linked album', (await viewerTitle(deep.page)) === picked, `(${await viewerTitle(deep.page)})`);
  await deep.page.close();
  const missing = await open('/?gallery=album-yang-tidak-ada#galeri', 1440);
  check('unknown album link shows "Album tidak ditemukan"', await missing.page.evaluate(() => document.body.innerText.includes('Album tidak ditemukan')));
  await missing.page.close();

  // Phone
  const m = await open('/#galeri', 440);
  const overflow = await m.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('phone: no horizontal scroll', overflow <= 0, `(${overflow}px)`);
  await m.page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
  await sleep(1500);
  const covers = await m.page.evaluate(() => {
    const imgs = [...document.querySelectorAll('article img')];
    return { total: imgs.length, loaded: imgs.filter(i => i.complete && i.naturalWidth > 0).length };
  });
  check('phone: lazy album covers load after scrolling', covers.total > 0 && covers.loaded === covers.total, JSON.stringify(covers));
  check('no page errors (phone)', m.errors.length === 0, JSON.stringify(m.errors));
} finally {
  await browser.close();
  try { process.kill(-vite.pid, 'SIGTERM'); } catch { vite.kill('SIGTERM'); }
}
const failed = results.filter(r => !r).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
