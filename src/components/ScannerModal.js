// Scanner documenti: fotocamera dal vivo, fotocamera del telefono o foto importate →
// rilevamento automatico del foglio → ritaglio con 4 angoli trascinabili → raddrizzamento →
// filtro "documento" senza ombre → PDF (opzionalmente con testo ricercabile tramite OCR).
import { t, getLanguage } from '../i18n/index.js';
import { getTool } from '../tools.js';
import { openModal, button, setButtonBusy, showResult, showError, confirmDialog, toast, createProgress, escapeHtml, ICONS } from './ui.js';
import { makeDraggable } from './pageView.js';
import { detectDocumentCorners, defaultCorners, warpPerspective, applyDocumentFilter, rotateCanvas } from '../utils/scan.js';
import { imageToCanvas, imagesToPdfBlob } from '../utils/pdfHelper.js';
import { ocrCanvasesToPdf, OCR_LANGS } from '../utils/ocr.js';

const SOURCE_MAX_PX = 2800;
const FILTERS = ['auto', 'bw', 'gray', 'original'];

export function openScannerModal() {
  const tool = getTool('scanner');
  let stream = null;
  let facingMode = 'environment';
  let filter = 'auto';
  let pages = []; // { id, source, corners, rotation, thumb }
  let uid = 0;

  const m = openModal({
    title: t('tools.scanner.title'),
    subtitle: t('tools.scanner.desc'),
    icon: tool.icon,
    color: tool.color,
    size: 'lg',
    onClose: stopCamera,
    confirmClose: () => (pages.length ? confirmDialog({ title: t('common.discardTitle'), message: t('scanner.discard'), okLabel: t('common.discard'), danger: true }) : true),
  });

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.multiple = true;
  fileInput.hidden = true;
  const cameraInput = document.createElement('input');
  cameraInput.type = 'file';
  cameraInput.accept = 'image/*';
  cameraInput.setAttribute('capture', 'environment');
  cameraInput.hidden = true;
  m.overlay.append(fileInput, cameraInput);

  const cancelBtn = button(t('common.cancel'));
  const createBtn = button(t('scanner.createPdf'), { variant: 'success', disabled: true });
  cancelBtn.onclick = () => m.requestClose();
  m.footer.append(cancelBtn, createBtn);

  const hasLiveCamera = !!navigator.mediaDevices?.getUserMedia;

  // ------------------------------------------------------------ Schermata principale

  function renderMain() {
    m.footer.hidden = false;
    m.body.innerHTML = `
      ${hasLiveCamera ? `
      <div class="scanner-video-box">
        <video class="scanner-video" autoplay playsinline muted></video>
        <div class="scanner-guide"></div>
        <div class="camera-status"></div>
      </div>
      <div class="scanner-controls">
        <button class="icon-btn" id="sc-switch" aria-label="${escapeHtml(t('scanner.switchCamera'))}">${ICONS.rotate}</button>
        <button class="btn-snap" id="sc-snap" aria-label="${escapeHtml(t('scanner.capture'))}"><span class="btn-snap-inner"></span></button>
        <button class="icon-btn" id="sc-import" aria-label="${escapeHtml(t('scanner.import'))}">${ICONS.image}</button>
      </div>` : ''}
      <div class="scanner-alt">
        <button class="btn btn-secondary" id="sc-native">${ICONS.camera}<span>${escapeHtml(t('scanner.phoneCamera'))}</span></button>
        <button class="btn btn-secondary" id="sc-import2">${ICONS.image}<span>${escapeHtml(t('scanner.import'))}</span></button>
      </div>
      <div class="scan-section">
        <div class="scan-section-head">
          <h4>${escapeHtml(t('scanner.pages', { n: pages.length }))}</h4>
          ${pages.length ? `<span class="muted-text">${escapeHtml(t('scanner.tapToEdit'))}</span>` : ''}
        </div>
        <div class="scanned-strip">${pages.length ? '' : `<p class="muted-text">${escapeHtml(t('scanner.noPages'))}</p>`}</div>
      </div>
      ${pages.length ? `
      <div class="options-panel">
        <div class="field-label">${escapeHtml(t('scanner.filter'))}</div>
        <div class="segmented" id="sc-filter">${FILTERS.map((f) => `<button data-f="${f}" class="${f === filter ? 'active' : ''}">${escapeHtml(t(`scanner.filter_${f}`))}</button>`).join('')}</div>
        <div class="field-row">
          <label class="field"><span class="field-label">${escapeHtml(t('opts.pageSize'))}</span>
            <select id="sc-size" class="select-input"><option value="a4">A4</option><option value="letter">US Letter</option><option value="fit">${escapeHtml(t('opts.pageFit'))}</option></select></label>
        </div>
        <label class="check-row"><input type="checkbox" id="sc-ocr" /> <span>${escapeHtml(t('scanner.ocr'))}</span></label>
        <p class="field-hint">${escapeHtml(t('scanner.ocrHint'))}</p>
      </div>` : ''}`;

    const strip = m.body.querySelector('.scanned-strip');
    pages.forEach((p, i) => {
      const card = document.createElement('div');
      card.className = 'scanned-thumb-card';
      card.innerHTML = `<img src="${p.thumb}" alt="" /><span class="thumb-page-num">${i + 1}</span>
        <button class="thumb-delete-btn" aria-label="${escapeHtml(t('common.remove'))}">×</button>`;
      card.querySelector('img').onclick = () => openCrop(p);
      card.querySelector('.thumb-delete-btn').onclick = (e) => {
        e.stopPropagation();
        pages.splice(i, 1);
        renderMain();
      };
      strip.appendChild(card);
    });

    m.body.querySelector('#sc-native').onclick = () => cameraInput.click();
    m.body.querySelector('#sc-import2').onclick = () => fileInput.click();
    m.body.querySelectorAll('#sc-filter button').forEach((b) =>
      b.addEventListener('click', async () => {
        filter = b.dataset.f;
        m.body.querySelectorAll('#sc-filter button').forEach((x) => x.classList.toggle('active', x === b));
        for (const p of pages) p.thumb = makeThumb(p);
        renderMain();
      })
    );
    createBtn.disabled = pages.length === 0;

    if (hasLiveCamera) {
      const video = m.body.querySelector('video');
      m.body.querySelector('#sc-snap').onclick = () => snap(video);
      m.body.querySelector('#sc-switch').onclick = () => {
        facingMode = facingMode === 'environment' ? 'user' : 'environment';
        startCamera(video, true);
      };
      m.body.querySelector('#sc-import').onclick = () => fileInput.click();
      startCamera(video);
    }
  }

  async function startCamera(video, restart = false) {
    const status = m.body.querySelector('.camera-status');
    if (stream && !restart) {
      video.srcObject = stream;
      status.hidden = true;
      return;
    }
    stopCamera();
    status.hidden = false;
    status.textContent = t('scanner.cameraStarting');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 3840 }, height: { ideal: 2160 } },
        audio: false,
      });
      if (!video.isConnected) return stopCamera();
      video.srcObject = stream;
      await video.play().catch(() => {});
      status.hidden = true;
    } catch (err) {
      console.warn('Fotocamera non disponibile', err);
      status.textContent = t('scanner.cameraError');
    }
  }

  function stopCamera() {
    stream?.getTracks().forEach((tr) => tr.stop());
    stream = null;
  }

  function snap(video) {
    if (!video.videoWidth) {
      toast(t('scanner.cameraError'));
      return;
    }
    const c = document.createElement('canvas');
    const s = Math.min(1, SOURCE_MAX_PX / Math.max(video.videoWidth, video.videoHeight));
    c.width = Math.round(video.videoWidth * s);
    c.height = Math.round(video.videoHeight * s);
    c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
    video.classList.add('flash');
    setTimeout(() => video.classList.remove('flash'), 180);
    openCrop({ id: ++uid, source: c, corners: detectDocumentCorners(c), rotation: 0, isNew: true });
  }

  async function importFiles(list) {
    const files = Array.from(list || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    try {
      if (files.length === 1) {
        const c = await imageToCanvas(files[0], SOURCE_MAX_PX);
        openCrop({ id: ++uid, source: c, corners: detectDocumentCorners(c), rotation: 0, isNew: true });
        return;
      }
      // Più foto: ritaglio automatico, correggibile toccando la miniatura
      for (const f of files) {
        const c = await imageToCanvas(f, SOURCE_MAX_PX);
        const p = { id: ++uid, source: c, corners: detectDocumentCorners(c), rotation: 0 };
        p.thumb = makeThumb(p);
        pages.push(p);
      }
      renderMain();
    } catch (err) {
      showError(err);
    }
  }
  fileInput.addEventListener('change', () => {
    importFiles(fileInput.files);
    fileInput.value = '';
  });
  cameraInput.addEventListener('change', () => {
    importFiles(cameraInput.files);
    cameraInput.value = '';
  });

  // ------------------------------------------------------------ Elaborazione pagina

  function processPage(p, maxPx) {
    const warped = warpPerspective(p.source, p.corners, maxPx);
    return applyDocumentFilter(rotateCanvas(warped, p.rotation), filter);
  }

  function makeThumb(p) {
    return processPage(p, 360).toDataURL('image/jpeg', 0.8);
  }

  // ------------------------------------------------------------ Ritaglio

  function openCrop(page) {
    const draft = { ...page, corners: page.corners.map((c) => ({ ...c })) };
    m.footer.hidden = true;
    m.body.innerHTML = `
      <p class="muted-text">${escapeHtml(t('scanner.cropHint'))}</p>
      <div class="crop-stage">
        <div class="crop-wrap">
          <canvas class="crop-canvas"></canvas>
          <svg class="crop-svg"><polygon class="crop-poly"></polygon></svg>
          ${[0, 1, 2, 3].map((i) => `<div class="crop-handle" data-i="${i}"></div>`).join('')}
        </div>
      </div>
      <div class="crop-actions">
        <button class="btn btn-secondary btn-sm" id="cr-full">${ICONS.crop}<span>${escapeHtml(t('scanner.fullImage'))}</span></button>
        <button class="btn btn-secondary btn-sm" id="cr-auto">${escapeHtml(t('scanner.autoDetect'))}</button>
        <button class="btn btn-secondary btn-sm" id="cr-rot">${ICONS.rotate}<span>${escapeHtml(t('scanner.rotate'))}</span></button>
      </div>
      <div class="crop-footer">
        <button class="btn btn-secondary" id="cr-cancel">${escapeHtml(page.isNew ? t('scanner.retake') : t('common.cancel'))}</button>
        <button class="btn btn-success" id="cr-ok">${escapeHtml(t('scanner.confirm'))}</button>
      </div>`;

    const wrap = m.body.querySelector('.crop-wrap');
    const canvas = m.body.querySelector('.crop-canvas');
    const poly = m.body.querySelector('.crop-poly');
    const handles = [...m.body.querySelectorAll('.crop-handle')];
    const src = draft.source;
    let scale = 1;

    function layout() {
      const stage = m.body.querySelector('.crop-stage');
      if (!stage) return;
      const maxW = stage.clientWidth;
      const maxH = Math.max(260, window.innerHeight * 0.55);
      scale = Math.min(maxW / src.width, maxH / src.height);
      const w = Math.round(src.width * scale);
      const h = Math.round(src.height * scale);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.getContext('2d').drawImage(src, 0, 0, canvas.width, canvas.height);
      wrap.style.width = `${w}px`;
      wrap.style.height = `${h}px`;
      const svgEl = m.body.querySelector('.crop-svg');
      svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
      update();
    }
    function update() {
      poly.setAttribute('points', draft.corners.map((c) => `${c.x * scale},${c.y * scale}`).join(' '));
      handles.forEach((hd, i) => {
        hd.style.left = `${draft.corners[i].x * scale}px`;
        hd.style.top = `${draft.corners[i].y * scale}px`;
      });
    }
    handles.forEach((hd, i) => {
      let start;
      makeDraggable(hd, {
        onStart: () => {
          start = { ...draft.corners[i] };
          hd.classList.add('active');
        },
        onMove: (dx, dy) => {
          draft.corners[i] = {
            x: Math.max(0, Math.min(src.width, start.x + dx / scale)),
            y: Math.max(0, Math.min(src.height, start.y + dy / scale)),
          };
          update();
        },
        onEnd: () => hd.classList.remove('active'),
      });
    });
    requestAnimationFrame(layout);

    m.body.querySelector('#cr-full').onclick = () => {
      draft.corners = defaultCorners(src.width, src.height, 0);
      update();
    };
    m.body.querySelector('#cr-auto').onclick = () => {
      draft.corners = detectDocumentCorners(src);
      update();
    };
    m.body.querySelector('#cr-rot').onclick = () => {
      draft.rotation = (draft.rotation + 90) % 360;
      toast(t('scanner.rotated', { deg: draft.rotation }));
    };
    m.body.querySelector('#cr-cancel').onclick = () => renderMain();
    m.body.querySelector('#cr-ok').onclick = () => {
      Object.assign(page, draft);
      delete page.isNew;
      page.thumb = makeThumb(page);
      if (!pages.includes(page)) pages.push(page);
      renderMain();
    };
  }

  // ------------------------------------------------------------ Creazione PDF

  createBtn.onclick = async () => {
    if (!pages.length) return;
    const pageSize = m.body.querySelector('#sc-size')?.value || 'a4';
    const withOcr = m.body.querySelector('#sc-ocr')?.checked;
    setButtonBusy(createBtn, true, t('common.processing'));
    cancelBtn.disabled = true;
    const progress = createProgress();
    m.body.appendChild(progress.el);
    progress.set(0, t('progress.working', { pct: 0 }));
    try {
      const canvases = [];
      for (let i = 0; i < pages.length; i++) {
        canvases.push(processPage(pages[i], 2200));
        progress.set((i + 1) / pages.length / (withOcr ? 2 : 1), t('progress.working', { pct: Math.round(((i + 1) / pages.length) * 100) }));
        await new Promise((r) => setTimeout(r, 0));
      }
      const margin = pageSize === 'fit' ? 0 : 18;
      let blob;
      if (withOcr) {
        const langs = [getLanguage(), 'en'].filter((l) => OCR_LANGS[l]);
        const r = await ocrCanvasesToPdf(canvases, {
          langs,
          pageSize,
          margin,
          onProgress: (f, phase) => progress.set(0.5 + f / 2, phase === 'download' ? t('progress.downloadingModel') : t('progress.recognizing', { pct: Math.round(f * 100) })),
        });
        blob = r.blob;
      } else {
        blob = await imagesToPdfBlob(canvases.map((canvas) => ({ canvas })), { pageSize, margin });
      }
      const date = new Date().toISOString().slice(0, 10);
      pages = [];
      m.close();
      showResult({ blob, filename: `Scan_${date}.pdf`, details: [t('common.pagesCount', { n: canvases.length })] });
    } catch (err) {
      showError(err);
      progress.el.remove();
      setButtonBusy(createBtn, false, t('scanner.createPdf'));
      cancelBtn.disabled = false;
    }
  };

  renderMain();
  return m;
}
