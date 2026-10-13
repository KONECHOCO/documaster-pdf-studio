// Firma: crea la firma (disegno, testo in corsivo, immagine), la ricorda sul dispositivo e la posiziona
// sulla pagina con un riquadro trascinabile e ridimensionabile (dito o mouse).
import '@fontsource/dancing-script/600.css';
import { PDFDocument } from 'pdf-lib';
import { t } from '../i18n/index.js';
import { getTool } from '../tools.js';
import { openModal, button, setButtonBusy, showResult, showError, escapeHtml, ICONS, toast } from './ui.js';
import { createPageView, loadPdfInto, makeDraggable } from './pageView.js';
import { readBytes, pdfBlob, baseName, loadImageBitmap } from '../utils/pdfHelper.js';
import { viewportRectToPdf } from '../utils/geometry.js';

const SAVED_KEY = 'documaster.signatures';
const INKS = ['#0f172a', '#1d4ed8', '#b91c1c'];

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY)) || [];
  } catch {
    return [];
  }
}
function remember(dataUrl) {
  const list = [dataUrl, ...loadSaved().filter((d) => d !== dataUrl)].slice(0, 4);
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  } catch {
    // spazio esaurito: la firma resta valida per questa sessione
  }
}

/** Ritaglia i bordi trasparenti: il riquadro sulla pagina avrà le proporzioni reali della firma. */
function trimCanvas(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const pad = 6;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const out = document.createElement('canvas');
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext('2d').drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

/** Finestra di creazione firma. Restituisce un data URL PNG trasparente, o null. */
export function askSignature() {
  return new Promise((resolve) => {
    let result = null;
    let mode = 'draw';
    let ink = INKS[0];
    const m = openModal({ title: t('signature.createTitle'), size: 'md', onClose: () => resolve(result) });
    const saved = loadSaved();
    m.body.innerHTML = `
      ${saved.length ? `<div class="field-label">${escapeHtml(t('signature.saved'))}</div><div class="saved-sigs">${saved.map((d, i) => `<button class="saved-sig" data-i="${i}"><img src="${d}" alt=""/></button>`).join('')}</div>` : ''}
      <div class="segmented" id="sig-mode">
        <button data-mode="draw" class="active">${escapeHtml(t('signature.draw'))}</button>
        <button data-mode="type">${escapeHtml(t('signature.type'))}</button>
        <button data-mode="upload">${escapeHtml(t('signature.upload'))}</button>
      </div>
      <div class="sig-panel" data-panel="draw">
        <canvas class="signature-canvas" id="sig-pad"></canvas>
        <div class="sig-tools">
          <div class="swatches">${INKS.map((c, i) => `<button class="swatch ${i === 0 ? 'active' : ''}" data-ink="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>
          <button class="btn btn-secondary btn-sm" id="sig-clear">${escapeHtml(t('signature.clear'))}</button>
        </div>
      </div>
      <div class="sig-panel" data-panel="type" hidden>
        <input class="text-input" id="sig-name" maxlength="40" placeholder="${escapeHtml(t('signature.typePlaceholder'))}" />
        <div class="typed-preview" id="sig-preview"></div>
      </div>
      <div class="sig-panel" data-panel="upload" hidden>
        <input type="file" id="sig-file" accept="image/*" hidden />
        <button class="btn btn-secondary" id="sig-pick">${ICONS.image}<span>${escapeHtml(t('signature.pickImage'))}</span></button>
        <p class="field-hint">${escapeHtml(t('signature.uploadHint'))}</p>
        <img id="sig-upload-preview" class="upload-preview" hidden alt="" />
      </div>`;

    m.body.querySelectorAll('.saved-sig').forEach((b) =>
      b.addEventListener('click', () => {
        result = saved[Number(b.dataset.i)];
        m.close();
      })
    );

    const modeBtns = m.body.querySelectorAll('#sig-mode button');
    modeBtns.forEach((b) =>
      b.addEventListener('click', () => {
        mode = b.dataset.mode;
        modeBtns.forEach((x) => x.classList.toggle('active', x === b));
        m.body.querySelectorAll('.sig-panel').forEach((p) => (p.hidden = p.dataset.panel !== mode));
        if (mode === 'draw') sizePad();
      })
    );

    // --- Disegno
    const pad = m.body.querySelector('#sig-pad');
    const ctx = pad.getContext('2d');
    let hasInk = false;
    function sizePad() {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const w = pad.clientWidth || 500;
      const h = pad.clientHeight || 200;
      if (pad.width === Math.round(w * dpr)) return;
      pad.width = Math.round(w * dpr);
      pad.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      hasInk = false;
    }
    requestAnimationFrame(sizePad);
    pad.style.touchAction = 'none';
    let last = null;
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pad.setPointerCapture(e.pointerId);
      const r = pad.getBoundingClientRect();
      last = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    pad.addEventListener('pointermove', (e) => {
      if (!last) return;
      const r = pad.getBoundingClientRect();
      const p = { x: e.clientX - r.left, y: e.clientY - r.top };
      ctx.strokeStyle = ink;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Tratto più sottile quando si va veloci: aspetto più naturale
      const speed = Math.hypot(p.x - last.x, p.y - last.y);
      ctx.lineWidth = Math.max(1.6, 3.4 - speed * 0.06) * (e.pressure && e.pointerType === 'pen' ? 0.6 + e.pressure : 1);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
      hasInk = true;
    });
    const stop = () => (last = null);
    pad.addEventListener('pointerup', stop);
    pad.addEventListener('pointercancel', stop);
    m.body.querySelector('#sig-clear').addEventListener('click', () => {
      ctx.clearRect(0, 0, pad.width, pad.height);
      hasInk = false;
    });
    m.body.querySelectorAll('[data-ink]').forEach((b) =>
      b.addEventListener('click', () => {
        ink = b.dataset.ink;
        m.body.querySelectorAll('[data-ink]').forEach((x) => x.classList.toggle('active', x === b));
        m.body.querySelector('#sig-preview').style.color = ink;
      })
    );

    // --- Testo
    const nameInput = m.body.querySelector('#sig-name');
    const preview = m.body.querySelector('#sig-preview');
    nameInput.addEventListener('input', () => (preview.textContent = nameInput.value));

    // --- Immagine
    let uploaded = null;
    const fileInput = m.body.querySelector('#sig-file');
    m.body.querySelector('#sig-pick').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const f = fileInput.files[0];
      if (!f) return;
      try {
        const bmp = await loadImageBitmap(f);
        const c = document.createElement('canvas');
        const s = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
        c.width = Math.round(bmp.width * s);
        c.height = Math.round(bmp.height * s);
        const cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(bmp, 0, 0, c.width, c.height);
        // Sfondo bianco della foto → trasparente, così la firma non copre il documento
        const img = cx.getImageData(0, 0, c.width, c.height);
        for (let i = 0; i < img.data.length; i += 4) {
          const lum = img.data[i] * 0.299 + img.data[i + 1] * 0.587 + img.data[i + 2] * 0.114;
          if (lum > 200) img.data[i + 3] = 0;
          else if (lum > 150) img.data[i + 3] = Math.round(((200 - lum) / 50) * 255);
        }
        cx.putImageData(img, 0, 0);
        uploaded = trimCanvas(c) || c;
        const pv = m.body.querySelector('#sig-upload-preview');
        pv.src = uploaded.toDataURL('image/png');
        pv.hidden = false;
      } catch (err) {
        showError(err);
      }
    });

    const cancel = button(t('common.cancel'));
    const ok = button(t('signature.use'), { variant: 'primary' });
    m.footer.append(cancel, ok);
    cancel.onclick = () => m.close();
    ok.onclick = async () => {
      let canvas = null;
      if (mode === 'draw') {
        if (!hasInk) return toast(t('signature.empty'));
        canvas = trimCanvas(pad);
      } else if (mode === 'type') {
        const name = nameInput.value.trim();
        if (!name) return toast(t('signature.empty'));
        await document.fonts.load('600 80px "Dancing Script"').catch(() => {});
        const c = document.createElement('canvas');
        c.width = 1400;
        c.height = 260;
        const cx = c.getContext('2d');
        cx.font = '600 120px "Dancing Script", cursive';
        cx.fillStyle = ink;
        cx.textBaseline = 'middle';
        cx.fillText(name, 20, 130);
        canvas = trimCanvas(c);
      } else {
        if (!uploaded) return toast(t('signature.empty'));
        canvas = uploaded;
      }
      if (!canvas) return toast(t('signature.empty'));
      result = canvas.toDataURL('image/png');
      remember(result);
      m.close();
    };
  });
}

export function openSignatureModal(initialFile = null) {
  const tool = getTool('sign');
  const m = openModal({ title: t('tools.sign.title'), subtitle: t('tools.sign.desc'), icon: tool.icon, color: tool.color, size: 'xl' });

  loadPdfInto(m, initialFile, async (file, pdfJsDoc) => {
    let signature = await askSignature();
    if (!signature) {
      m.close();
      return;
    }
    let sigImg = await loadImageBitmap(await (await fetch(signature)).blob());
    // Riquadro della firma in frazioni della pagina; la larghezza iniziale è il 30% della pagina
    const box = { fx: 0.55, fy: 0.78, fw: 0.3, ratio: sigImg.height / sigImg.width, page: 1 };

    const bar = document.createElement('div');
    bar.className = 'editor-toolbar';
    bar.innerHTML = `
      <p class="muted-text">${escapeHtml(t('signature.placeHint'))}</p>
      <div class="tool-group">
        <button class="btn btn-secondary btn-sm" id="sig-change">${escapeHtml(t('signature.change'))}</button>
        <label class="check-row"><input type="checkbox" id="sig-all" /> <span>${escapeHtml(t('signature.allPages'))}</span></label>
      </div>`;
    m.body.appendChild(bar);

    const el = document.createElement('div');
    el.className = 'sig-box';
    el.innerHTML = `<img alt="" draggable="false" /><span class="sig-resize" aria-hidden="true"></span>`;
    el.querySelector('img').src = signature;

    const view = createPageView(m.body, pdfJsDoc, {
      onPageRendered: (v) => {
        if (!el.isConnected) v.overlay.appendChild(el);
        box.page = v.pageNum;
        layout();
      },
    });

    function layout() {
      const W = view.width;
      const H = view.height;
      const w = box.fw * W;
      const h = w * box.ratio;
      box.fx = Math.max(0, Math.min(1 - box.fw, box.fx));
      box.fy = Math.max(0, Math.min(1 - h / H, box.fy));
      Object.assign(el.style, { left: `${box.fx * W}px`, top: `${box.fy * H}px`, width: `${w}px`, height: `${h}px` });
    }

    let start = null;
    makeDraggable(el, {
      onStart: () => (start = { ...box }),
      onMove: (dx, dy) => {
        box.fx = start.fx + dx / view.width;
        box.fy = start.fy + dy / view.height;
        layout();
      },
    });
    makeDraggable(el.querySelector('.sig-resize'), {
      onStart: () => (start = { ...box }),
      onMove: (dx) => {
        box.fw = Math.max(0.06, Math.min(0.95, start.fw + dx / view.width));
        layout();
      },
    });

    bar.querySelector('#sig-change').addEventListener('click', async () => {
      const next = await askSignature();
      if (!next) return;
      signature = next;
      sigImg = await loadImageBitmap(await (await fetch(signature)).blob());
      box.ratio = sigImg.height / sigImg.width;
      el.querySelector('img').src = signature;
      layout();
    });

    const cancel = button(t('common.cancel'));
    const save = button(t('actions.sign'), { variant: 'success' });
    cancel.onclick = () => m.requestClose();
    m.footer.append(cancel, save);

    save.onclick = async () => {
      setButtonBusy(save, true, t('common.processing'));
      try {
        const doc = await PDFDocument.load(await readBytes(file), { updateMetadata: false });
        const png = await doc.embedPng(await readBytes(await (await fetch(signature)).blob()));
        const all = m.body.querySelector('#sig-all').checked;
        const pages = all ? [...Array(view.total).keys()].map((i) => i + 1) : [box.page];
        for (const n of pages) {
          const vp = await view.getViewport1(n);
          const w = box.fw * vp.width;
          const rect = { x: box.fx * vp.width, y: box.fy * vp.height, width: w, height: w * box.ratio };
          doc.getPage(n - 1).drawImage(png, viewportRectToPdf(vp, rect));
        }
        const blob = pdfBlob(await doc.save());
        m.close();
        showResult({ blob, filename: `${baseName(file.name)}_signed.pdf` });
      } catch (err) {
        showError(err);
        setButtonBusy(save, false, t('actions.sign'));
      }
    };
  });
  return m;
}
