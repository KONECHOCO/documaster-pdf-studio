// Lettore PDF: pagine in scorrimento continuo (disegnate solo quando servono), zoom con pulsanti e
// con due dita, testo selezionabile, ricerca, indice, modalità notte, ripresa dall'ultima pagina letta.
// Lettura ad alta voce con la voce del dispositivo; le pagine scansionate passano prima dall'OCR.
import { TextLayer } from 'pdfjs-dist';
import { t, getLanguage, LANGUAGES } from '../i18n/index.js';
import { getTool } from '../tools.js';
import { openModal, createDropzone, loadingBlock, showError, escapeHtml, toast, prompt, confirmDialog } from './ui.js';
import { loadPdfJsDoc, getPageText, renderPageToCanvas } from '../utils/pdfHelper.js';
import { createOcrWorker, recognize } from '../utils/ocr.js';
import { speechAvailable, languageSupported, canInstallVoices, openVoiceInstall, speak, stopSpeaking, splitSentences } from '../services/speech.js';

const POS_KEY = 'documaster.reader.pos';
const NIGHT_KEY = 'documaster.reader.night';
const RATE_KEY = 'documaster.reader.rate';
const RATES = [0.75, 1, 1.25, 1.5, 2];
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const MAX_PAGE_CSS_WIDTH = 900;
const GAP = 12;

const svg = (body) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const I = {
  outline: svg('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'),
  search: svg('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
  minus: svg('<line x1="5" y1="12" x2="19" y2="12"/>'),
  plus: svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
  moon: svg('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'),
  speaker: svg('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
  tools: svg('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'),
  play: svg('<polygon points="6 4 20 12 6 20 6 4" fill="currentColor"/>'),
  pause: svg('<rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/>'),
  back: svg('<polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/><line x1="5" y1="19" x2="5" y2="5"/>'),
  fwd: svg('<polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/><line x1="19" y1="5" x2="19" y2="19"/>'),
  up: svg('<polyline points="18 15 12 9 6 15"/>'),
  down: svg('<polyline points="6 9 12 15 18 9"/>'),
  close: svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage non disponibile
  }
}

const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// Per allineare frasi e testo della pagina: solo lettere e cifre
const squash = (s) => fold(s).replace(/[^\p{L}\p{N}]/gu, '');

// Lingua del documento: giapponese dai caratteri, le altre dalle parole più frequenti
const STOPWORDS = {
  it: ['il', 'di', 'che', 'della', 'per', 'non', 'una', 'sono', 'nel', 'gli', 'con', 'del'],
  en: ['the', 'and', 'of', 'to', 'is', 'that', 'for', 'with', 'this', 'are', 'you', 'be'],
  es: ['el', 'de', 'que', 'los', 'las', 'por', 'para', 'una', 'con', 'del', 'es', 'se'],
  fr: ['le', 'les', 'des', 'est', 'que', 'pour', 'une', 'dans', 'qui', 'sur', 'pas', 'du'],
  de: ['der', 'die', 'und', 'das', 'ist', 'nicht', 'mit', 'den', 'ein', 'zu', 'auf', 'sie'],
  pt: ['de', 'que', 'não', 'uma', 'para', 'com', 'os', 'do', 'da', 'em', 'são', 'mais'],
};
function detectLanguage(text, fallback) {
  const sample = text.slice(0, 4000);
  if ((sample.match(/[぀-ヿ一-鿿]/g) || []).length > sample.length * 0.2) return 'ja';
  const words = fold(sample).split(/[^a-zçãõñßäöü]+/).filter(Boolean);
  if (words.length < 15) return fallback;
  let best = fallback;
  let bestScore = 0;
  for (const [lang, list] of Object.entries(STOPWORDS)) {
    const set = new Set(list);
    const score = words.reduce((n, w) => n + (set.has(w) ? 1 : 0), 0);
    if (score > bestScore) [best, bestScore] = [lang, score];
  }
  return bestScore >= 3 ? best : fallback;
}

/**
 * Apre il lettore. options.speak: apre subito la lettura ad alta voce.
 * options.onTools(file): "Strumenti" (unire, firmare, comprimere… il documento aperto).
 */
export function openReaderModal(initialFile = null, { speak: startSpeaking = false, onTools } = {}) {
  const tool = getTool(startSpeaking ? 'readAloud' : 'reader');
  let cleanup = () => {};
  const m = openModal({
    title: t(`tools.${tool.id}.title`),
    icon: tool.icon,
    color: tool.color,
    size: 'xl',
    onClose: () => cleanup(),
  });
  m.overlay.querySelector('.modal-content').classList.add('reader-modal');

  function showPicker() {
    m.body.innerHTML = '';
    m.body.classList.remove('reader-body');
    m.body.appendChild(createDropzone({ accept: 'pdf', onFiles: ([f]) => start(f) }));
  }

  async function start(file) {
    cleanup();
    m.body.innerHTML = '';
    m.body.appendChild(loadingBlock(t('common.loadingDocument')));
    try {
      const pdfJsDoc = await loadPdfJsDoc(file);
      m.setTitle(file.name);
      cleanup = await mountReader(m, file, pdfJsDoc, { startSpeaking, onTools });
    } catch (err) {
      showError(err);
      showPicker();
    }
  }

  if (initialFile) start(initialFile);
  else showPicker();
  return m;
}

async function mountReader(m, file, pdfJsDoc, { startSpeaking, onTools }) {
  const total = pdfJsDoc.numPages;
  const docId = `${file.name}|${file.size}`;
  let zoom = 1;
  let currentPage = 1;
  let night = readJson(NIGHT_KEY, false);
  let destroyed = false;

  // Dimensioni di tutte le pagine (pdf.js le legge senza disegnare nulla)
  const sizes = [];
  const first = (await pdfJsDoc.getPage(1)).getViewport({ scale: 1 });
  for (let n = 1; n <= total; n++) {
    if (total > 400 && n > 1) sizes.push({ w: first.width, h: first.height });
    else {
      const vp = n === 1 ? first : (await pdfJsDoc.getPage(n)).getViewport({ scale: 1 });
      sizes.push({ w: vp.width, h: vp.height });
    }
  }

  m.body.innerHTML = '';
  m.body.classList.add('reader-body');
  const root = document.createElement('div');
  root.className = `reader${night ? ' reader-night' : ''}`;
  root.innerHTML = `
    <div class="reader-toolbar">
      <button class="icon-btn" data-act="outline" aria-label="${escapeHtml(t('reader.outline'))}" title="${escapeHtml(t('reader.outline'))}" hidden>${I.outline}</button>
      <button class="icon-btn" data-act="search" aria-label="${escapeHtml(t('reader.search'))}" title="${escapeHtml(t('reader.search'))}">${I.search}</button>
      <button class="reader-page-btn" data-act="goto" title="${escapeHtml(t('reader.goToPage'))}"></button>
      <span class="reader-spacer"></span>
      <button class="icon-btn" data-act="zoomOut" aria-label="${escapeHtml(t('reader.zoomOut'))}">${I.minus}</button>
      <button class="reader-zoom-btn" data-act="fit" title="${escapeHtml(t('reader.fitWidth'))}"></button>
      <button class="icon-btn" data-act="zoomIn" aria-label="${escapeHtml(t('reader.zoomIn'))}">${I.plus}</button>
      <button class="icon-btn" data-act="night" aria-label="${escapeHtml(t('reader.night'))}" title="${escapeHtml(t('reader.night'))}">${I.moon}</button>
      <button class="icon-btn reader-speak-btn" data-act="speak" aria-label="${escapeHtml(t('reader.readAloud'))}" title="${escapeHtml(t('reader.readAloud'))}">${I.speaker}</button>
      ${onTools ? `<button class="icon-btn" data-act="tools" aria-label="${escapeHtml(t('reader.tools'))}" title="${escapeHtml(t('reader.tools'))}">${I.tools}</button>` : ''}
    </div>
    <div class="reader-searchbar" hidden>
      <input type="search" class="text-input" autocomplete="off" enterkeyhint="search" />
      <span class="reader-search-info"></span>
      <button class="icon-btn" data-act="prevHit" aria-label="${escapeHtml(t('reader.prevResult'))}">${I.up}</button>
      <button class="icon-btn" data-act="nextHit" aria-label="${escapeHtml(t('reader.nextResult'))}">${I.down}</button>
      <button class="icon-btn" data-act="closeSearch" aria-label="${escapeHtml(t('common.close'))}">${I.close}</button>
    </div>
    <div class="reader-main">
      <nav class="reader-outline" hidden></nav>
      <div class="reader-scroller"><div class="reader-pages"></div></div>
    </div>
    <div class="reader-tts" hidden>
      <div class="reader-tts-text"></div>
      <div class="reader-tts-controls">
        <button class="icon-btn" data-act="ttsPrev" aria-label="${escapeHtml(t('reader.prevSentence'))}">${I.back}</button>
        <button class="reader-tts-play" data-act="ttsPlay"></button>
        <button class="icon-btn" data-act="ttsNext" aria-label="${escapeHtml(t('reader.nextSentence'))}">${I.fwd}</button>
        <button class="reader-chip" data-act="ttsRate" title="${escapeHtml(t('reader.speed'))}"></button>
        <select class="select-input reader-tts-lang" aria-label="${escapeHtml(t('reader.voiceLang'))}">
          ${LANGUAGES.map((l) => `<option value="${l.code}">${escapeHtml(l.label)}</option>`).join('')}
        </select>
        <button class="icon-btn" data-act="ttsClose" aria-label="${escapeHtml(t('reader.stopReading'))}">${I.close}</button>
      </div>
    </div>`;
  m.body.appendChild(root);

  const $ = (sel) => root.querySelector(sel);
  const scroller = $('.reader-scroller');
  const pagesEl = $('.reader-pages');
  const pageBtn = $('[data-act="goto"]');
  const zoomBtn = $('[data-act="fit"]');

  // ------------------------------------------------------------ Pagine
  const pages = sizes.map((size, i) => {
    const el = document.createElement('div');
    el.className = 'reader-page';
    el.dataset.page = String(i + 1);
    pagesEl.appendChild(el);
    return { n: i + 1, el, size, scale: 0, renderedScale: 0, canvas: null, textLayer: null, task: null };
  });

  function baseWidth() {
    return Math.max(200, Math.min(scroller.clientWidth - 2 * GAP, MAX_PAGE_CSS_WIDTH));
  }
  function layout() {
    const bw = baseWidth();
    for (const p of pages) {
      p.scale = (bw / p.size.w) * zoom;
      p.el.style.width = `${Math.floor(p.size.w * p.scale)}px`;
      p.el.style.height = `${Math.floor(p.size.h * p.scale)}px`;
      p.el.style.setProperty('--scale-factor', p.scale);
      p.el.style.setProperty('--total-scale-factor', p.scale);
    }
    zoomBtn.textContent = `${Math.round(zoom * 100)}%`;
  }

  // Disegno: una pagina alla volta, prima quelle visibili; le pagine lontane liberano memoria
  const visible = new Set();
  let queueRunning = false;
  async function pump() {
    if (queueRunning) return;
    queueRunning = true;
    try {
      while (!destroyed) {
        const next = [...visible]
          .map((n) => pages[n - 1])
          .filter((p) => p.renderedScale !== p.scale)
          .sort((a, b) => Math.abs(a.n - currentPage) - Math.abs(b.n - currentPage))[0];
        if (!next) break;
        await renderPage(next);
      }
    } finally {
      queueRunning = false;
    }
  }

  async function renderPage(p) {
    const scale = p.scale;
    const page = await pdfJsDoc.getPage(p.n);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // iOS: un canvas oltre ~16 milioni di pixel resta bianco
    const pxScale = Math.min(scale * dpr, Math.sqrt(16_000_000 / (p.size.w * p.size.h)));
    const viewport = page.getViewport({ scale: pxScale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    try {
      p.task = page.render({ canvasContext: ctx, viewport });
      await p.task.promise;
    } catch {
      return; // annullato (zoom o chiusura)
    } finally {
      p.task = null;
    }
    if (destroyed || scale !== p.scale) {
      canvas.width = canvas.height = 0;
      return;
    }
    if (p.canvas) p.canvas.width = p.canvas.height = 0;
    p.el.querySelector('canvas')?.remove();
    p.el.prepend(canvas);
    p.canvas = canvas;
    p.renderedScale = scale;

    p.textLayer?.remove();
    const tl = document.createElement('div');
    tl.className = 'textLayer';
    p.el.appendChild(tl);
    p.textLayer = tl;
    try {
      await new TextLayer({ textContentSource: page.streamTextContent(), container: tl, viewport: page.getViewport({ scale }) }).render();
      markHits(p);
      if (tts.page === p.n) markSpoken();
    } catch {
      // pagina senza testo
    }
  }

  function releasePage(p) {
    p.task?.cancel();
    if (p.canvas) {
      p.canvas.width = p.canvas.height = 0;
      p.canvas.remove();
      p.canvas = null;
    }
    p.textLayer?.remove();
    p.textLayer = null;
    p.renderedScale = 0;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const n = Number(e.target.dataset.page);
        if (e.isIntersecting) visible.add(n);
        else {
          visible.delete(n);
          releasePage(pages[n - 1]);
        }
      }
      pump();
    },
    { root: scroller, rootMargin: '120% 0px' }
  );
  pages.forEach((p) => io.observe(p.el));

  // ------------------------------------------------------------ Pagina corrente e ripresa
  function pageAtScroll() {
    const y = scroller.scrollTop + scroller.clientHeight * 0.35;
    let lo = 0;
    let hi = pages.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (pages[mid].el.offsetTop <= y) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  }
  let saveTimer;
  function updateCurrent() {
    const n = pageAtScroll();
    if (n !== currentPage) currentPage = n;
    pageBtn.textContent = `${currentPage} / ${total}`;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const all = readJson(POS_KEY, {});
      delete all[docId];
      all[docId] = currentPage;
      const keys = Object.keys(all);
      for (const k of keys.slice(0, Math.max(0, keys.length - 60))) delete all[k];
      writeJson(POS_KEY, all);
    }, 400);
  }
  scroller.addEventListener('scroll', updateCurrent, { passive: true });

  function goTo(n, { smooth = false } = {}) {
    const p = pages[Math.max(1, Math.min(total, n)) - 1];
    scroller.scrollTo({ top: p.el.offsetTop - GAP, behavior: smooth ? 'smooth' : 'auto' });
  }

  // ------------------------------------------------------------ Zoom
  function setZoom(next, anchorX = scroller.clientWidth / 2, anchorY = scroller.clientHeight / 2) {
    next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    if (Math.abs(next - zoom) < 0.001) return;
    const ratio = next / zoom;
    const cx = scroller.scrollLeft + anchorX;
    const cy = scroller.scrollTop + anchorY;
    zoom = next;
    pages.forEach((p) => p.task?.cancel());
    layout();
    scroller.scrollLeft = cx * ratio - anchorX;
    scroller.scrollTop = cy * ratio - anchorY;
    pump();
  }

  // Due dita: anteprima immediata con transform, poi nuovo disegno alla risoluzione giusta
  let pinch = null;
  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  scroller.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 2) return;
      const r = scroller.getBoundingClientRect();
      const [a, b] = e.touches;
      pinch = { d0: dist(a, b), x: (a.clientX + b.clientX) / 2 - r.left, y: (a.clientY + b.clientY) / 2 - r.top, ratio: 1 };
      pagesEl.style.transformOrigin = `${scroller.scrollLeft + pinch.x}px ${scroller.scrollTop + pinch.y}px`;
    },
    { passive: true }
  );
  scroller.addEventListener(
    'touchmove',
    (e) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      const [a, b] = e.touches;
      pinch.ratio = Math.max(MIN_ZOOM / zoom, Math.min(MAX_ZOOM / zoom, dist(a, b) / pinch.d0));
      pagesEl.style.transform = `scale(${pinch.ratio})`;
    },
    { passive: false }
  );
  const endPinch = () => {
    if (!pinch) return;
    const { ratio, x, y } = pinch;
    pinch = null;
    pagesEl.style.transform = '';
    setZoom(zoom * ratio, x, y);
  };
  scroller.addEventListener('touchend', (e) => e.touches.length < 2 && endPinch());
  scroller.addEventListener('touchcancel', endPinch);
  // Ctrl + rotellina (e gesto di zoom del trackpad) sul computer
  scroller.addEventListener(
    'wheel',
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const r = scroller.getBoundingClientRect();
      setZoom(zoom * Math.exp(-e.deltaY / 300), e.clientX - r.left, e.clientY - r.top);
    },
    { passive: false }
  );

  let lastWidth = scroller.clientWidth;
  const ro = new ResizeObserver(() => {
    if (Math.abs(scroller.clientWidth - lastWidth) < 2) return;
    lastWidth = scroller.clientWidth;
    const n = currentPage;
    layout();
    goTo(n);
    pump();
  });
  ro.observe(scroller);

  // ------------------------------------------------------------ Testo delle pagine (ricerca e voce)
  const textCache = new Map();
  async function pageText(n) {
    if (!textCache.has(n)) textCache.set(n, await getPageText(pdfJsDoc, n).catch(() => ''));
    return textCache.get(n);
  }

  // ------------------------------------------------------------ Ricerca
  const searchBar = $('.reader-searchbar');
  const searchInput = searchBar.querySelector('input');
  const searchInfo = $('.reader-search-info');
  searchInput.placeholder = t('reader.searchPlaceholder');
  let query = '';
  let hits = []; // pagine con risultati
  let hitIndex = -1;
  let searchToken = 0;
  let scrollToHitOn = 0; // pagina il cui risultato va portato al centro appena il testo è pronto

  function markHits(p) {
    if (!p.textLayer) return;
    const q = fold(query);
    for (const span of p.textLayer.querySelectorAll('span')) {
      const on = q.length > 0 && fold(span.textContent).includes(q);
      span.classList.toggle('reader-hit', on);
      span.classList.toggle('reader-hit-current', on && hits[hitIndex]?.n === p.n);
    }
    if (scrollToHitOn === p.n) {
      const first = p.textLayer.querySelector('.reader-hit-current');
      if (first) {
        scrollToHitOn = 0;
        const r = first.getBoundingClientRect();
        const sr = scroller.getBoundingClientRect();
        scroller.scrollTop += r.top - sr.top - scroller.clientHeight / 3;
      }
    }
  }

  async function runSearch() {
    const token = ++searchToken;
    query = searchInput.value.trim();
    hits = [];
    hitIndex = -1;
    pages.forEach(markHits);
    if (!query) {
      searchInfo.textContent = '';
      return;
    }
    const q = fold(query);
    let count = 0;
    for (let n = 1; n <= total; n++) {
      if (token !== searchToken || destroyed) return;
      if (n % 10 === 1) searchInfo.textContent = t('reader.searching', { n });
      const text = fold(await pageText(n));
      let c = 0;
      for (let i = text.indexOf(q); i >= 0; i = text.indexOf(q, i + q.length)) c++;
      if (c) {
        hits.push({ n, c });
        count += c;
        if (hits.length === 1) {
          hitIndex = hits.findIndex((h) => h.n >= currentPage);
          if (hitIndex < 0) hitIndex = 0;
        }
      }
    }
    if (!hits.length) {
      searchInfo.textContent = t('reader.noResults');
      return;
    }
    hitIndex = Math.max(0, hits.findIndex((h) => h.n >= currentPage));
    searchInfo.textContent = t('reader.results', { count, pages: hits.length });
    showHit();
  }

  function showHit() {
    if (!hits.length) return;
    goTo(hits[hitIndex].n);
    scrollToHitOn = hits[hitIndex].n;
    pages.forEach(markHits);
    searchInfo.textContent = `${hitIndex + 1}/${hits.length} · ${t('common.page')} ${hits[hitIndex].n}`;
  }

  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 350);
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (hits.length && fold(searchInput.value.trim()) === fold(query)) {
      hitIndex = (hitIndex + (e.shiftKey ? hits.length - 1 : 1)) % hits.length;
      showHit();
    } else runSearch();
  });

  // ------------------------------------------------------------ Indice
  const outlineEl = $('.reader-outline');
  const outlineBtn = $('[data-act="outline"]');
  pdfJsDoc
    .getOutline()
    .then(async (outline) => {
      if (!outline?.length || destroyed) return;
      async function destPage(dest) {
        try {
          const explicit = typeof dest === 'string' ? await pdfJsDoc.getDestination(dest) : dest;
          if (!Array.isArray(explicit)) return null;
          const ref = explicit[0];
          return (typeof ref === 'number' ? ref : await pdfJsDoc.getPageIndex(ref)) + 1;
        } catch {
          return null;
        }
      }
      async function build(items, depth) {
        const frag = document.createDocumentFragment();
        for (const item of items) {
          const n = await destPage(item.dest);
          const b = document.createElement('button');
          b.className = 'reader-outline-item';
          b.style.paddingLeft = `${0.75 + depth * 0.9}rem`;
          b.innerHTML = '<span></span><small></small>';
          b.firstChild.textContent = item.title || '—';
          b.lastChild.textContent = n ? String(n) : '';
          if (n) {
            b.addEventListener('click', () => {
              goTo(n);
              if (window.innerWidth < 900) outlineEl.hidden = true;
            });
          } else b.disabled = true;
          frag.appendChild(b);
          if (item.items?.length && depth < 4) frag.appendChild(await build(item.items, depth + 1));
        }
        return frag;
      }
      outlineEl.appendChild(await build(outline, 0));
      outlineBtn.hidden = false;
    })
    .catch(() => {});

  // ------------------------------------------------------------ Lettura ad alta voce
  const ttsBar = $('.reader-tts');
  const ttsText = $('.reader-tts-text');
  const playBtn = $('[data-act="ttsPlay"]');
  const rateBtn = $('[data-act="ttsRate"]');
  const langSel = $('.reader-tts-lang');
  const tts = {
    open: false,
    playing: false,
    token: 0,
    page: 0,
    idx: 0,
    rate: RATES.includes(readJson(RATE_KEY, 1)) ? readJson(RATE_KEY, 1) : 1,
    lang: getLanguage(),
    langChosen: false,
    sentences: new Map(),
    pausedAtPage: 0,
    ocrWorker: null,
    ocrLang: null,
    searchPos: 0,
  };

  function renderTtsControls() {
    playBtn.innerHTML = `${tts.playing ? I.pause : I.play}`;
    playBtn.setAttribute('aria-label', t(tts.playing ? 'reader.pause' : 'reader.play'));
    rateBtn.textContent = `${tts.rate}×`;
    langSel.value = tts.lang;
    root.classList.toggle('reader-speaking', tts.open);
  }

  async function ocrText(n) {
    ttsText.textContent = t('reader.ocrPage', { n });
    if (!tts.ocrWorker || tts.ocrLang !== tts.lang) {
      await tts.ocrWorker?.terminate();
      tts.ocrWorker = await createOcrWorker([tts.lang]);
      tts.ocrLang = tts.lang;
    }
    const { canvas } = await renderPageToCanvas(pdfJsDoc, n, 2.5);
    try {
      return (await recognize(tts.ocrWorker, canvas)).text;
    } finally {
      canvas.width = canvas.height = 0;
    }
  }

  async function sentencesFor(n) {
    const key = `${n}|${tts.lang}`;
    if (!tts.sentences.has(key)) {
      let text = await pageText(n);
      if (squash(text).length < 10) text = await ocrText(n);
      tts.sentences.set(key, splitSentences(text, tts.lang));
    }
    return tts.sentences.get(key);
  }

  // Evidenzia nel livello di testo le parti della frase letta (allineamento solo su lettere e cifre)
  function clearSpoken() {
    root.querySelectorAll('.reader-spoken').forEach((s) => s.classList.remove('reader-spoken'));
  }
  function markSpoken() {
    clearSpoken();
    const p = pages[tts.page - 1];
    const sentence = tts.sentences.get(`${tts.page}|${tts.lang}`)?.[tts.idx];
    if (!p?.textLayer || !sentence) return;
    const spans = [...p.textLayer.querySelectorAll('span')].filter((s) => !s.children.length);
    let all = '';
    const ranges = spans.map((s) => {
      const start = all.length;
      all += squash(s.textContent);
      return [start, all.length];
    });
    const key = squash(sentence);
    if (!key) return;
    let at = all.indexOf(key, tts.idx === 0 ? 0 : tts.searchPos);
    if (at < 0) at = all.indexOf(key);
    if (at < 0) return;
    tts.searchPos = at + key.length;
    const end = at + key.length;
    spans.forEach((s, i) => {
      if (ranges[i][1] > at && ranges[i][0] < end) s.classList.add('reader-spoken');
    });
  }

  function pageInView(n) {
    const el = pages[n - 1].el;
    return el.offsetTop < scroller.scrollTop + scroller.clientHeight && el.offsetTop + el.offsetHeight > scroller.scrollTop;
  }

  async function play() {
    if (!speechAvailable()) {
      toast(t('reader.noSpeech'), 'error', 5000);
      return;
    }
    const token = ++tts.token;
    // Se nel frattempo si è passati a un'altra pagina, si riparte da lì
    if (!tts.page || (tts.pausedAtPage && currentPage !== tts.pausedAtPage)) {
      tts.page = currentPage;
      tts.idx = 0;
    }
    if (!tts.langChosen) {
      tts.lang = detectLanguage(await pageText(tts.page), tts.lang);
      tts.langChosen = true;
      renderTtsControls();
    }
    if (!(await languageSupported(tts.lang))) {
      const lang = LANGUAGES.find((l) => l.code === tts.lang)?.label || tts.lang;
      if (canInstallVoices) {
        const install = await confirmDialog({ title: t('reader.readAloud'), message: t('reader.missingVoice', { lang }), okLabel: t('reader.installVoice') });
        if (install) openVoiceInstall();
      } else toast(t('reader.voiceMaybeMissing', { lang }), 'info', 5000);
      if (token !== tts.token) return;
    }
    tts.playing = true;
    tts.pausedAtPage = 0;
    renderTtsControls();
    try {
      while (token === tts.token && !destroyed) {
        if (tts.page > total) {
          finish();
          return;
        }
        const list = await sentencesFor(tts.page);
        if (token !== tts.token) return;
        if (tts.idx >= list.length) {
          tts.page += 1;
          tts.idx = 0;
          tts.searchPos = 0;
          continue;
        }
        if (!pageInView(tts.page)) goTo(tts.page, { smooth: true });
        ttsText.textContent = list[tts.idx];
        markSpoken();
        await speak(list[tts.idx], { lang: tts.lang, rate: tts.rate });
        if (token !== tts.token) return;
        tts.idx += 1;
      }
    } catch (err) {
      if (token !== tts.token) return;
      console.warn('Lettura ad alta voce', err);
      showError(err);
      pause();
    }
  }

  function finish() {
    tts.playing = false;
    tts.page = 0;
    tts.idx = 0;
    clearSpoken();
    ttsText.textContent = t('reader.finished');
    renderTtsControls();
  }

  function pause() {
    tts.token += 1;
    tts.playing = false;
    tts.pausedAtPage = currentPage;
    stopSpeaking();
    renderTtsControls();
  }

  // Avanti/indietro di una frase, anche oltre il limite della pagina
  async function step(delta) {
    const wasPlaying = tts.playing;
    pause();
    if (!tts.page) tts.page = currentPage;
    let idx = tts.idx + delta;
    let page = tts.page;
    if (idx < 0) {
      while (page > 1) {
        page -= 1;
        const list = await sentencesFor(page);
        if (list.length) {
          idx = list.length - 1;
          break;
        }
      }
      if (idx < 0) idx = 0;
    } else if (idx >= (await sentencesFor(page)).length && page < total) {
      page += 1;
      idx = 0;
    }
    tts.page = page;
    tts.idx = idx;
    tts.searchPos = 0;
    tts.pausedAtPage = page;
    goTo(page);
    currentPage = page;
    const list = await sentencesFor(page);
    ttsText.textContent = list[idx] || '';
    markSpoken();
    if (wasPlaying) play();
  }

  function restartSentence() {
    if (!tts.playing) return;
    pause();
    tts.pausedAtPage = 0;
    play();
  }

  function openTts(autoPlay) {
    tts.open = true;
    ttsBar.hidden = false;
    if (!ttsText.textContent) ttsText.textContent = t('reader.ttsHint');
    renderTtsControls();
    if (autoPlay) play();
  }

  function closeTts() {
    pause();
    tts.open = false;
    tts.page = 0;
    tts.idx = 0;
    ttsBar.hidden = true;
    ttsText.textContent = '';
    clearSpoken();
    renderTtsControls();
  }

  langSel.addEventListener('change', () => {
    tts.lang = langSel.value;
    tts.langChosen = true;
    restartSentence();
  });

  // ------------------------------------------------------------ Pulsanti
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    switch (b.dataset.act) {
      case 'outline':
        outlineEl.hidden = !outlineEl.hidden;
        break;
      case 'search':
        searchBar.hidden = !searchBar.hidden;
        if (!searchBar.hidden) searchInput.focus();
        break;
      case 'closeSearch':
        searchBar.hidden = true;
        searchInput.value = '';
        runSearch();
        break;
      case 'prevHit':
      case 'nextHit':
        if (!hits.length) return;
        hitIndex = (hitIndex + (b.dataset.act === 'nextHit' ? 1 : hits.length - 1)) % hits.length;
        showHit();
        break;
      case 'goto': {
        const v = await prompt({ title: t('reader.goToPage'), message: t('reader.goToPageMsg', { total }), type: 'number', value: String(currentPage) });
        const n = parseInt(v, 10);
        if (n >= 1 && n <= total) goTo(n);
        break;
      }
      case 'zoomIn':
        setZoom(zoom * 1.25);
        break;
      case 'zoomOut':
        setZoom(zoom / 1.25);
        break;
      case 'fit':
        setZoom(1);
        break;
      case 'night':
        night = !night;
        root.classList.toggle('reader-night', night);
        writeJson(NIGHT_KEY, night);
        break;
      case 'speak':
        if (tts.open) closeTts();
        else openTts(true);
        break;
      case 'tools':
        pause();
        onTools?.(file);
        break;
      case 'ttsPlay':
        if (tts.playing) pause();
        else play();
        break;
      case 'ttsPrev':
        step(-1);
        break;
      case 'ttsNext':
        step(1);
        break;
      case 'ttsRate':
        tts.rate = RATES[(RATES.indexOf(tts.rate) + 1) % RATES.length];
        writeJson(RATE_KEY, tts.rate);
        renderTtsControls();
        restartSentence();
        break;
      case 'ttsClose':
        closeTts();
        break;
      default:
    }
  });

  // ------------------------------------------------------------ Avvio
  layout();
  const saved = readJson(POS_KEY, {})[docId];
  if (saved > 1 && saved <= total) {
    goTo(saved);
    toast(t('reader.resumed', { n: saved }));
  }
  updateCurrent();
  renderTtsControls();
  if (startSpeaking) openTts(true);

  return () => {
    destroyed = true;
    tts.token += 1;
    stopSpeaking();
    tts.ocrWorker?.terminate();
    io.disconnect();
    ro.disconnect();
    clearTimeout(saveTimer);
    pages.forEach(releasePage);
    pdfJsDoc.destroy();
  };
}
