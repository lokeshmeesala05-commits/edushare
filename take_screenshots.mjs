import puppeteer from 'puppeteer-core';
import path from 'path';
import os from 'os';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const BASE = 'http://localhost:5173';
const OUT = path.join(os.homedir(), 'Downloads');

const pages = [
  { name: '01_home',       url: '/',        wait: 3000, desc: 'Home / Landing Page' },
  { name: '02_browse',     url: '/notes',   wait: 3000, desc: 'Browse / Digital Library' },
  { name: '03_login',      url: '/login',   wait: 2000, desc: 'Login Page' },
  { name: '04_register',   url: '/register',wait: 2000, desc: 'Register Page' },
  { name: '05_upload',     url: '/upload',  wait: 2000, desc: 'Upload Note Page' },
  { name: '06_dashboard',  url: '/dashboard',wait: 2000, desc: 'Student Dashboard' },
];

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 860 });

  for (const p of pages) {
    try {
      console.log(`Capturing: ${p.desc}...`);
      await page.goto(BASE + p.url, { waitUntil: 'networkidle0', timeout: 15000 });
      await new Promise(r => setTimeout(r, p.wait));
      const file = path.join(OUT, `edushare_${p.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`  ✓ Saved: ${file}`);
    } catch (e) {
      console.log(`  ✗ Failed ${p.desc}: ${e.message}`);
    }
  }

  await browser.close();
  console.log('\nAll screenshots saved to your Downloads folder!');
})();
