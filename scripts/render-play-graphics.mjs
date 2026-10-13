// Grafiche Google Play: icona 512x512 e feature graphic 1024x500.
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const svg = await readFile('assets/icon.svg', 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
await page.setContent(`<html><body style="margin:0">${svg.replace('width="1024" height="1024"', 'width="512" height="512"')}</body></html>`);
await page.screenshot({ path: 'store-assets/play/icon-512.png' });

await page.setViewportSize({ width: 1024, height: 500 });
await page.setContent(`<html><head><style>
  body{margin:0;width:1024px;height:500px;font-family:'Segoe UI',Roboto,sans-serif;color:#fff;overflow:hidden;
    background:radial-gradient(circle at 80% 30%,rgba(236,72,153,.45),transparent 55%),linear-gradient(135deg,#090d16 0%,#1e1b4b 60%,#312e81 100%);display:flex;align-items:center;gap:56px;padding:0 70px;box-sizing:border-box}
  .ic{width:250px;height:250px;border-radius:56px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.45);flex-shrink:0}
  h1{font-size:62px;margin:0 0 12px;font-weight:800;letter-spacing:-1px}
  p{font-size:28px;margin:0 0 22px;color:#c7d2fe}
  .chips{display:flex;flex-wrap:wrap;gap:10px}
  .chip{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);padding:8px 16px;border-radius:999px;font-size:21px;font-weight:600}
</style></head><body>
  <div class="ic">${svg.replace('width="1024" height="1024"', 'width="250" height="250"')}</div>
  <div><h1>DocuMaster</h1><p>PDF Scanner · OCR · Sign · Compress</p>
  <div class="chips"><span class="chip">🔒 100% on-device</span><span class="chip">22 tools</span><span class="chip">7 languages</span></div></div>
</body></html>`);
await page.screenshot({ path: 'store-assets/play/feature-1024x500.png' });
await browser.close();
console.log('play graphics rendered');
