import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, ''); // decode: path boleh berisi spasi
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const require = createRequire(REPO + '/');
const puppeteer = require('puppeteer-core');
const out = process.argv[2];
const vite = spawn('npx', ['vite', '--port', '5179', '--strictPort'], { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
await new Promise(r => vite.stdout.on('data', d => { if (String(d).includes('Local')) r(); }));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const errors = []; const checks = [];
try {
  for (const [name, theme, width] of [['events-light','light',1440],['events-dark','dark',1440],['events-mobile','light',390]]) {
    const p = await browser.newPage();
    p.on('pageerror', e => errors.push(`${name}: ${e.message}`));
    p.on('request', r => { if (r.method() !== 'GET' && r.method() !== 'OPTIONS' && !/rpc\/(get_|track)/.test(r.url())) errors.push(`${name}: write ${r.method()} ${r.url()}`); });
    await p.setViewport({ width, height: 900 });
    await p.evaluateOnNewDocument((t) => localStorage.setItem('cnt_theme_choice', t), theme);
    await p.goto('http://localhost:5179/#event', { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 1500));
    await p.screenshot({ path: `${out}/${name}-empty.png`, fullPage: true });
    await p.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.startsWith('Semua ('))?.click());
    await new Promise(r => setTimeout(r, 600));
    await p.screenshot({ path: `${out}/${name}.png`, fullPage: true });
    const opened = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Detail & RSVP|Info & daftar hadir/.test(x.textContent)); if (b) { b.click(); return b.textContent; } return null; });
    await new Promise(r => setTimeout(r, 800));
    const dlg = await p.evaluate(() => { const d = document.querySelector('[role=dialog]'); return d ? { title: d.querySelector('h2')?.textContent, focusIn: d.contains(document.activeElement), url: location.search } : null; });
    checks.push([name, 'modal opens', Boolean(opened && dlg), JSON.stringify(dlg)]);
    await p.screenshot({ path: `${out}/${name}-modal.png` });
    await p.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));
    const closed = await p.evaluate(() => ({ gone: !document.querySelector('[role=dialog]'), url: location.search, overflow: document.body.style.overflow }));
    checks.push([name, 'escape closes', closed.gone && !closed.url.includes('event='), JSON.stringify(closed)]);
    await p.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.includes('Kalender'))?.click());
    await new Promise(r => setTimeout(r, 800));
    await p.screenshot({ path: `${out}/${name}-calendar.png`, fullPage: true });
    const hscroll = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    checks.push([name, 'no horizontal scroll (calendar)', !hscroll, '']);
    await p.close();
  }
} finally { await browser.close(); try { process.kill(-vite.pid, 'SIGTERM'); } catch { vite.kill('SIGTERM'); } }
for (const c of checks) console.log(c[2] ? 'PASS' : 'FAIL', c[0], c[1], c[3]);
console.log('errors:', errors.length ? errors : 'none');
