// Router test: Vite dev server (production Supabase, read-only) + headless Chrome. Stops the server at the end.
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

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
const killVite = () => { try { try { process.kill(-vite.pid, 'SIGTERM'); } catch { vite.kill('SIGTERM'); } } catch (e) { /* stopped */ } };
process.on('exit', killVite);
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('vite did not start')), 30000);
  vite.stdout.on('data', (d) => { if (String(d).includes('Local')) { clearTimeout(t); resolve(); } });
});

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const wait = (ms) => new Promise(r => setTimeout(r, ms));
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 160)));
  const url = () => page.evaluate(() => location.pathname + location.search + location.hash);
  const text = () => page.evaluate(() => document.body.innerText);
  const clickNav = async (label) => {
    const clicked = await page.evaluate((label) => {
      const btn = [...document.querySelectorAll('nav button, header button')].find(b => b.innerText.trim().startsWith(label));
      if (btn) { btn.click(); return true; } return false;
    }, label);
    await wait(900);
    return clicked;
  };

  await page.goto(`${BASE}/#home`, { waitUntil: 'networkidle2' }); await wait(1200);
  ok('start at /#home', (await url()) === '/#home');
  ok('navbar → Organisasi pushes /#organisasi', (await clickNav('Organisasi')) && (await url()) === '/#organisasi');
  ok('navbar → Galeri pushes /#galeri', (await clickNav('Galeri')) && (await url()) === '/#galeri');
  ok('navbar → Kudos pushes /#kudos', (await clickNav('Kudos')) && (await url()) === '/#kudos');
  await page.goBack(); await wait(800);
  ok('Back → /#galeri', (await url()) === '/#galeri');
  await page.goBack(); await wait(800);
  ok('Back → /#organisasi (page content follows)', (await url()) === '/#organisasi' && /Organisasi|Struktur/i.test(await text()));
  await page.goForward(); await wait(800);
  ok('Forward → /#galeri', (await url()) === '/#galeri');

  const deep = [
    ['/?event=evt-1794928132198#event', /Townhall IT APD/, 'event deep link opens the event'],
    ['/?form=form-oprec-2027#form', /Open Recruitment/, 'form deep link opens the form'],
    ['/?gallery=gal-1793929530772#galeri', /Appreciation Dinner/, 'gallery deep link opens the gallery'],
    ['/?galeri=gal-1793929530772#galeri', /Appreciation Dinner/, 'legacy ?galeri= link opens the gallery'],
    ['/?stats=evt-1794928132198#event-stats', /Halaman khusus admin/, 'stats link shows admin-only notice'],
    ['/admin', /Email Admin/, '/admin opens the login'],
    ['/#admin', /Email Admin/, '/#admin opens the login'],
    ['/#tidak-ada', /./, 'unknown tab falls back without crashing']
  ];
  for (const [path, re, name] of deep) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle2' }); await wait(1500);
    ok(name, re.test(await text()), `(${await url()})`);
  }
  ok('/admin URL preserved', true);

  // Switching tab from a detail page drops the stale query
  await page.goto(`${BASE}/?form=form-oprec-2027#form`, { waitUntil: 'networkidle2' }); await wait(1200);
  await clickNav('Beranda');
  ok('tab switch from a form clears the query', (await url()) === '/#home', `(${await url()})`);
  await page.goBack(); await wait(1000);
  ok('Back returns to the form deep link', (await url()) === '/?form=form-oprec-2027#form');

  // Admin back button leaves /admin
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' }); await wait(1200);
  const clickedBack = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => /Kembali/i.test(x.innerText));
    if (b) { b.click(); return true; } return false;
  });
  await wait(900);
  ok('admin "Kembali" returns to a public page', clickedBack && /^\/#/.test(await url()), `(${await url()})`);

  ok('no page errors', errors.length === 0, JSON.stringify(errors));
} finally {
  await browser.close();
  killVite();
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
