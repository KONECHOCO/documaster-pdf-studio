// OCR reale con Tesseract (WebAssembly, eseguito sul dispositivo). Worker e motore sono inclusi
// nell'app; il modello della lingua (2-4 MB) si scarica al primo utilizzo e resta in cache.
// Il documento non lascia mai il dispositivo.
import { createWorker } from 'tesseract.js';
import { PDFDocument, pushGraphicsState, popGraphicsState, setTextRenderingMode, TextRenderingMode } from 'pdf-lib';
import { embedTextFont } from './fonts.js';
import { viewportRectToPdf } from './geometry.js';
import { convertImagesToPdf, loadPdfJsDoc, renderPageToCanvas, readBytes, pdfBlob, UserError } from './pdfHelper.js';

const BASE = import.meta.env.BASE_URL;

export const OCR_LANGS = {
  it: 'ita',
  en: 'eng',
  es: 'spa',
  fr: 'fra',
  de: 'deu',
  pt: 'por',
  ja: 'jpn',
};

/** onStatus({ phase: 'download' | 'recognize', progress: 0..1 }) */
export async function createOcrWorker(langCodes, onStatus) {
  const langs = [...new Set(langCodes.map((c) => OCR_LANGS[c]).filter(Boolean))];
  if (!langs.length) langs.push('eng');
  try {
    return await createWorker(langs.join('+'), 1, {
      workerPath: `${BASE}vendor/tesseract/worker.min.js`,
      corePath: `${BASE}vendor/tesseract/`,
      workerBlobURL: false,
      logger: (m) => {
        if (!onStatus || typeof m.progress !== 'number') return;
        const phase = m.status === 'recognizing text' ? 'recognize' : 'download';
        onStatus({ phase, progress: m.progress });
      },
    });
  } catch (err) {
    console.warn('OCR init', err);
    throw new UserError('errors.ocrDownload');
  }
}

async function recognize(worker, canvas) {
  const { data } = await worker.recognize(canvas, {}, { text: true, blocks: true });
  const words = [];
  for (const block of data.blocks || []) {
    for (const para of block.paragraphs || []) {
      for (const line of para.lines || []) {
        for (const w of line.words || []) {
          if (w.text && w.text.trim() && w.confidence > 20) words.push({ text: w.text.trim(), bbox: w.bbox });
        }
      }
    }
  }
  return { text: (data.text || '').trim(), words };
}

/** Scrive le parole come testo invisibile (selezionabile e ricercabile) sopra l'immagine. */
function drawInvisibleWords(page, font, words, mapBox) {
  if (!words.length) return;
  page.pushOperators(pushGraphicsState(), setTextRenderingMode(TextRenderingMode.Invisible));
  for (const w of words) {
    const r = mapBox(w.bbox);
    const widthAt1 = font.widthOfTextAtSize(w.text, 1);
    if (!widthAt1 || r.width <= 0 || r.height <= 0) continue;
    const size = Math.max(1, Math.min(r.height, r.width / widthAt1));
    page.drawText(w.text, { x: r.x, y: r.y, size, font, rotate: r.rotate });
  }
  page.pushOperators(popGraphicsState());
}

/** Immagini (canvas) → PDF con testo ricercabile. */
export async function ocrCanvasesToPdf(canvases, { langs, pageSize = 'a4', margin = 0, onProgress } = {}) {
  const worker = await createOcrWorker(langs, (s) => s.phase === 'download' && onProgress?.(0, 'download'));
  try {
    const { doc, placements } = await convertImagesToPdf(
      canvases.map((canvas) => ({ canvas })),
      { pageSize, margin }
    );
    const results = [];
    for (let i = 0; i < canvases.length; i++) {
      results.push(await recognize(worker, canvases[i]));
      onProgress?.((i + 1) / canvases.length, 'recognize');
    }
    const font = await embedTextFont(doc, results.map((r) => r.text).join(' '));
    results.forEach((res, i) => {
      const pl = placements[i];
      const s = pl.width / pl.pxWidth;
      drawInvisibleWords(pl.page, font, res.words, (b) => ({
        x: pl.x + b.x0 * s,
        y: pl.y + pl.height - b.y1 * s,
        width: (b.x1 - b.x0) * s,
        height: (b.y1 - b.y0) * s,
        rotate: undefined,
      }));
    });
    return { blob: pdfBlob(await doc.save()), text: results.map((r) => r.text).join('\n\n') };
  } finally {
    await worker.terminate();
  }
}

/**
 * PDF scansionato → PDF ricercabile. Le pagine che contengono già testo restano invariate;
 * l'aspetto delle pagine non cambia (il testo aggiunto è invisibile).
 */
export async function ocrPdf(file, { langs, onProgress } = {}) {
  const bytes = await readBytes(file);
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const pdfJsDoc = await loadPdfJsDoc(bytes);

  const targets = [];
  for (let i = 1; i <= pdfJsDoc.numPages; i++) {
    const page = await pdfJsDoc.getPage(i);
    const content = await page.getTextContent();
    const chars = content.items.reduce((n, it) => n + (it.str ? it.str.trim().length : 0), 0);
    if (chars < 10) targets.push(i);
  }
  if (!targets.length) {
    pdfJsDoc.destroy();
    throw new UserError('errors.alreadySearchable');
  }

  const worker = await createOcrWorker(langs, (s) => s.phase === 'download' && onProgress?.(0, 'download'));
  try {
    const results = [];
    for (let k = 0; k < targets.length; k++) {
      // ~200 dpi: buon compromesso tra precisione e memoria sui telefoni
      const { canvas, viewport } = await renderPageToCanvas(pdfJsDoc, targets[k], 2.8);
      const res = await recognize(worker, canvas);
      results.push({ pageNum: targets[k], viewport, ...res });
      canvas.width = canvas.height = 0;
      onProgress?.((k + 1) / targets.length, 'recognize');
    }
    const font = await embedTextFont(doc, results.map((r) => r.text).join(' '));
    for (const res of results) {
      drawInvisibleWords(doc.getPage(res.pageNum - 1), font, res.words, (b) =>
        viewportRectToPdf(res.viewport, { x: b.x0, y: b.y0, width: b.x1 - b.x0, height: b.y1 - b.y0 })
      );
    }
    return {
      blob: pdfBlob(await doc.save()),
      text: results.map((r) => r.text).join('\n\n'),
      pagesProcessed: targets.length,
    };
  } finally {
    await worker.terminate();
    pdfJsDoc.destroy();
  }
}
