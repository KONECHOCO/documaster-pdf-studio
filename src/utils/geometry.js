// Conversioni tra le coordinate "come si vede la pagina" e lo spazio utente PDF.
// Gestiscono pagine ruotate (/Rotate 90, 180, 270) e CropBox con origine diversa da zero,
// due casi frequenti nei PDF scansionati che prima producevano firme e testi fuori posto.
import { degrees } from 'pdf-lib';

function normRotation(page) {
  return (((page.getRotation().angle || 0) % 360) + 360) % 360;
}

/** Dimensioni della pagina come appare a schermo (in punti PDF). */
export function displaySize(page) {
  const box = page.getCropBox();
  const r = normRotation(page);
  return r === 90 || r === 270 ? { width: box.height, height: box.width } : { width: box.width, height: box.height };
}

/** Punto visualizzato (origine in basso a sinistra, y verso l'alto, in punti) → spazio utente PDF. */
export function displayToUser(page, dx, dy) {
  const box = page.getCropBox();
  const W = box.width;
  const H = box.height;
  const r = normRotation(page);
  let u;
  let v;
  if (r === 90) {
    u = W - dy;
    v = dx;
  } else if (r === 180) {
    u = W - dx;
    v = H - dy;
  } else if (r === 270) {
    u = dy;
    v = H - dx;
  } else {
    u = dx;
    v = dy;
  }
  return { x: box.x + u, y: box.y + v, rotate: degrees(r) };
}

/** Angolo da usare in pdf-lib perché un elemento appaia inclinato di `angle` gradi sulla pagina visualizzata. */
export function userAngle(page, angle = 0) {
  return degrees(angle + normRotation(page));
}

/**
 * Rettangolo in coordinate del viewport pdf.js (pixel, origine in alto a sinistra) → parametri
 * per drawImage/drawRectangle di pdf-lib. Funziona a qualsiasi scala e rotazione.
 */
export function viewportRectToPdf(viewport, { x, y, width, height }) {
  const bl = viewport.convertToPdfPoint(x, y + height);
  const br = viewport.convertToPdfPoint(x + width, y + height);
  const tl = viewport.convertToPdfPoint(x, y);
  return {
    x: bl[0],
    y: bl[1],
    width: Math.hypot(br[0] - bl[0], br[1] - bl[1]),
    height: Math.hypot(tl[0] - bl[0], tl[1] - bl[1]),
    rotate: degrees((Math.atan2(br[1] - bl[1], br[0] - bl[0]) * 180) / Math.PI),
  };
}

/** Punto del viewport pdf.js → punto PDF con l'angolo per scrivere testo orizzontale rispetto alla vista. */
export function viewportPointToPdf(viewport, x, y) {
  const p = viewport.convertToPdfPoint(x, y);
  const q = viewport.convertToPdfPoint(x + 10, y);
  return { x: p[0], y: p[1], rotate: degrees((Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI) };
}
