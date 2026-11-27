// Tests the public form while it is OPEN, without writing anything to production.
// The browser gets the real forms with their deadline moved to the future (in memory only),
// every write request (submit_form, uploads, insert/update/delete) is aborted, and the
// script never presses the final "Ya, kirim sekarang" button.
//   node scripts/ui/ui-form-open.mjs [screenshot-folder]
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const require = createRequire(REPO + '/');
const puppeteer = require('puppeteer-core');
const out = process.argv[2];
const PORT = 5180;
const FUTURE = '2030-12-31T23:59:00+00:00';

const results = [];
const check = (name, ok, info = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${info}`); };
const isWrite = (req) => {
  const u = req.url();
  if (u.includes('/rpc/submit_form') || u.includes('/rpc/submit_rsvp')) return true;
  if (u.includes('/storage/v1/object') && req.method() !== 'GET') return true;
  return u.includes('/rest/v1/') && !u.includes('/rest/v1/rpc/') && !['GET', 'HEAD', 'OPTIONS'].includes(req.method());
};

// detached = own process group, so the whole npx → vite chain can be stopped at the end
const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
await new Promise(r => vite.stdout.on('data', d => { if (String(d).includes('Local')) r(); }));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });

async function openPage({ width, theme }) {
  const page = await browser.newPage();
  const blocked = [];
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((t) => localStorage.setItem('cnt_theme_choice', t), theme);
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    if (isWrite(req)) { blocked.push(`${req.method()} ${req.url().split('?')[0]}`); return req.abort(); }
    if (req.method() === 'GET' && /\/rest\/v1\/forms(\?|$)/.test(req.url())) {
      try {
        const res = await fetch(req.url(), { headers: req.headers() });
        const rows = await res.json();
        const body = JSON.stringify(Array.isArray(rows) ? rows.map(r => ({ ...r, deadline: FUTURE, is_open: true })) : rows);
        // The page calls Supabase cross-origin, so the substitute response needs CORS headers.
        const headers = { 'access-control-allow-origin': req.headers().origin || '*', 'access-control-expose-headers': 'content-range' };
        if (res.headers.get('content-range')) headers['content-range'] = res.headers.get('content-range');
        return req.respond({ status: res.status, contentType: 'application/json', headers, body });
      } catch { return req.continue(); }
    }
    return req.continue();
  });
  await page.goto(`http://localhost:${PORT}/#form`, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.waitForFunction(() => document.body.innerText.includes('Kirim pendaftaran'), { timeout: 20000 }).catch(() => {});
  return { page, blocked, errors };
}

try {
  // Desktop, light
  const { page, blocked, errors } = await openPage({ width: 1440, theme: 'light' });
  check('open form shows the submit button', await page.evaluate(() => document.body.innerText.includes('Kirim pendaftaran')));
  const picked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('nav[aria-labelledby="form-picker-title"] button')].find(x => x.innerText.includes('Open Recruitment'));
    if (b) b.click();
    return Boolean(b);
  });
  check('picker selects the recruitment form', picked);
  await page.waitForFunction(() => document.querySelector('form h2, section h2')?.textContent?.includes('Open Recruitment') || document.body.innerText.includes('Pilihan Divisi'), { timeout: 10000 }).catch(() => {});
  const labelled = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('form input:not([type=hidden]):not([type=radio]):not([type=file]):not([name=mandiri_corp_security_check]), form select, form textarea')];
    return { total: inputs.length, unlabeled: inputs.filter(i => !document.querySelector(`label[for="${i.id}"]`)).length };
  });
  check('every text/select/textarea field has a linked label', labelled.total > 5 && labelled.unlabeled === 0, JSON.stringify(labelled));
  if (out) await page.screenshot({ path: `${out}/open-web-light.png`, fullPage: true });

  await page.evaluate(() => [...document.querySelectorAll('form button[type=submit]')].pop()?.click());
  await new Promise(r => setTimeout(r, 500));
  const invalid = await page.evaluate(() => document.querySelectorAll('[aria-invalid="true"]').length);
  check('empty submit marks required fields invalid', invalid > 0, `(${invalid})`);
  check('no confirm dialog for an invalid form', await page.evaluate(() => !document.querySelector('[role=dialog]')));

  // Fill every field with test values (nothing is sent: the confirm dialog is never accepted)
  await page.evaluate(() => {
    const set = (el, v) => {
      const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    document.querySelectorAll('form input[type=text]:not([name=mandiri_corp_security_check]), form textarea').forEach((el, i) => set(el, `UJI OTOMATIS ${1000 + i}`));
    document.querySelectorAll('form input[type=email]').forEach(el => set(el, 'uji.otomatis@bankmandiri.co.id'));
    document.querySelectorAll('form input[type=number]').forEach(el => set(el, '12345'));
    document.querySelectorAll('form select').forEach(el => { if (el.options.length > 1) set(el, el.options[1].value); });
    const groups = new Set([...document.querySelectorAll('form input[type=radio]')].map(r => r.name));
    groups.forEach(n => document.querySelector(`form input[type=radio][name="${n}"]`)?.click());
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.evaluate(() => [...document.querySelectorAll('form button[type=submit]')].pop()?.click());
  await page.waitForSelector('[role=dialog]', { timeout: 8000 }).catch(() => {});
  const dialog = await page.evaluate(() => {
    const d = document.querySelector('[role=dialog]');
    return d ? { title: d.querySelector('h2')?.textContent, rows: d.querySelectorAll('dt').length, focusInside: d.contains(document.activeElement) } : null;
  });
  check('filled form opens the confirm dialog', Boolean(dialog && /Periksa isian/.test(dialog.title || '')), JSON.stringify(dialog));
  check('confirm dialog lists the filled answers', (dialog?.rows || 0) > 5);
  check('focus moves into the dialog', Boolean(dialog?.focusInside));
  if (out) await page.screenshot({ path: `${out}/open-web-confirm.png` });
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));
  check('Escape closes the dialog without sending', await page.evaluate(() => !document.querySelector('[role=dialog]')));
  check('no write request was attempted', blocked.length === 0, JSON.stringify(blocked));
  check('no page errors (desktop)', errors.length === 0, JSON.stringify(errors));
  await page.close();

  // Phone, dark: error state layout
  const m = await openPage({ width: 440, theme: 'dark' });
  await m.page.evaluate(() => [...document.querySelectorAll('form button[type=submit]')].pop()?.click());
  await new Promise(r => setTimeout(r, 500));
  const overflow = await m.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('phone: no horizontal scroll with errors shown', overflow <= 0, `(${overflow}px)`);
  if (out) await m.page.screenshot({ path: `${out}/open-hp-dark-errors.png`, fullPage: true });
  check('phone: no write request was attempted', m.blocked.length === 0, JSON.stringify(m.blocked));
  check('no page errors (phone)', m.errors.length === 0, JSON.stringify(m.errors));
} finally {
  await browser.close();
  try { process.kill(-vite.pid, 'SIGTERM'); } catch { vite.kill('SIGTERM'); }
}
const failed = results.filter(r => !r).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
