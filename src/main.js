// Avvio dell'app: tema, interfaccia, strumenti, file ricevuti dalle altre app, monetizzazione.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';
import './styles/theme.css';
import './styles/app.css';
import './styles/components.css';

import { t } from './i18n/index.js';
import { renderHeader } from './components/Header.js';
import { renderToolGrid } from './components/ToolGrid.js';
import { openScannerModal } from './components/ScannerModal.js';
import { openAnalyticsModal } from './components/AnalyticsModal.js';
import { openEditorModal } from './components/EditorModal.js';
import { openSignatureModal } from './components/SignatureModal.js';
import { openOrganizeModal } from './components/OrganizeModal.js';
import { openGenericToolModal } from './components/GenericToolModal.js';
import { openFillFormModal } from './components/FillFormModal.js';
import { openRedactModal } from './components/RedactModal.js';
import { openProModal } from './components/ProModal.js';
import { openReaderModal } from './components/ReaderModal.js';
import { openModal, setContinueHandler, setViewHandler, closeTopModal, preparePdf, showError, escapeHtml } from './components/ui.js';
import { TOOLS, PDF_TOOLS } from './tools.js';
import { listenForIncomingFiles, listenForBackButton } from './platform/files.js';
import { initMonetization, trackAdAction, subscribeMonetization, getMonetization, showPrivacyOptions } from './services/monetization.js';
import { isPdfFile } from './utils/pdfHelper.js';

const app = document.getElementById('app');
app.innerHTML = `
  <header id="app-header"></header>
  <main id="app-main"></main>
  <div id="ad-diagnostics"></div>`;
const headerEl = document.getElementById('app-header');
const mainEl = document.getElementById('app-main');

// Tema: quello salvato, altrimenti quello del sistema
function initialTheme() {
  try {
    const saved = localStorage.getItem('documaster_theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // storage non disponibile
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
document.documentElement.setAttribute('data-theme', initialTheme());

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem('documaster_theme', next);
  } catch {
    // storage non disponibile
  }
  renderAll();
}

/** Apre uno strumento, eventualmente con file già pronti (decifrati se protetti). */
export function openTool(toolId, files = []) {
  trackAdAction();
  const file = files[0] || null;
  switch (toolId) {
    case 'scanner':
      return openScannerModal();
    case 'analytics':
      return openAnalyticsModal(file, (action, f) => openTool(action, [f]));
    case 'edit':
      return openEditorModal(file);
    case 'sign':
      return openSignatureModal(file);
    case 'fillForm':
      return openFillFormModal(file);
    case 'organize':
      return openOrganizeModal(file);
    case 'redact':
      return openRedactModal(file);
    case 'reader':
    case 'readAloud':
      return openReaderModal(file, { speak: toolId === 'readAloud', onTools: (f) => chooseToolFor(f, undefined, { fromReader: true }) });
    default:
      return openGenericToolModal(toolId, files);
  }
}

/** Scelta dello strumento per un PDF arrivato da fuori (trascinato, "Apri con…", risultato precedente). */
const READER_TOOLS = ['reader', 'readAloud'];

function chooseToolFor(file, title, { fromReader = false } = {}) {
  const m = openModal({ title: title || t('chooser.title'), subtitle: file.name, size: 'md' });
  const grid = document.createElement('div');
  grid.className = 'chooser-grid';
  grid.innerHTML = TOOLS.filter((tool) => PDF_TOOLS.includes(tool.id) && !(fromReader && READER_TOOLS.includes(tool.id)))
    .map(
      (tool) => `<button class="chooser-item" data-id="${tool.id}"><span class="card-icon card-icon-sm" style="background:${tool.color}">${tool.icon}</span><span>${escapeHtml(t(`tools.${tool.id}.title`))}</span></button>`
    )
    .join('');
  grid.querySelectorAll('.chooser-item').forEach((b) =>
    b.addEventListener('click', () => {
      m.close();
      openTool(b.dataset.id, [file]);
    })
  );
  m.body.appendChild(grid);
}

async function receiveFile(file) {
  try {
    if (!isPdfFile(file)) return;
    // Un PDF aperto da un'altra app si legge subito; da lì "Strumenti" per lavorarci
    openTool('reader', [await preparePdf(file)]);
  } catch (err) {
    showError(err);
  }
}

setContinueHandler((file) => chooseToolFor(file, t('chooser.continueTitle')));
setViewHandler((file) => openReaderModal(file, { onTools: (f) => chooseToolFor(f, undefined, { fromReader: true }) }));

function renderAll() {
  const { native, isPro, privacyOptionsRequired } = getMonetization();
  renderHeader(headerEl, {
    onLanguageChange: (lang) => {
      // Sulle pagine del sito per lingua si passa alla pagina equivalente (indirizzi indicizzati da Google)
      const { pageLang, slug } = document.documentElement.dataset;
      if (pageLang && lang && lang !== pageLang) {
        location.href = `/${lang}/${slug ? `${slug}/` : ''}`;
        return;
      }
      renderAll();
    },
    onThemeToggle: toggleTheme,
    onOpenPro: openProModal,
    onHome: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
  });
  renderToolGrid(mainEl, {
    onSelectTool: (id) => openTool(id),
    onOpenPro: openProModal,
    showPro: native && !isPro,
    showPrivacyOptions: native && privacyOptionsRequired,
    onPrivacyOptions: showPrivacyOptions,
  });
  // Le pagine del sito hanno già un titolo specifico per la ricerca: non va sovrascritto
  if (!document.documentElement.dataset.pageLang) document.title = `DocuMaster PDF Studio — ${t('home.metaTitle')}`;
}
renderAll();

// Banner AdMob: spazio riservato in fondo; pannello diagnostico con gli annunci di test
let lastPro = getMonetization().isPro;
let lastPrivacy = getMonetization().privacyOptionsRequired;
subscribeMonetization((s) => {
  document.documentElement.style.setProperty('--banner-height', `${s.isPro ? 0 : s.bannerHeight}px`);
  const diagEl = document.getElementById('ad-diagnostics');
  if (s.testAds && s.native) {
    diagEl.innerHTML = `<details class="ad-diag"><summary>ADS DEBUG · ready=${s.adsReady} pro=${s.isPro}</summary><div>${s.diag.map((l) => `<div>${escapeHtml(l)}</div>`).join('')}</div></details>`;
  } else diagEl.innerHTML = '';
  if (s.isPro !== lastPro || s.privacyOptionsRequired !== lastPrivacy) {
    lastPro = s.isPro;
    lastPrivacy = s.privacyOptionsRequired;
    renderAll();
  }
});

// PDF trascinato in qualsiasi punto della finestra (desktop)
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (file && !document.body.classList.contains('modal-open')) receiveFile(file);
});

// Pagine del sito dedicate a uno strumento (/it/merge-pdf/…): lo strumento si apre subito
const pageTool = document.documentElement.dataset.tool;
if (pageTool && TOOLS.some((tool) => tool.id === pageTool)) openTool(pageTool);

// Aggancio per gli script di screenshot degli store (scripts/capture-store-screenshots.mjs)
window.__documaster = { openTool, openProModal };

listenForIncomingFiles(receiveFile);
listenForBackButton(closeTopModal);
initMonetization();
