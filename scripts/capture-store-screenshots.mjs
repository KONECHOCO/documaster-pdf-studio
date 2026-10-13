// Screenshot per gli store dall'app reale (strumenti veri su documenti di esempio), nella lingua scelta.
// Prerequisito: build di produzione servita (`npm run build && npx vite preview --port 4179`).
// Uso: node scripts/capture-store-screenshots.mjs [iphone|ipad|android] [it|en|fr|es|de|pt|ja]
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const device = ['ipad', 'android'].includes(process.argv[2]) ? process.argv[2] : 'iphone';
const lang = process.argv[3] || 'it';
const BASE = process.env.BASE_URL || 'http://localhost:4179/';
const SIZES = {
  iphone: { viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, suffix: '1320x2868' },
  ipad: { viewport: { width: 1032, height: 1376 }, deviceScaleFactor: 2, suffix: 'ipad-2064x2752' },
  android: { viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, suffix: 'android-1080x1920' },
};
// Documento di esempio nella lingua dello screenshot
const DOC = {
  it: { title: 'CONTRATTO DI LOCAZIONE', line: 'Il conduttore si impegna a pagare il canone mensile entro il giorno', sign: 'Giulia Bianchi' },
  en: { title: 'RENTAL AGREEMENT', line: 'The tenant agrees to pay the monthly rent no later than day', sign: 'Emma Johnson' },
  fr: { title: 'CONTRAT DE LOCATION', line: 'Le locataire s’engage à payer le loyer mensuel au plus tard le', sign: 'Camille Martin' },
  es: { title: 'CONTRATO DE ALQUILER', line: 'El inquilino se compromete a pagar el alquiler mensual antes del día', sign: 'Lucía García' },
  de: { title: 'MIETVERTRAG', line: 'Der Mieter verpflichtet sich, die Monatsmiete bis spätestens zum Tag', sign: 'Anna Schneider' },
  pt: { title: 'CONTRATO DE ALUGUEL', line: 'O inquilino compromete-se a pagar o aluguel mensal até o dia', sign: 'Ana Souza' },
  ja: { title: 'RENTAL AGREEMENT', line: 'The tenant agrees to pay the monthly rent no later than day', sign: 'Sato Yui' },
};
const size = SIZES[device];
const OUT = `store-assets/screenshots/${lang}`;
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: size.viewport,
  deviceScaleFactor: size.deviceScaleFactor,
  isMobile: device !== 'ipad',
  hasTouch: true,
  locale: lang,
  colorScheme: 'dark',
});
await context.addInitScript((l) => {
  localStorage.setItem('documaster_lang', l);
  localStorage.setItem('documaster_theme', 'dark');
  localStorage.setItem('documaster.storeshot', 'true');
}, lang);
const page = await context.newPage();
await page.goto(`${BASE}?storeshot`);
await page.waitForTimeout(1500);

const shot = async (name) => {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${name}-${size.suffix}.png` });
  console.log('saved', lang, device, name);
};
const closeModals = () =>
  page.evaluate(() => {
    document.querySelectorAll('.modal-overlay').forEach((e) => e.remove());
    document.body.classList.remove('modal-open');
  });

// Documento di esempio (generato qui in Node): 3 pagine con testo, una foto pesante e una riga per la firma
async function makeSample(doc) {
  const d = await PDFDocument.create();
  d.registerFontkit(fontkit);
  const f = await d.embedFont(await readFile('public/fonts/DejaVuSans.ttf'), { subset: true });
  const fb = await d.embedFont(await readFile('public/fonts/DejaVuSans-Bold.ttf'), { subset: true });
  const img = await d.embedJpg(await readFile('assets/sample-photo.jpg'));
  for (let p = 1; p <= 3; p++) {
    const page = d.addPage([595.28, 841.89]);
    page.drawText(doc.title, { x: 60, y: 770, size: 20, font: fb });
    for (let i = 0; i < 9; i++) page.drawText(`${i + 1}. ${doc.line} ${i + 5}.`, { x: 60, y: 720 - i * 22, size: 10.5, font: f });
    if (p === 1) page.drawImage(img, { x: 60, y: 260, width: 475, height: 250 });
    page.drawLine({ start: { x: 330, y: 150 }, end: { x: 530, y: 150 }, thickness: 0.8 });
  }
  return Buffer.from(await d.save()).toString('base64');
}
const sampleB64 = await makeSample(DOC[lang]);
await page.evaluate(([b64, title]) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  window.__sample = new File([bytes], `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });
}, [sampleB64, DOC[lang].title]);

// 1) Home
await shot('01-home');

// 2) Scanner: foto simulata di un foglio storto sul tavolo, bordi rilevati
await page.evaluate(async (doc) => {
  window.__documaster.openTool('scanner');
  await new Promise((r) => setTimeout(r, 700));
  const c = document.createElement('canvas');
  c.width = 1500;
  c.height = 2000;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 1500, 2000);
  g.addColorStop(0, '#6b4f36');
  g.addColorStop(1, '#3e2c1d');
  x.fillStyle = g;
  x.fillRect(0, 0, 1500, 2000);
  x.save();
  x.beginPath();
  x.moveTo(250, 230);
  x.lineTo(1250, 300);
  x.lineTo(1330, 1760);
  x.lineTo(170, 1700);
  x.closePath();
  x.fillStyle = '#efeee9';
  x.fill();
  x.clip();
  const sh = x.createLinearGradient(200, 0, 1300, 0);
  sh.addColorStop(0, 'rgba(0,0,0,0.22)');
  sh.addColorStop(0.6, 'rgba(0,0,0,0)');
  x.fillStyle = sh;
  x.fillRect(0, 0, 1500, 2000);
  x.translate(330, 420);
  x.rotate(0.065);
  x.fillStyle = '#222';
  x.font = 'bold 54px Arial';
  x.fillText(doc.title, 0, 0);
  x.font = '30px Arial';
  for (let i = 1; i < 22; i++) x.fillText(`${i}. ${doc.line.slice(0, 44)}…`, 0, 30 + i * 56);
  x.restore();
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
  const input = [...document.querySelectorAll('.modal-overlay input[type=file]')].find((i) => !i.hasAttribute('capture'));
  const dt = new DataTransfer();
  dt.items.add(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
  input.files = dt.files;
  input.dispatchEvent(new Event('change'));
  await new Promise((r) => setTimeout(r, 1500));
}, DOC[lang]);
await shot('02-scanner');

// 3) Firma posizionata sul documento
await closeModals();
await page.evaluate(async (doc) => {
  await document.fonts.load('600 80px "Dancing Script"');
  const c = document.createElement('canvas');
  c.width = 900;
  c.height = 220;
  const x = c.getContext('2d');
  x.font = '600 120px "Dancing Script", cursive';
  x.fillStyle = '#1d3a8a';
  x.textBaseline = 'middle';
  x.fillText(doc.sign, 20, 110);
  localStorage.setItem('documaster.signatures', JSON.stringify([c.toDataURL('image/png')]));
  window.__documaster.openTool('sign', [window.__sample]);
  await new Promise((r) => setTimeout(r, 1500));
  document.querySelector('.saved-sig')?.click();
  await new Promise((r) => setTimeout(r, 2000));
}, DOC[lang]);
await shot('03-firma');

// 4) Compressione: risultato con risparmio reale
await closeModals();
await page.evaluate(async () => {
  window.__documaster.openTool('compress', [window.__sample]);
  await new Promise((r) => setTimeout(r, 1500));
  [...document.querySelectorAll('.modal-footer .btn-success')].pop().click();
  for (let i = 0; i < 40 && !document.querySelector('.result-actions'); i++) await new Promise((r) => setTimeout(r, 300));
});
await shot('04-comprimi');

// 5) Analisi con grafici
await closeModals();
await page.evaluate(async () => {
  window.__documaster.openTool('analytics', [window.__sample]);
  await new Promise((r) => setTimeout(r, 2500));
});
await shot('05-analisi');

// 6) DocuMaster Pro
await closeModals();
await page.evaluate(async () => {
  window.__documaster.openProModal();
});
await shot('06-pro');

await browser.close();
