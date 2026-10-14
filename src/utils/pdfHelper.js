// Motore PDF: pdf-lib (modifica), pdf.js (rendering e testo), JSZip (archivi). Tutto in locale.
import {
  PDFDocument,
  PDFName,
  PDFRawStream,
  PDFArray,
  PDFDict,
  PDFNumber,
  PDFRef,
  rgb,
  degrees,
  decodePDFRawStream,
} from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { embedTextFont } from './fonts.js';
import { displaySize, displayToUser, userAngle, viewportRectToPdf } from './geometry.js';
import { encryptPdfBytes, decryptPdfBytes } from './qpdf.js';

const BASE = import.meta.env.BASE_URL;
pdfjsLib.GlobalWorkerOptions.workerSrc = `${BASE}vendor/pdfjs/pdf.worker.min.mjs`;

export const PDF_MIME = 'application/pdf';

/** Errore con chiave di traduzione: l'interfaccia mostra il messaggio nella lingua dell'utente. */
export class UserError extends Error {
  constructor(key, vars) {
    super(key);
    this.key = key;
    this.vars = vars;
  }
}

export async function readBytes(fileOrBlob) {
  return new Uint8Array(await fileOrBlob.arrayBuffer());
}

export function pdfBlob(bytes) {
  return new Blob([bytes], { type: PDF_MIME });
}

export function baseName(name = 'document') {
  return name.replace(/\.[^/.]+$/, '') || 'document';
}

export function isPdfFile(file) {
  return file && (file.type === PDF_MIME || /\.pdf$/i.test(file.name || ''));
}

export async function loadPdfLibDoc(source) {
  const bytes = source instanceof Uint8Array ? source : await readBytes(source);
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err) {
    if (err?.constructor?.name === 'EncryptedPDFError') throw new UserError('errors.encrypted');
    throw new UserError('errors.invalidPdf');
  }
}

export async function loadPdfJsDoc(source, password) {
  // pdf.js trasferisce il buffer al worker: gli passiamo sempre una copia
  const bytes = source instanceof Uint8Array ? source.slice() : await readBytes(source);
  const task = pdfjsLib.getDocument({
    data: bytes,
    password,
    cMapUrl: `${BASE}vendor/pdfjs/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${BASE}vendor/pdfjs/standard_fonts/`,
    isEvalSupported: false,
  });
  try {
    return await task.promise;
  } catch (err) {
    if (err?.name === 'PasswordException') throw new UserError('errors.encrypted');
    console.warn('pdf.js non riesce ad aprire il file', err);
    throw new UserError('errors.invalidPdf');
  }
}

// iOS limita i canvas a ~16,7 milioni di pixel: oltre, il rendering fallisce in silenzio
const MAX_CANVAS_PIXELS = 16_000_000;

/** Disegna una pagina su canvas. Restituisce anche il viewport (serve per convertire le coordinate). */
export async function renderPageToCanvas(pdfJsDoc, pageNum, scale = 1.5) {
  const page = await pdfJsDoc.getPage(pageNum);
  let viewport = page.getViewport({ scale });
  const pixels = viewport.width * viewport.height;
  if (pixels > MAX_CANVAS_PIXELS) {
    viewport = page.getViewport({ scale: scale * Math.sqrt(MAX_CANVAS_PIXELS / pixels) });
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return { canvas, viewport, page, width: canvas.width, height: canvas.height };
}

export function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.9) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas.toBlob'))), type, quality);
  });
}

async function canvasToBytes(canvas, type, quality) {
  return readBytes(await canvasToBlob(canvas, type, quality));
}

export async function generateAllThumbnails(file, scale = 0.4) {
  const pdfJsDoc = await loadPdfJsDoc(file);
  const thumbnails = [];
  for (let i = 1; i <= pdfJsDoc.numPages; i++) {
    const { canvas } = await renderPageToCanvas(pdfJsDoc, i, scale);
    thumbnails.push({ pageIndex: i - 1, pageNum: i, dataUrl: canvas.toDataURL('image/jpeg', 0.75) });
  }
  pdfJsDoc.destroy();
  return { totalPages: thumbnails.length, thumbnails };
}

// ---------------------------------------------------------------- Intervalli di pagine

/** "1-3, 5, 8-" → indici 0-based validi. Errore se l'intervallo è vuoto o fuori dal documento. */
export function parsePageRanges(input, totalPages) {
  const indices = [];
  const text = String(input || '').replace(/\s+/g, '');
  if (!text) throw new UserError('errors.rangeEmpty');
  for (const part of text.split(/[,;]/)) {
    if (!part) continue;
    const m = part.match(/^(\d*)-(\d*)$/);
    let start;
    let end;
    if (m) {
      start = m[1] ? parseInt(m[1], 10) : 1;
      end = m[2] ? parseInt(m[2], 10) : totalPages;
    } else if (/^\d+$/.test(part)) {
      start = end = parseInt(part, 10);
    } else {
      throw new UserError('errors.rangeInvalid', { value: part });
    }
    if (start < 1 || end > totalPages || start > end) {
      throw new UserError('errors.rangeOutOfBounds', { value: part, total: totalPages });
    }
    for (let i = start; i <= end; i++) indices.push(i - 1);
  }
  if (!indices.length) throw new UserError('errors.rangeEmpty');
  return indices;
}

// ---------------------------------------------------------------- Organizzazione

export async function mergePdfs(files) {
  const merged = await PDFDocument.create();
  for (const file of files) {
    const donor = await loadPdfLibDoc(file);
    const pages = await merged.copyPages(donor, donor.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  return pdfBlob(await merged.save());
}

async function extractPages(sourceDoc, indices) {
  const out = await PDFDocument.create();
  const pages = await out.copyPages(sourceDoc, indices);
  pages.forEach((p) => out.addPage(p));
  return out.save();
}

/** mode: 'range' (un file con le pagine scelte) | 'each' (un file per pagina, in ZIP) | 'chunks' (ogni N pagine). */
export async function splitPdf(file, { mode = 'range', range = '', chunkSize = 1 } = {}) {
  const src = await loadPdfLibDoc(file);
  const total = src.getPageCount();
  const name = baseName(file.name);

  if (mode === 'range') {
    const indices = parsePageRanges(range, total);
    return { blob: pdfBlob(await extractPages(src, indices)), filename: `${name}_pages.pdf` };
  }

  const size = mode === 'each' ? 1 : Math.max(1, parseInt(chunkSize, 10) || 1);
  const zip = new JSZip();
  for (let start = 0; start < total; start += size) {
    const indices = [];
    for (let i = start; i < Math.min(total, start + size); i++) indices.push(i);
    const label = indices.length === 1 ? `${start + 1}` : `${start + 1}-${indices[indices.length - 1] + 1}`;
    zip.file(`${name}_${label}.pdf`, await extractPages(src, indices));
  }
  return { blob: await zip.generateAsync({ type: 'blob' }), filename: `${name}_split.zip` };
}

/** pageSpecs: [{ originalIndex, rotationDelta, blank? }] nell'ordine finale. */
export async function reorganizePdf(file, pageSpecs) {
  const src = await loadPdfLibDoc(file);
  const out = await PDFDocument.create();
  for (const spec of pageSpecs) {
    if (spec.blank) {
      out.addPage(spec.size || [595.28, 841.89]);
      continue;
    }
    const [page] = await out.copyPages(src, [spec.originalIndex]);
    if (spec.rotationDelta) {
      page.setRotation(degrees((page.getRotation().angle + spec.rotationDelta + 360) % 360));
    }
    out.addPage(page);
  }
  return pdfBlob(await out.save());
}

export async function rotatePdf(file, angle = 90, range = '') {
  const doc = await loadPdfLibDoc(file);
  const total = doc.getPageCount();
  const targets = range ? parsePageRanges(range, total) : doc.getPageIndices();
  for (const idx of targets) {
    const page = doc.getPage(idx);
    page.setRotation(degrees((page.getRotation().angle + angle + 360) % 360));
  }
  return pdfBlob(await doc.save());
}

// ---------------------------------------------------------------- Timbri di testo

function hexToRgb(hex = '#000000') {
  const h = hex.replace('#', '');
  return rgb(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255);
}

/** Scrive testo nella posizione visualizzata (dx, dy = punto di partenza, angolo rispetto alla vista). */
function drawDisplayText(page, text, { dx, dy, size, font, color, opacity = 1, angle = 0 }) {
  const p = displayToUser(page, dx, dy);
  page.drawText(text, { x: p.x, y: p.y, size, font, color, opacity, rotate: userAngle(page, angle) });
}

/**
 * Filigrana di testo. layout: 'center' | 'tile'. Rispetta la rotazione delle pagine.
 */
export async function addWatermarkToPdf(file, text, options = {}) {
  const { opacity = 0.25, angle = 45, size = 48, color = '#808080', layout = 'center' } = options;
  if (!text || !text.trim()) throw new UserError('errors.watermarkEmpty');
  const doc = await loadPdfLibDoc(file);
  const font = await embedTextFont(doc, text, { bold: true });
  const fill = hexToRgb(color);
  const rad = (angle * Math.PI) / 180;
  const tw = font.widthOfTextAtSize(text, size);
  const th = font.heightAtSize(size, { descender: false });

  for (const page of doc.getPages()) {
    const { width, height } = displaySize(page);
    const centers = [];
    if (layout === 'tile') {
      const stepX = Math.max(tw * Math.abs(Math.cos(rad)) + size * 2, 160);
      const stepY = Math.max(tw * Math.abs(Math.sin(rad)) + size * 2.5, 140);
      for (let y = stepY / 2; y < height + stepY / 2; y += stepY) {
        for (let x = stepX / 2; x < width + stepX / 2; x += stepX) centers.push([x, y]);
      }
    } else {
      centers.push([width / 2, height / 2]);
    }
    for (const [cx, cy] of centers) {
      // Il testo ruota attorno al punto di partenza: lo spostiamo perché il centro cada su (cx, cy)
      const dx = cx - ((tw / 2) * Math.cos(rad) - (th / 2) * Math.sin(rad));
      const dy = cy - ((tw / 2) * Math.sin(rad) + (th / 2) * Math.cos(rad));
      drawDisplayText(page, text, { dx, dy, size, font, color: fill, opacity, angle });
    }
  }
  return pdfBlob(await doc.save());
}

export async function addPageNumbersToPdf(file, options = {}) {
  const { format = '{n}', position = 'bottom-center', fontSize = 11, margin = 28, start = 1, range = '' } = options;
  const doc = await loadPdfLibDoc(file);
  const pages = doc.getPages();
  const targets = range ? parsePageRanges(range, pages.length) : doc.getPageIndices();
  const totalNumbered = targets.length + start - 1;
  const sample = format.replace('{n}', '0123456789').replace('{total}', '');
  const font = await embedTextFont(doc, sample);
  const color = rgb(0.2, 0.2, 0.2);

  targets.forEach((idx, i) => {
    const page = pages[idx];
    const text = format.replace('{n}', String(start + i)).replace('{total}', String(totalNumbered));
    const { width, height } = displaySize(page);
    const tw = font.widthOfTextAtSize(text, fontSize);
    const [v, h] = position.split('-');
    const dx = h === 'left' ? margin : h === 'right' ? width - tw - margin : (width - tw) / 2;
    const dy = v === 'top' ? height - margin - fontSize : margin;
    drawDisplayText(page, text, { dx, dy, size: fontSize, font, color });
  });
  return pdfBlob(await doc.save());
}

// ---------------------------------------------------------------- Conversioni

/** dpi: 72 | 150 | 300. Una pagina → immagine singola; più pagine → ZIP. */
export async function convertPdfToImages(file, { format = 'jpg', dpi = 150, range = '' } = {}, onProgress) {
  const pdfJsDoc = await loadPdfJsDoc(file);
  const total = pdfJsDoc.numPages;
  const indices = range ? parsePageRanges(range, total) : [...Array(total).keys()];
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';
  const name = baseName(file.name);
  const zip = new JSZip();
  let single = null;

  for (let k = 0; k < indices.length; k++) {
    const pageNum = indices[k] + 1;
    const { canvas } = await renderPageToCanvas(pdfJsDoc, pageNum, dpi / 72);
    const blob = await canvasToBlob(canvas, mime, 0.92);
    const fileName = `${name}_${pageNum}.${ext}`;
    if (indices.length === 1) single = { blob, filename: fileName };
    else zip.file(fileName, blob);
    onProgress?.((k + 1) / indices.length);
  }
  pdfJsDoc.destroy();
  if (single) return single;
  return { blob: await zip.generateAsync({ type: 'blob' }), filename: `${name}_images.zip` };
}

const PAGE_SIZES = { a4: [595.28, 841.89], letter: [612, 792] };

/** Carica un'immagine applicando l'orientamento EXIF (le foto dei telefoni altrimenti escono ruotate). */
export async function loadImageBitmap(blob) {
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/** Ridisegna un'immagine (max `maxPx` sul lato lungo) e la restituisce come canvas. */
export async function imageToCanvas(blob, maxPx = 3000) {
  const bmp = await loadImageBitmap(blob);
  const w = bmp.width;
  const h = bmp.height;
  const s = Math.min(1, maxPx / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * s);
  canvas.height = Math.round(h * s);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  return canvas;
}

/**
 * Crea un PDF da immagini. items: [{ canvas } | { blob }]. pageSize: 'a4' | 'letter' | 'fit'.
 * Restituisce anche la posizione di ogni immagine (serve all'OCR per sovrapporre il testo).
 */
export async function convertImagesToPdf(items, { pageSize = 'a4', margin = 20, quality = 0.88 } = {}) {
  const doc = await PDFDocument.create();
  const placements = [];
  for (const item of items) {
    const canvas = item.canvas || (await imageToCanvas(item.blob));
    const img = await doc.embedJpg(await canvasToBytes(canvas, 'image/jpeg', quality));
    const iw = canvas.width;
    const ih = canvas.height;
    let pw;
    let ph;
    if (pageSize === 'fit') {
      // Pagina con le proporzioni della foto e larghezza A4
      pw = PAGE_SIZES.a4[0];
      ph = (pw * ih) / iw;
      pw += margin * 2;
      ph += margin * 2;
    } else {
      [pw, ph] = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
      if (iw > ih) [pw, ph] = [ph, pw];
    }
    const page = doc.addPage([pw, ph]);
    const s = Math.min((pw - margin * 2) / iw, (ph - margin * 2) / ih);
    const w = iw * s;
    const h = ih * s;
    const x = (pw - w) / 2;
    const y = (ph - h) / 2;
    page.drawImage(img, { x, y, width: w, height: h });
    placements.push({ page, x, y, width: w, height: h, pxWidth: iw, pxHeight: ih });
  }
  return { doc, placements };
}

export async function imagesToPdfBlob(items, options) {
  const { doc } = await convertImagesToPdf(items, options);
  return pdfBlob(await doc.save());
}

// ---------------------------------------------------------------- Testo

/** Righe di testo di una pagina ricostruite dagli elementi di pdf.js. */
function linesFromTextContent(content) {
  const lines = [];
  let current = { text: '', y: null, h: 0 };
  for (const item of content.items) {
    if (!('str' in item)) continue;
    const y = item.transform[5];
    const h = Math.abs(item.transform[3]) || item.height || 10;
    if (current.y !== null && Math.abs(y - current.y) > h * 0.6 && current.text) {
      lines.push(current);
      current = { text: '', y: null, h: 0 };
    }
    if (current.y === null) {
      current.y = y;
      current.h = h;
    }
    current.text += item.str;
    if (item.hasEOL) {
      lines.push(current);
      current = { text: '', y: null, h: 0 };
    }
  }
  if (current.text) lines.push(current);
  return lines.map((l) => ({ ...l, text: l.text.replace(/\s+/g, ' ').trim() })).filter((l) => l.text);
}

/** Paragrafi: una riga nuova inizia un paragrafo quando lo spazio verticale è più ampio del normale. */
function paragraphsFromLines(lines) {
  const paragraphs = [];
  let current = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prev = lines[i - 1];
    if (prev && Math.abs(prev.y - line.y) > Math.max(prev.h, line.h) * 1.7 && current.length) {
      paragraphs.push(current.join(' '));
      current = [];
    }
    current.push(line.text);
  }
  if (current.length) paragraphs.push(current.join(' '));
  return paragraphs;
}

/** Testo di una pagina per la lettura: righe unite, parole spezzate dal trattino ricomposte. */
export async function getPageText(pdfJsDoc, pageNum) {
  const page = await pdfJsDoc.getPage(pageNum);
  const lines = linesFromTextContent(await page.getTextContent());
  return lines
    .map((l) => l.text)
    .join('\n')
    .replace(/(\p{L})-\n(\p{Ll})/gu, '$1$2')
    .replace(/\n/g, ' ')
    .trim();
}

export async function extractPdfStructure(file) {
  const pdfJsDoc = await loadPdfJsDoc(file);
  const pages = [];
  for (let i = 1; i <= pdfJsDoc.numPages; i++) {
    const page = await pdfJsDoc.getPage(i);
    const lines = linesFromTextContent(await page.getTextContent());
    pages.push({ pageNum: i, lines, paragraphs: paragraphsFromLines(lines) });
  }
  pdfJsDoc.destroy();
  return pages;
}

export async function extractTextFromPdf(file, pageLabel = 'Page') {
  const pages = await extractPdfStructure(file);
  const fullText = pages
    .map((p) => `--- ${pageLabel} ${p.pageNum} ---\n${p.lines.map((l) => l.text).join('\n')}`)
    .join('\n\n');
  const words = pages.reduce((n, p) => n + p.lines.reduce((m, l) => m + l.text.split(/\s+/).filter(Boolean).length, 0), 0);
  const emptyPages = pages.filter((p) => !p.lines.length).length;
  return { fullText, words, numPages: pages.length, emptyPages };
}

function xmlEscape(s) {
  return s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
}

/** PDF → Word (.docx): testo e paragrafi modificabili, un'interruzione di pagina per pagina. */
export async function convertPdfToDocx(file) {
  const pages = await extractPdfStructure(file);
  const totalText = pages.reduce((n, p) => n + p.paragraphs.length, 0);
  if (!totalText) throw new UserError('errors.noTextLayer');

  const body = pages
    .map((p, i) => {
      const paras = p.paragraphs.map((t) => `<w:p><w:r><w:t xml:space="preserve">${xmlEscape(t)}</w:t></w:r></w:p>`).join('');
      const brk = i < pages.length - 1 ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : '';
      return paras + brk;
    })
    .join('');

  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
  );
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
  );
  zip.file(
    'word/_rels/document.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>'
  );
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`
  );
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  return { blob, filename: `${baseName(file.name)}.docx` };
}

// ---------------------------------------------------------------- Moduli e metadati

/** Appiattisce i campi dei moduli (diventano parte fissa della pagina). */
export async function flattenPdf(file) {
  const doc = await loadPdfLibDoc(file);
  const form = doc.getForm();
  const fields = form.getFields();
  if (!fields.length) throw new UserError('errors.noFormFields');
  const values = fields.map((f) => (typeof f.getText === 'function' ? f.getText() || '' : '')).join(' ');
  const font = await embedTextFont(doc, values);
  form.updateFieldAppearances(font);
  form.flatten({ updateFieldAppearances: false });
  return pdfBlob(await doc.save());
}

export async function readMetadata(file) {
  const doc = await loadPdfLibDoc(file);
  return {
    title: doc.getTitle() || '',
    author: doc.getAuthor() || '',
    subject: doc.getSubject() || '',
    keywords: doc.getKeywords() || '',
    creator: doc.getCreator() || '',
    producer: doc.getProducer() || '',
  };
}

export async function writeMetadata(file, meta, { removeAll = false } = {}) {
  const doc = await loadPdfLibDoc(file);
  if (removeAll) {
    doc.catalog.delete(PDFName.of('Metadata'));
    const info = doc.context.lookup(doc.context.trailerInfo.Info);
    if (info instanceof PDFDict) for (const key of info.keys()) info.delete(key);
    doc.setProducer('');
    doc.setCreator('');
  } else {
    // XMP vecchio in contrasto con i nuovi valori: lo togliamo, i lettori useranno il dizionario Info
    doc.catalog.delete(PDFName.of('Metadata'));
    doc.setTitle(meta.title || '');
    doc.setAuthor(meta.author || '');
    doc.setSubject(meta.subject || '');
    doc.setKeywords((meta.keywords || '').split(/[,;]/).map((k) => k.trim()).filter(Boolean));
    doc.setCreator(meta.creator || '');
  }
  return pdfBlob(await doc.save());
}

// ---------------------------------------------------------------- Sicurezza

export async function protectPdf(file, password, permissions) {
  if (!password) throw new UserError('errors.passwordEmpty');
  return pdfBlob(await encryptPdfBytes(await readBytes(file), password, permissions));
}

export async function unlockPdf(file, password) {
  const out = await decryptPdfBytes(await readBytes(file), password || '');
  if (!out) throw new UserError('errors.wrongPassword');
  return pdfBlob(out);
}

// ---------------------------------------------------------------- Compressione reale

const COMPRESSION = {
  low: { quality: 0.82, maxPx: 2400 },
  recommended: { quality: 0.68, maxPx: 1600 },
  extreme: { quality: 0.45, maxPx: 1100 },
};

function filterNames(dict) {
  const f = dict.lookup(PDFName.of('Filter'));
  if (!f) return [];
  if (f instanceof PDFName) return [f.asString()];
  if (f instanceof PDFArray) return f.asArray().map((x) => (x instanceof PDFName ? x.asString() : ''));
  return [];
}

function colorComponents(doc, dict) {
  const cs = dict.lookup(PDFName.of('ColorSpace'));
  if (cs instanceof PDFName) {
    const n = cs.asString();
    if (n === '/DeviceRGB' || n === '/CalRGB') return 3;
    if (n === '/DeviceGray' || n === '/CalGray') return 1;
    return 0;
  }
  if (cs instanceof PDFArray && cs.size() >= 2) {
    const kind = cs.lookup(0);
    if (kind instanceof PDFName && kind.asString() === '/ICCBased') {
      const icc = cs.lookup(1);
      const n = icc?.dict?.lookup(PDFName.of('N'));
      return n instanceof PDFNumber ? n.asNumber() : 0;
    }
  }
  return 0;
}

function num(dict, key) {
  const v = dict.lookup(PDFName.of(key));
  return v instanceof PDFNumber ? v.asNumber() : 0;
}

async function decodeImageStream(doc, stream) {
  const dict = stream.dict;
  const filters = filterNames(dict);
  const comps = colorComponents(doc, dict);
  const width = num(dict, 'Width');
  const height = num(dict, 'Height');
  if (!width || !height || (comps !== 1 && comps !== 3)) return null;
  if (dict.has(PDFName.of('Decode')) || dict.has(PDFName.of('ImageMask'))) return null;

  if (filters.length === 1 && filters[0] === '/DCTDecode') {
    return { source: await loadImageBitmap(new Blob([stream.contents], { type: 'image/jpeg' })), width, height };
  }
  if (filters.length === 1 && filters[0] === '/FlateDecode' && num(dict, 'BitsPerComponent') === 8) {
    if (dict.has(PDFName.of('DecodeParms')) || width * height > MAX_CANVAS_PIXELS) return null;
    const raw = decodePDFRawStream(stream).decode();
    if (raw.length < width * height * comps) return null;
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let i = 0, j = 0; i < width * height; i++, j += comps) {
      const o = i * 4;
      if (comps === 1) {
        rgba[o] = rgba[o + 1] = rgba[o + 2] = raw[j];
      } else {
        rgba[o] = raw[j];
        rgba[o + 1] = raw[j + 1];
        rgba[o + 2] = raw[j + 2];
      }
      rgba[o + 3] = 255;
    }
    return { source: new ImageData(rgba, width, height), width, height };
  }
  return null;
}

/**
 * Ricomprime le immagini del PDF (la parte più pesante quasi sempre) e ottimizza la struttura.
 * Le immagini vengono sostituite solo se il risultato è davvero più piccolo; il testo resta vettoriale.
 */
export async function compressPdf(file, level = 'recommended', onProgress) {
  const { quality, maxPx } = COMPRESSION[level] || COMPRESSION.recommended;
  const originalBytes = await readBytes(file);
  const doc = await loadPdfLibDoc(originalBytes);
  const ctx = doc.context;

  // Le maschere di trasparenza (SMask) non vanno trasformate in JPEG
  const smaskRefs = new Set();
  const images = [];
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const subtype = obj.dict.lookup(PDFName.of('Subtype'));
    if (!(subtype instanceof PDFName) || subtype.asString() !== '/Image') continue;
    const smask = obj.dict.get(PDFName.of('SMask'));
    if (smask instanceof PDFRef) smaskRefs.add(smask.toString());
    images.push([ref, obj]);
  }

  let replaced = 0;
  for (let k = 0; k < images.length; k++) {
    const [ref, stream] = images[k];
    onProgress?.((k + 1) / Math.max(1, images.length));
    if (smaskRefs.has(ref.toString())) continue;
    let decoded;
    try {
      decoded = await decodeImageStream(doc, stream);
    } catch {
      decoded = null;
    }
    if (!decoded) continue;

    const s = Math.min(1, maxPx / Math.max(decoded.width, decoded.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(decoded.width * s));
    canvas.height = Math.max(1, Math.round(decoded.height * s));
    const c2d = canvas.getContext('2d');
    if (decoded.source instanceof ImageData) {
      if (s === 1) {
        c2d.putImageData(decoded.source, 0, 0);
      } else {
        const tmp = document.createElement('canvas');
        tmp.width = decoded.width;
        tmp.height = decoded.height;
        tmp.getContext('2d').putImageData(decoded.source, 0, 0);
        c2d.drawImage(tmp, 0, 0, canvas.width, canvas.height);
      }
    } else {
      c2d.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
      decoded.source.close?.();
    }
    const jpeg = await canvasToBytes(canvas, 'image/jpeg', quality);
    if (jpeg.length >= stream.contents.length * 0.9) continue;

    const newDict = ctx.obj({
      Type: 'XObject',
      Subtype: 'Image',
      Width: canvas.width,
      Height: canvas.height,
      ColorSpace: 'DeviceRGB',
      BitsPerComponent: 8,
      Filter: 'DCTDecode',
      Length: jpeg.length,
    });
    const smask = stream.dict.get(PDFName.of('SMask'));
    if (smask) newDict.set(PDFName.of('SMask'), smask);
    ctx.assign(ref, PDFRawStream.of(newDict, jpeg));
    replaced++;
  }

  const out = await doc.save({ useObjectStreams: true });
  const better = out.length < originalBytes.length;
  return {
    blob: pdfBlob(better ? out : originalBytes),
    originalSize: originalBytes.length,
    compressedSize: better ? out.length : originalBytes.length,
    imagesTotal: images.length,
    imagesReplaced: replaced,
    alreadyOptimized: !better,
  };
}

// ---------------------------------------------------------------- Oscuramento (redazione vera)

/**
 * Oscura aree rettangolari. Le pagine coinvolte vengono trasformate in immagine con i riquadri neri
 * già "bruciati": il testo sottostante viene eliminato davvero, non solo coperto.
 * areas: { [pageNum]: [{ fx, fy, fw, fh }] } in frazioni della pagina visualizzata.
 */
export async function redactPdf(file, areas, dpi = 200, onProgress) {
  const bytes = await readBytes(file);
  const doc = await loadPdfLibDoc(bytes);
  const pdfJsDoc = await loadPdfJsDoc(bytes);
  const pageNums = Object.keys(areas).map(Number).filter((n) => areas[n]?.length);
  if (!pageNums.length) throw new UserError('errors.noRedactions');

  for (let k = 0; k < pageNums.length; k++) {
    const pageNum = pageNums[k];
    const { canvas } = await renderPageToCanvas(pdfJsDoc, pageNum, dpi / 72);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    for (const a of areas[pageNum]) {
      ctx.fillRect(a.fx * canvas.width, a.fy * canvas.height, a.fw * canvas.width, a.fh * canvas.height);
    }
    const img = await doc.embedJpg(await canvasToBytes(canvas, 'image/jpeg', 0.9));
    const oldPage = doc.getPage(pageNum - 1);
    const { width, height } = displaySize(oldPage);
    const newPage = doc.insertPage(pageNum - 1, [width, height]);
    newPage.drawImage(img, { x: 0, y: 0, width, height });
    doc.removePage(pageNum);
    onProgress?.((k + 1) / pageNums.length);
  }
  pdfJsDoc.destroy();
  // pdf-lib salverebbe anche gli oggetti delle pagine rimosse (testo recuperabile): copiamo solo
  // le pagine raggiungibili in un documento nuovo
  const clean = await PDFDocument.create();
  const pages = await clean.copyPages(doc, doc.getPageIndices());
  pages.forEach((p) => clean.addPage(p));
  return pdfBlob(await clean.save());
}

// ---------------------------------------------------------------- Disegni sopra le pagine

/**
 * Applica un'immagine trasparente (es. annotazioni a mano libera) che copre tutta la pagina visualizzata.
 * `viewport` è il viewport pdf.js della pagina a scala 1.
 */
export async function drawOverlayOnPage(doc, pageIndex, viewport, pngBytes) {
  const page = doc.getPage(pageIndex);
  const img = await doc.embedPng(pngBytes);
  const r = viewportRectToPdf(viewport, { x: 0, y: 0, width: viewport.width, height: viewport.height });
  page.drawImage(img, r);
}

// ---------------------------------------------------------------- Analisi reale del documento

const PAPER = [
  ['A4', 595.28, 841.89],
  ['Letter', 612, 792],
  ['Legal', 612, 1008],
  ['A3', 841.89, 1190.55],
  ['A5', 419.53, 595.28],
];

function paperName(w, h) {
  const a = Math.min(w, h);
  const b = Math.max(w, h);
  for (const [name, pw, ph] of PAPER) if (Math.abs(a - pw) < 4 && Math.abs(b - ph) < 4) return name;
  return null;
}

function streamKind(stream) {
  const d = stream.dict;
  const type = d.lookup(PDFName.of('Type'));
  const subtype = d.lookup(PDFName.of('Subtype'));
  const t = type instanceof PDFName ? type.asString() : '';
  const s = subtype instanceof PDFName ? subtype.asString() : '';
  if (s === '/Image') return 'images';
  if (d.has(PDFName.of('Length1')) || d.has(PDFName.of('Length2')) || ['/Type1C', '/CIDFontType0C', '/OpenType'].includes(s)) return 'fonts';
  if (t === '/Metadata' || t === '/EmbeddedFile' || t === '/XRef' || t === '/ObjStm') return 'other';
  return 'content';
}

export async function analyzePdfDocument(file) {
  const bytes = await readBytes(file);
  const pdfJsDoc = await loadPdfJsDoc(bytes);
  const numPages = pdfJsDoc.numPages;
  const { info } = await pdfJsDoc.getMetadata().catch(() => ({ info: {} }));

  const charsPerPage = [];
  const formats = {};
  let portrait = 0;
  let landscape = 0;
  let annotations = 0;
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfJsDoc.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    if (vp.width > vp.height) landscape++;
    else portrait++;
    const fmt = paperName(vp.width, vp.height) || `${Math.round((vp.width / 72) * 25.4)}×${Math.round((vp.height / 72) * 25.4)} mm`;
    formats[fmt] = (formats[fmt] || 0) + 1;
    const content = await page.getTextContent();
    charsPerPage.push(content.items.reduce((n, it) => n + (it.str ? it.str.replace(/\s/g, '').length : 0), 0));
    annotations += (await page.getAnnotations()).filter((a) => a.subtype !== 'Widget' && a.subtype !== 'Link').length;
  }
  pdfJsDoc.destroy();

  // Composizione del peso del file: byte reali di immagini, font e contenuti
  const composition = { images: 0, fonts: 0, content: 0, other: 0 };
  let imageCount = 0;
  let fontCount = 0;
  let formFields = 0;
  try {
    const doc = await PDFDocument.load(bytes, { updateMetadata: false });
    for (const [, obj] of doc.context.enumerateIndirectObjects()) {
      if (obj instanceof PDFRawStream) {
        const kind = streamKind(obj);
        composition[kind] += obj.contents.length;
        if (kind === 'images') imageCount++;
      } else if (obj instanceof PDFDict) {
        const type = obj.lookup(PDFName.of('Type'));
        if (type instanceof PDFName && type.asString() === '/Font') fontCount++;
      }
    }
    formFields = doc.getForm().getFields().length;
  } catch {
    // struttura non leggibile da pdf-lib: mostriamo solo i dati di pdf.js
  }
  const counted = composition.images + composition.fonts + composition.content + composition.other;
  composition.other += Math.max(0, bytes.length - counted);

  const scannedPages = charsPerPage.filter((c) => c < 10).length;
  return {
    fileName: file.name,
    fileSize: bytes.length,
    numPages,
    pdfVersion: info?.PDFFormatVersion || '',
    title: info?.Title || '',
    author: info?.Author || '',
    producer: info?.Producer || info?.Creator || '',
    portrait,
    landscape,
    formats,
    charsPerPage,
    totalChars: charsPerPage.reduce((a, b) => a + b, 0),
    scannedPages,
    composition,
    imageCount,
    fontCount,
    formFields,
    annotations,
    isEncrypted: !!file.wasEncrypted,
  };
}
