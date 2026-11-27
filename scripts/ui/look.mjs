import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, ''); // decode: path boleh berisi spasi
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const require = createRequire(REPO + '/');
const puppeteer = require('puppeteer-core');
const [out, ...pages] = process.argv.slice(2);
const vite = spawn('npx', ['vite', '--port', '5179', '--strictPort'], { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
await new Promise(r => vite.stdout.on('data', d => { if (String(d).includes('Local')) r(); }));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const errors = [];
try {
  for (const spec of pages) {
    const [name, path, theme, width] = spec.split('|');
    const p = await browser.newPage();
    p.on('pageerror', e => errors.push(`${name}: ${e.message}`));
    await p.setViewport({ width: Number(width || 1440), height: 900, deviceScaleFactor: 1 });
    await p.evaluateOnNewDocument((t) => localStorage.setItem('cnt_theme_choice', t), theme);
    await p.goto(`http://localhost:5179${path}`, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 1500));
    await p.screenshot({ path: `${out}/${name}.png`, fullPage: true });
    await p.close();
  }
} finally { await browser.close(); try { process.kill(-vite.pid, 'SIGTERM'); } catch { vite.kill('SIGTERM'); } }
console.log('page errors:', errors.length ? errors : 'none');
