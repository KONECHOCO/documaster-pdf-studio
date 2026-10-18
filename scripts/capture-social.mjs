// Screenshot del sito pubblicato per i post social (LinkedIn, Facebook, Instagram).
// Uso: node scripts/capture-social.mjs  → store-assets/social/*.png
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const SITE = process.env.SITE || 'https://offlinepdfstudio.com';
const OUT = 'store-assets/social';
await mkdir(OUT, { recursive: true });

// Documento di esempio per mostrare il lettore
async function sample() {
  const d = await PDFDocument.create();
  const f = await d.embedFont(StandardFonts.Helvetica);
  const fb = await d.embedFont(StandardFonts.HelveticaBold);
  const img = await d.embedJpg(await readFile('assets/sample-photo.jpg'));
  for (let p = 1; p <= 3; p++) {
    const page = d.addPage([595.28, 841.89]);
    page.drawText('CONTRATTO DI LOCAZIONE', { x: 60, y: 770, size: 20, font: fb });
    for (let i = 0; i < 9; i++) page.drawText(`${i + 1}. Il conduttore si impegna a pagare il canone mensile entro il giorno ${i + 5}.`, { x: 60, y: 720 - i * 22, size: 10.5, font: f });
    if (p === 1) page.drawImage(img, { x: 60, y: 260, width: 475, height: 250 });
  }
  return Buffer.from(await d.save()).toString('base64');
}
const b64 = await sample();

const browser = await chromium.launch();
async function shot(name, { viewport, scale = 1, mobile = false, path = '/it/', theme = 'dark', action }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, isMobile: mobile, hasTouch: mobile, locale: 'it', colorScheme: theme });
  await ctx.addInitScript((t) => {
    localStorage.setItem('documaster_lang', 'it');
    localStorage.setItem('documaster_theme', t);
  }, theme);
  const page = await ctx.newPage();
  await page.goto(SITE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  // nasconde eventuali banner (consenso, annunci) per un'immagine pulita
  await page.addStyleTag({ content: '.fc-consent-root, ins.adsbygoogle, .ad-slot { display: none !important; }' });
  if (action) await action(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('saved', name);
  await ctx.close();
}

const openWithSample = (tool, after) => async (page) => {
  await page.evaluate(async ([data, t]) => {
    const bin = atob(data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    document.querySelectorAll('.modal-overlay').forEach((e) => e.remove());
    document.body.classList.remove('modal-open');
    window.__documaster.openTool(t, [new File([bytes], 'contratto_di_locazione.pdf', { type: 'application/pdf' })]);
    await new Promise((r) => setTimeout(r, 2500));
  }, [b64, tool]);
  if (after) await after(page);
};

// 1) Home desktop, formato LinkedIn/Facebook (1200x627)
await shot('01-home-desktop-1200x627', { viewport: { width: 1200, height: 627 }, scale: 2 });
// 2) Home con griglia strumenti, più alta (per carosello)
await shot('02-strumenti-desktop-1200x1200', {
  viewport: { width: 1200, height: 1200 },
  scale: 1.5,
  action: (p) => p.evaluate(() => window.scrollTo(0, 330)),
});
// 3) Lettore PDF su desktop
await shot('03-lettore-desktop-1200x627', { viewport: { width: 1200, height: 627 }, scale: 2, action: openWithSample('reader') });
// 4) Telefono: home (formato storia 1080x1920)
await shot('04-home-telefono-1080x1920', { viewport: { width: 360, height: 640 }, scale: 3, mobile: true });
// 5) Telefono: lettura ad alta voce
await shot('05-lettore-telefono-1080x1920', {
  viewport: { width: 360, height: 640 },
  scale: 3,
  mobile: true,
  action: openWithSample('reader', async (p) => {
    await p.evaluate(async () => {
      document.querySelector('[data-act="speak"]')?.click();
      await new Promise((r) => setTimeout(r, 2000));
      const play = document.querySelector('[data-act="ttsPlay"]');
      if (play?.innerHTML.includes('rect')) play.click();
      document.querySelectorAll('.toast').forEach((t) => t.remove());
    });
  }),
});
// 6) Telefono: compressione con risultato
await shot('06-comprimi-telefono-1080x1920', {
  viewport: { width: 360, height: 640 },
  scale: 3,
  mobile: true,
  action: openWithSample('compress', async (p) => {
    await p.evaluate(async () => {
      [...document.querySelectorAll('.modal-footer .btn-success')].pop()?.click();
      for (let i = 0; i < 40 && !document.querySelector('.result-actions'); i++) await new Promise((r) => setTimeout(r, 300));
    });
  }),
});
// 7) Quadrato per Instagram/Facebook (1080x1080)
await shot('07-home-quadrato-1080x1080', { viewport: { width: 540, height: 540 }, scale: 2 });

await browser.close();
