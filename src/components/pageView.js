// Visualizzatore di una pagina alla volta, adattato alla larghezza dello schermo.
// Gli strumenti lavorano in coordinate frazionarie (0..1 della pagina visualizzata): così
// annotazioni e firme restano al loro posto con qualsiasi zoom, rotazione o dimensione di schermo.
import { t } from '../i18n/index.js';
import { escapeHtml, createDropzone, loadingBlock, showError } from './ui.js';
import { loadPdfJsDoc } from '../utils/pdfHelper.js';

/**
 * Nella finestra mostra l'area di caricamento (se non c'è già un file), poi apre il PDF con pdf.js
 * e chiama onReady(file, pdfJsDoc).
 */
export function loadPdfInto(modal, initialFile, onReady) {
  async function start(file) {
    modal.body.innerHTML = '';
    modal.body.appendChild(loadingBlock(t('common.loadingDocument')));
    try {
      const pdfJsDoc = await loadPdfJsDoc(file);
      modal.body.innerHTML = '';
      await onReady(file, pdfJsDoc);
    } catch (err) {
      showError(err);
      showPicker();
    }
  }
  function showPicker() {
    modal.body.innerHTML = '';
    modal.body.appendChild(createDropzone({ accept: 'pdf', onFiles: ([f]) => start(f) }));
  }
  if (initialFile) start(initialFile);
  else showPicker();
}

export function createPageView(container, pdfJsDoc, { onPageRendered } = {}) {
  const total = pdfJsDoc.numPages;
  let pageNum = 1;
  let renderToken = 0;
  const viewports = new Map();

  const root = document.createElement('div');
  root.className = 'page-view';
  root.innerHTML = `
    <div class="page-nav">
      <button class="icon-btn" data-nav="prev" aria-label="${escapeHtml(t('common.prevPage'))}">‹</button>
      <span class="page-nav-label"></span>
      <button class="icon-btn" data-nav="next" aria-label="${escapeHtml(t('common.nextPage'))}">›</button>
    </div>
    <div class="page-stage">
      <div class="page-wrap">
        <canvas class="page-canvas"></canvas>
        <div class="page-overlay"></div>
      </div>
    </div>`;
  container.appendChild(root);

  const stage = root.querySelector('.page-stage');
  const wrap = root.querySelector('.page-wrap');
  const canvas = root.querySelector('.page-canvas');
  const overlay = root.querySelector('.page-overlay');
  const label = root.querySelector('.page-nav-label');
  const prev = root.querySelector('[data-nav="prev"]');
  const next = root.querySelector('[data-nav="next"]');
  if (total === 1) root.querySelector('.page-nav').hidden = true;

  async function getViewport1(n) {
    if (!viewports.has(n)) {
      const page = await pdfJsDoc.getPage(n);
      viewports.set(n, page.getViewport({ scale: 1 }));
    }
    return viewports.get(n);
  }

  async function render() {
    const token = ++renderToken;
    label.textContent = t('common.pageOf', { n: pageNum, total });
    prev.disabled = pageNum <= 1;
    next.disabled = pageNum >= total;
    const page = await pdfJsDoc.getPage(pageNum);
    const vp1 = await getViewport1(pageNum);
    const available = Math.max(240, Math.min(stage.clientWidth - 16, 900));
    const cssScale = available / vp1.width;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const viewport = page.getViewport({ scale: cssScale * dpr });
    const off = document.createElement('canvas');
    off.width = Math.floor(viewport.width);
    off.height = Math.floor(viewport.height);
    const octx = off.getContext('2d');
    octx.fillStyle = '#fff';
    octx.fillRect(0, 0, off.width, off.height);
    await page.render({ canvasContext: octx, viewport }).promise;
    if (token !== renderToken) return;
    canvas.width = off.width;
    canvas.height = off.height;
    canvas.getContext('2d').drawImage(off, 0, 0);
    const cssW = vp1.width * cssScale;
    const cssH = vp1.height * cssScale;
    wrap.style.width = `${cssW}px`;
    wrap.style.height = `${cssH}px`;
    onPageRendered?.(api);
  }

  let resizeTimer;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 150);
  });
  ro.observe(stage);

  prev.addEventListener('click', () => api.goTo(pageNum - 1));
  next.addEventListener('click', () => api.goTo(pageNum + 1));

  const api = {
    root,
    wrap,
    overlay,
    get pageNum() {
      return pageNum;
    },
    total,
    get width() {
      return wrap.clientWidth;
    },
    get height() {
      return wrap.clientHeight;
    },
    getViewport1,
    goTo(n) {
      if (n < 1 || n > total || n === pageNum) return;
      pageNum = n;
      render();
    },
    /** Posizione del puntatore come frazione della pagina (0..1). */
    toFraction(e) {
      const r = wrap.getBoundingClientRect();
      return {
        fx: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
        fy: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
      };
    },
    render,
    destroy() {
      ro.disconnect();
      root.remove();
    },
  };
  render();
  return api;
}

/**
 * Trascinamento con mouse, dito o penna. onMove riceve lo spostamento in pixel dall'inizio.
 */
export function makeDraggable(handle, { onStart, onMove, onEnd } = {}) {
  handle.style.touchAction = 'none';
  handle.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    handle.setPointerCapture(e.pointerId);
    onStart?.(e);
    const move = (ev) => onMove?.(ev.clientX - sx, ev.clientY - sy, ev);
    const up = (ev) => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
      onEnd?.(ev);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  });
}
