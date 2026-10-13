// Mattoni comuni dell'interfaccia: finestre, area di caricamento, richieste, risultati, errori.
import confetti from 'canvas-confetti';
import { t, formatBytes } from '../i18n/index.js';
import { saveFile, openFile, isNative } from '../platform/files.js';
import { UserError, isPdfFile, readBytes } from '../utils/pdfHelper.js';
import { looksEncrypted, decryptPdfBytes } from '../utils/qpdf.js';
import { trackAdAction, getMonetization } from '../services/monetization.js';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const svg = (body, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  close: svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  upload: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>', 28),
  file: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>', 18),
  check: svg('<polyline points="20 6 9 17 4 12"/>', 30),
  share: svg('<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>', 18),
  download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>', 18),
  eye: svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', 18),
  next: svg('<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>', 18),
  lock: svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', 22),
  up: svg('<polyline points="18 15 12 9 6 15"/>', 16),
  down: svg('<polyline points="6 9 12 15 18 9"/>', 16),
  trash: svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>', 16),
  rotate: svg('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><polyline points="21 3 21 8 16 8"/>', 16),
  copy: svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>', 16),
  undo: svg('<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>', 16),
  camera: svg('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>', 18),
  image: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>', 18),
  crop: svg('<path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/>', 16),
  plus: svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', 16),
  crown: svg('<path d="M2 18h20l-2-11-5 4-3-7-3 7-5-4z"/>', 16),
};

// ---------------------------------------------------------------- Finestre

const modalStack = [];

export function closeTopModal() {
  const top = modalStack[modalStack.length - 1];
  if (!top) return false;
  top.requestClose();
  return true;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTopModal();
});

/**
 * Apre una finestra. size: 'sm' | 'md' | 'lg' | 'xl'. Su telefono occupa tutto lo schermo.
 * `confirmClose` (opzionale) viene chiamata prima di chiudere: se restituisce false la finestra resta.
 */
export function openModal({ title, subtitle = '', icon = '', color = 'var(--primary)', size = 'md', onClose, confirmClose } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content modal-${size}" role="dialog" aria-modal="true">
      <div class="modal-header">
        <div class="modal-title-group">
          ${icon ? `<div class="modal-title-icon" style="background:${color};">${icon}</div>` : ''}
          <div class="modal-titles">
            <h3 class="modal-title"></h3>
            ${subtitle ? '<p class="modal-subtitle"></p>' : ''}
          </div>
        </div>
        <button class="close-modal-btn" aria-label="${escapeHtml(t('common.close'))}">${ICONS.close}</button>
      </div>
      <div class="modal-body"></div>
      <div class="modal-footer"></div>
    </div>`;
  overlay.querySelector('.modal-title').textContent = title || '';
  if (subtitle) overlay.querySelector('.modal-subtitle').textContent = subtitle;
  document.body.appendChild(overlay);
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => overlay.classList.add('active'));

  let closed = false;
  const api = {
    overlay,
    body: overlay.querySelector('.modal-body'),
    footer: overlay.querySelector('.modal-footer'),
    close() {
      if (closed) return;
      closed = true;
      const i = modalStack.indexOf(api);
      if (i >= 0) modalStack.splice(i, 1);
      if (!modalStack.length) document.body.classList.remove('modal-open');
      overlay.classList.remove('active');
      onClose?.();
      setTimeout(() => overlay.remove(), 250);
    },
    async requestClose() {
      if (confirmClose && !(await confirmClose())) return;
      api.close();
    },
    setTitle(text) {
      overlay.querySelector('.modal-title').textContent = text;
    },
  };
  overlay.querySelector('.close-modal-btn').addEventListener('click', () => api.requestClose());
  modalStack.push(api);
  return api;
}

export function button(label, { variant = 'secondary', icon = '', id = '', disabled = false } = {}) {
  const b = document.createElement('button');
  b.className = `btn btn-${variant}`;
  if (id) b.id = id;
  b.disabled = disabled;
  b.innerHTML = `${icon}<span>${escapeHtml(label)}</span>`;
  return b;
}

export function setButtonBusy(btn, busy, label) {
  btn.disabled = busy;
  if (label !== undefined) btn.querySelector('span').textContent = label;
  btn.classList.toggle('is-busy', busy);
}

// ---------------------------------------------------------------- Messaggi

export function toast(message, kind = 'info', ms = 3200) {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.textContent = message;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, ms);
}

export class Cancelled extends Error {}

export function errorMessage(err) {
  if (err instanceof UserError) return t(err.key, err.vars);
  return t('errors.generic');
}

export function showError(err) {
  if (err instanceof Cancelled) return;
  if (!(err instanceof UserError)) console.error(err);
  toast(errorMessage(err), 'error', 5000);
}

/** Piccola finestra con campo di testo. Restituisce il valore o null se annullata. */
export function prompt({ title, message = '', placeholder = '', value = '', type = 'text', okLabel, error = '' }) {
  return new Promise((resolve) => {
    let result = null;
    const m = openModal({ title, size: 'sm', onClose: () => resolve(result) });
    m.body.innerHTML = `
      ${message ? `<p class="muted-text"></p>` : ''}
      <input class="text-input" autocomplete="off" />
      ${error ? `<p class="form-error"></p>` : ''}`;
    if (message) m.body.querySelector('.muted-text').textContent = message;
    if (error) m.body.querySelector('.form-error').textContent = error;
    const input = m.body.querySelector('input');
    input.type = type;
    input.placeholder = placeholder;
    input.value = value;
    const cancel = button(t('common.cancel'));
    const ok = button(okLabel || t('common.ok'), { variant: 'primary' });
    m.footer.append(cancel, ok);
    const submit = () => {
      result = input.value;
      m.close();
    };
    cancel.onclick = () => m.close();
    ok.onclick = submit;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
    setTimeout(() => input.focus(), 60);
  });
}

export function confirmDialog({ title, message, okLabel, danger = false }) {
  return new Promise((resolve) => {
    let result = false;
    const m = openModal({ title, size: 'sm', onClose: () => resolve(result) });
    m.body.innerHTML = '<p class="muted-text"></p>';
    m.body.querySelector('p').textContent = message;
    const cancel = button(t('common.cancel'));
    const ok = button(okLabel || t('common.ok'), { variant: danger ? 'danger' : 'primary' });
    m.footer.append(cancel, ok);
    cancel.onclick = () => m.close();
    ok.onclick = () => {
      result = true;
      m.close();
    };
  });
}

// ---------------------------------------------------------------- File in ingresso

/**
 * Prepara i PDF scelti: se un file è protetto chiede la password e lo decifra in locale,
 * così tutti gli strumenti lavorano su un documento leggibile.
 */
export async function preparePdf(file) {
  if (!isPdfFile(file)) throw new UserError('errors.notPdf', { name: file.name });
  const bytes = await readBytes(file);
  if (!looksEncrypted(bytes)) return file;
  let out = await decryptPdfBytes(bytes, '');
  let error = '';
  while (!out) {
    const pw = await prompt({
      title: t('password.title'),
      message: t('password.message', { name: file.name }),
      type: 'password',
      okLabel: t('password.unlock'),
      error,
    });
    if (pw === null) throw new Cancelled();
    out = await decryptPdfBytes(bytes, pw);
    error = t('errors.wrongPassword');
  }
  const decrypted = new File([out], file.name, { type: 'application/pdf' });
  decrypted.wasEncrypted = true;
  return decrypted;
}

/**
 * Area di caricamento. accept: 'pdf' | 'image' | 'pdf,image'. onFiles riceve i file già pronti.
 */
export function createDropzone({ accept = 'pdf', multiple = false, onFiles, compact = false }) {
  const acceptAttr = accept
    .split(',')
    .map((a) => (a === 'pdf' ? 'application/pdf,.pdf' : 'image/*'))
    .join(',');
  const prompts = {
    pdf: multiple ? t('common.uploadPromptMulti') : t('common.uploadPrompt'),
    image: t('common.uploadPromptImages'),
  };
  const zone = document.createElement('div');
  zone.className = `dropzone${compact ? ' dropzone-compact' : ''}`;
  zone.tabIndex = 0;
  zone.innerHTML = `
    <input type="file" ${multiple ? 'multiple' : ''} accept="${acceptAttr}" hidden />
    <div class="dropzone-icon">${ICONS.upload}</div>
    <p class="dropzone-prompt"></p>
    <p class="dropzone-sub"></p>
    <span class="btn btn-primary dropzone-btn">${escapeHtml(t('common.browseFiles'))}</span>`;
  zone.querySelector('.dropzone-prompt').textContent = prompts[accept.split(',')[0]] || prompts.pdf;
  zone.querySelector('.dropzone-sub').textContent = t('common.privacyNote');
  const input = zone.querySelector('input');

  async function handle(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const ready = [];
    for (const f of files) {
      try {
        if (isPdfFile(f)) ready.push(await preparePdf(f));
        else if (f.type.startsWith('image/') && accept.includes('image')) ready.push(f);
        else throw new UserError(accept.includes('image') ? 'errors.notImageOrPdf' : 'errors.notPdf', { name: f.name });
      } catch (err) {
        showError(err);
      }
    }
    if (ready.length) onFiles(multiple ? ready : [ready[0]]);
  }

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') input.click();
  });
  input.addEventListener('change', () => {
    handle(input.files);
    input.value = '';
  });
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.remove('dragover');
    handle(e.dataTransfer?.files);
  });
  zone.pick = () => input.click();
  return zone;
}

export function loadingBlock(text) {
  const el = document.createElement('div');
  el.className = 'loading-block';
  el.innerHTML = '<div class="spinner"></div><p></p>';
  el.querySelector('p').textContent = text || t('common.loading');
  return el;
}

export function createProgress() {
  const el = document.createElement('div');
  el.className = 'progress-wrap';
  el.innerHTML = '<div class="progress-label"></div><div class="progress-bar"><div class="progress-fill"></div></div>';
  const label = el.querySelector('.progress-label');
  const fill = el.querySelector('.progress-fill');
  return {
    el,
    set(fraction, text) {
      fill.style.width = `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`;
      if (text !== undefined) label.textContent = text;
    },
  };
}

export function fileRow(file, actions = '') {
  const row = document.createElement('div');
  row.className = 'file-row';
  row.innerHTML = `
    <div class="file-info">
      <span class="file-icon">${ICONS.file}</span>
      <div class="file-texts"><div class="file-name"></div><div class="file-size"></div></div>
    </div>
    <div class="file-actions">${actions}</div>`;
  row.querySelector('.file-name').textContent = file.name;
  row.querySelector('.file-size').textContent = formatBytes(file.size);
  return row;
}

// ---------------------------------------------------------------- Risultato

let continueHandler = null;
/** main.js registra qui come aprire un altro strumento con il file appena prodotto. */
export function setContinueHandler(fn) {
  continueHandler = fn;
}

/**
 * Schermata finale: salva/condividi, anteprima, continua con un altro strumento.
 * details: righe di testo (es. "Da 2,4 MB a 812 KB").
 */
export function showResult({ blob, filename, details = [], title }) {
  confetti({ particleCount: 70, spread: 65, origin: { y: 0.7 }, disableForReducedMotion: true });
  const m = openModal({ title: title || t('result.title'), size: 'sm' });
  m.body.innerHTML = `
    <div class="result-hero">
      <div class="result-check">${ICONS.check}</div>
      <div class="result-file"></div>
      <div class="result-size"></div>
      <ul class="result-details"></ul>
    </div>`;
  m.body.querySelector('.result-file').textContent = filename;
  m.body.querySelector('.result-size').textContent = formatBytes(blob.size);
  const list = m.body.querySelector('.result-details');
  for (const d of details) {
    const li = document.createElement('li');
    li.textContent = d;
    list.appendChild(li);
  }

  // Interfaccia dell'app: anche nell'anteprima per gli screenshot degli store
  const appUi = isNative || getMonetization().native;
  const save = button(appUi ? t('result.saveShare') : t('result.download'), {
    variant: 'success',
    icon: appUi ? ICONS.share : ICONS.download,
  });
  save.classList.add('btn-block');
  save.onclick = async () => {
    try {
      const outcome = await saveFile(blob, filename);
      if (outcome === 'downloaded') toast(t('result.downloaded'), 'success');
    } catch (err) {
      showError(err);
    }
  };
  const actions = document.createElement('div');
  actions.className = 'result-actions';
  actions.appendChild(save);

  if (!appUi) {
    const preview = button(t('result.open'), { icon: ICONS.eye });
    preview.onclick = () => openFile(blob, filename);
    actions.appendChild(preview);
  }
  const isPdf = blob.type === 'application/pdf' || /\.pdf$/i.test(filename);
  if (isPdf && continueHandler) {
    const cont = button(t('result.continue'), { icon: ICONS.next });
    cont.onclick = () => {
      m.close();
      continueHandler(new File([blob], filename, { type: 'application/pdf' }));
    };
    actions.appendChild(cont);
  }
  m.body.appendChild(actions);
  trackAdAction();
  return m;
}
