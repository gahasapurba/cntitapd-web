// Visitor smoke test: Vite dev server (production Supabase) + headless Chrome. Stops the server at the end.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, ''); // decode: path boleh berisi spasi
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const require = createRequire(REPO + '/');
const puppeteer = require('puppeteer-core');

const ROOT = REPO;
const PORT = 5179;
const BASE = `http://localhost:${PORT}`;
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${extra}`); };

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
const killVite = () => { try { vite.kill('SIGTERM'); } catch (e) { /* already stopped */ } };
process.on('exit', killVite);
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('vite did not start in 30s')), 30000);
  vite.stdout.on('data', (d) => { if (String(d).includes('Local')) { clearTimeout(t); resolve(); } });
});

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-first-run', '--no-default-browser-check']
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  const consoleErrors = [];
  const restCalls = [];
  const badResponses = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + String(e.message).slice(0, 200)));
  page.on('response', (r) => {
    const u = r.url();
    if (u.includes('supabase.co/rest/v1/')) {
      restCalls.push(u.split('/rest/v1/')[1].split('?')[0]);
      if (r.status() >= 400) badResponses.push(`${r.status()} ${u.split('/rest/v1/')[1].slice(0, 80)}`);
    }
  });

  const go = async (hash) => {
    await page.goto(`${BASE}/${hash}`, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 1500));
  };
  const text = () => page.evaluate(() => document.body.innerText);

  await go('#home');
  const home = await text();
  ok('home renders', home.length > 500);
  ok('footer shows current year', home.includes(`© ${new Date().getFullYear()} Culture Network Team`));
  ok('no completed event in "Terdekat" (Townhall 17 Nov is completed)', !/Event & Kegiatan Terdekat/.test(home) || !/Townhall IT APD/.test(home.split('Event & Kegiatan Terdekat')[1]?.slice(0, 1500) || ''));
  ok('visitor never requests private tables', !restCalls.some(t => ['submissions', 'event_rsvps', 'lucky_draws', 'aspirasi', 'admin_profiles'].includes(t)), JSON.stringify([...new Set(restCalls)]));
  ok('no failed Supabase requests (schema probes removed)', badResponses.length === 0, JSON.stringify(badResponses));

  const stored = await page.evaluate(() => Object.keys(localStorage));
  ok('no personal data cached in localStorage', !stored.some(k => /submissions|eventRsvps|luckyDraws|aspirasiList/.test(k)), JSON.stringify(stored));

  await go('#kudos');
  const kudosHtml = await page.content();
  ok('kudos page lists 6 AKHLAK values', ['Amanah', 'Kompeten', 'Harmonis', 'Loyal', 'Adaptif', 'Kolaboratif'].every(v => kudosHtml.includes(`value="${v}"`)));
  ok('old kudos categories gone', !/value="(Inovatif|Integritas|Dedikasi)"/.test(kudosHtml));
  const kudosText = await text();
  ok('existing kudos visible', /Harmonis/.test(kudosText));

  await go('#form');
  const formText = await text();
  ok('form list renders', /Open Recruitment|Townhall/.test(formText));
  ok('closed form card not labelled "Sedang Dibuka"', !formText.includes('✓ Sedang Dibuka'));

  await go('?stats=evt-1794928132198#event-stats');
  const statsText = await text();
  ok('event stats require admin session', /Halaman khusus admin|Memeriksa sesi admin/.test(statsText));

  await go('#admin');
  const adminHtml = await page.content();
  ok('admin login asks for email (Supabase Auth)', /type="email"/.test(adminHtml) && /Email Admin/.test(adminHtml));
  // Wrong credentials must be rejected by Supabase Auth
  await page.type('input[type="email"]', 'bukan-admin@example.com');
  await page.type('input[type="password"]', 'salah-password-123');
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 4000));
  const afterLogin = await text();
  ok('wrong credentials rejected', /Email atau password salah|Invalid|gagal/i.test(afterLogin));

  const relevantErrors = consoleErrors.filter(e => !/favicon|Download the React DevTools/.test(e) && !/400 \(\)|Failed to load resource: the server responded with a status of 400/.test(e));
  ok('no unexpected console errors', relevantErrors.length === 0, JSON.stringify(relevantErrors.slice(0, 5)));
} finally {
  await browser.close();
  killVite();
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
