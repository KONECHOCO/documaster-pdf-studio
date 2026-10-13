// Editor visivo: penna, evidenziatore, testo, rettangoli, linee, timbri. Funziona con dito, penna e mouse.
// Testi salvati come testo vero (ricercabile); disegni come livello trasparente ad alta risoluzione.
import { PDFDocument, rgb } from 'pdf-lib';
import { t } from '../i18n/index.js';
import { getTool } from '../tools.js';
import { openModal, button, setButtonBusy, showResult, showError, prompt, confirmDialog, toast, escapeHtml, ICONS } from './ui.js';
import { createPageView, loadPdfInto } from './pageView.js';
import { readBytes, pdfBlob, baseName, drawOverlayOnPage, canvasToBlob } from '../utils/pdfHelper.js';
import { embedTextFont } from '../utils/fonts.js';
import { viewportPointToPdf } from '../utils/geometry.js';

const COLORS = ['#e11d48', '#2563eb', '#16a34a', '#111827', '#f59e0b', '#7c3aed'];
const HIGHLIGHT = '#facc15';

function hexToRgb01(hex) {
  const h = hex.replace('#', '');
  return rgb(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255);
}

/** Disegna le annotazioni (non testuali) su un contesto di dimensioni W×H. */
function paint(ctx, W, H, items, { includeText = true } = {}) {
  ctx.clearRect(0, 0, W, H);
  for (const it of items) {
    ctx.save();
    if (it.type === 'pen' || it.type === 'highlighter') {
      if (it.points.length < 2) {
        ctx.restore();
        continue;
      }
      ctx.strokeStyle = it.color;
      ctx.lineWidth = it.width * W;
      ctx.globalAlpha = it.type === 'highlighter' ? 0.35 : 1;
      ctx.lineCap = it.type === 'highlighter' ? 'butt' : 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(it.points[0].fx * W, it.points[0].fy * H);
      for (const p of it.points.slice(1)) ctx.lineTo(p.fx * W, p.fy * H);
      ctx.stroke();
    } else if (it.type === 'rect' || it.type === 'line') {
      ctx.strokeStyle = it.color;
      ctx.lineWidth = it.width * W;
      ctx.lineCap = 'round';
      if (it.type === 'rect') {
        ctx.strokeRect(it.x1 * W, it.y1 * H, (it.x2 - it.x1) * W, (it.y2 - it.y1) * H);
      } else {
        ctx.beginPath();
        ctx.moveTo(it.x1 * W, it.y1 * H);
        ctx.lineTo(it.x2 * W, it.y2 * H);
        ctx.stroke();
      }
    } else if (it.type === 'stamp') {
      const fs = it.size * W;
      ctx.font = `800 ${fs}px Outfit, Inter, sans-serif`;
      const tw = ctx.measureText(it.text).width;
      const pad = fs * 0.45;
      ctx.translate(it.fx * W, it.fy * H);
      ctx.rotate(-0.12);
      ctx.strokeStyle = it.color;
      ctx.fillStyle = it.color;
      ctx.lineWidth = fs * 0.12;
      ctx.globalAlpha = 0.9;
      ctx.strokeRect(-tw / 2 - pad, -fs / 2 - pad * 0.8, tw + pad * 2, fs + pad * 1.6);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.text, 0, fs * 0.05);
    } else if (it.type === 'text' && includeText) {
      ctx.fillStyle = it.color;
      ctx.font = `${it.size * W}px Inter, sans-serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(it.text, it.fx * W, it.fy * H);
    }
    ctx.restore();
  }
}

export function openEditorModal(initialFile = null) {
  const tool = getTool('edit');
  let dirty = false;
  const m = openModal({
    title: t('tools.edit.title'),
    subtitle: t('tools.edit.desc'),
    icon: tool.icon,
    color: tool.color,
    size: 'xl',
    confirmClose: () => (dirty ? confirmDialog({ title: t('common.discardTitle'), message: t('common.discardMessage'), okLabel: t('common.discard'), danger: true }) : true),
  });

  loadPdfInto(m, initialFile, (file, pdfJsDoc) => {
    let activeTool = 'pen';
    let color = COLORS[0];
    let widthPt = 2;
    const annotations = {}; // pageNum -> items
    const history = []; // pageNum degli elementi aggiunti, per Annulla

    const stamps = t('editor.stamps');
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.innerHTML = `
      <div class="tool-group">
        ${['pen', 'highlighter', 'text', 'rect', 'line', 'stamp']
          .map((id) => `<button class="editor-tool-btn ${id === activeTool ? 'active' : ''}" data-tool="${id}">${escapeHtml(t(`editor.${id}`))}</button>`)
          .join('')}
      </div>
      <div class="tool-group">
        <select class="select-input select-sm" id="stamp-text" hidden>${stamps.map((s) => `<option>${escapeHtml(s)}</option>`).join('')}</select>
        <div class="swatches">${COLORS.map((c, i) => `<button class="swatch ${i === 0 ? 'active' : ''}" data-color="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>
        <select class="select-input select-sm" id="stroke-width" aria-label="${escapeHtml(t('editor.thickness'))}">
          <option value="1">${escapeHtml(t('editor.thin'))}</option>
          <option value="2" selected>${escapeHtml(t('editor.medium'))}</option>
          <option value="4">${escapeHtml(t('editor.thick'))}</option>
        </select>
        <button class="icon-btn" id="btn-undo" aria-label="${escapeHtml(t('editor.undo'))}" title="${escapeHtml(t('editor.undo'))}">${ICONS.undo}</button>
      </div>`;
    m.body.appendChild(toolbar);
    const hint = document.createElement('p');
    hint.className = 'muted-text editor-hint';
    m.body.appendChild(hint);

    const drawCanvas = document.createElement('canvas');
    drawCanvas.className = 'draw-layer';

    const view = createPageView(m.body, pdfJsDoc, {
      onPageRendered: (v) => {
        if (!drawCanvas.isConnected) v.overlay.appendChild(drawCanvas);
        redraw();
      },
    });

    function items() {
      return (annotations[view.pageNum] ||= []);
    }

    function redraw(extra) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const W = view.width;
      const H = view.height;
      if (!W || !H) return;
      drawCanvas.width = Math.round(W * dpr);
      drawCanvas.height = Math.round(H * dpr);
      drawCanvas.style.width = `${W}px`;
      drawCanvas.style.height = `${H}px`;
      const ctx = drawCanvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(ctx, W, H, extra ? [...items(), extra] : items());
    }

    function updateHint() {
      hint.textContent = t(`editor.hint_${activeTool}`);
      toolbar.querySelector('#stamp-text').hidden = activeTool !== 'stamp';
    }
    updateHint();

    toolbar.querySelectorAll('[data-tool]').forEach((b) =>
      b.addEventListener('click', () => {
        toolbar.querySelectorAll('[data-tool]').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        activeTool = b.dataset.tool;
        updateHint();
      })
    );
    toolbar.querySelectorAll('[data-color]').forEach((b) =>
      b.addEventListener('click', () => {
        toolbar.querySelectorAll('[data-color]').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        color = b.dataset.color;
      })
    );
    toolbar.querySelector('#stroke-width').addEventListener('change', (e) => (widthPt = parseFloat(e.target.value)));
    toolbar.querySelector('#btn-undo').addEventListener('click', () => {
      const pageNum = history.pop();
      if (!pageNum) return;
      annotations[pageNum]?.pop();
      if (pageNum !== view.pageNum) view.goTo(pageNum);
      else redraw();
    });

    async function add(item) {
      items().push(item);
      history.push(view.pageNum);
      dirty = true;
      redraw();
    }

    // Disegno con pointer events: dito, penna e mouse
    drawCanvas.style.touchAction = 'none';
    let current = null;
    drawCanvas.addEventListener('pointerdown', async (e) => {
      if (e.button > 0) return;
      const vp = await view.getViewport1(view.pageNum);
      const { fx, fy } = view.toFraction(e);
      const lineW = (activeTool === 'highlighter' ? 14 : widthPt) / vp.width;
      if (activeTool === 'text') {
        const text = await prompt({ title: t('editor.addText'), placeholder: t('editor.textPlaceholder') });
        if (text && text.trim()) add({ type: 'text', text: text.trim(), fx, fy, size: 14 / vp.width, color });
        return;
      }
      if (activeTool === 'stamp') {
        add({ type: 'stamp', text: toolbar.querySelector('#stamp-text').value, fx, fy, size: 20 / vp.width, color });
        return;
      }
      e.preventDefault();
      drawCanvas.setPointerCapture(e.pointerId);
      if (activeTool === 'pen' || activeTool === 'highlighter') {
        current = { type: activeTool, points: [{ fx, fy }], color: activeTool === 'highlighter' ? HIGHLIGHT : color, width: lineW };
      } else {
        current = { type: activeTool, x1: fx, y1: fy, x2: fx, y2: fy, color, width: lineW };
      }
    });
    drawCanvas.addEventListener('pointermove', (e) => {
      if (!current) return;
      const { fx, fy } = view.toFraction(e);
      if (current.points) current.points.push({ fx, fy });
      else {
        current.x2 = fx;
        current.y2 = fy;
      }
      redraw(current);
    });
    const finish = () => {
      if (!current) return;
      const item = current;
      current = null;
      if (item.type === 'rect') {
        [item.x1, item.x2] = [Math.min(item.x1, item.x2), Math.max(item.x1, item.x2)];
        [item.y1, item.y2] = [Math.min(item.y1, item.y2), Math.max(item.y1, item.y2)];
        if (item.x2 - item.x1 < 0.005 || item.y2 - item.y1 < 0.005) return redraw();
      }
      if (item.points && item.points.length < 2) return redraw();
      add(item);
    };
    drawCanvas.addEventListener('pointerup', finish);
    drawCanvas.addEventListener('pointercancel', finish);

    const cancel = button(t('common.cancel'));
    const save = button(t('actions.edit'), { variant: 'success' });
    cancel.onclick = () => m.requestClose();
    m.footer.append(cancel, save);

    save.onclick = async () => {
      const pages = Object.keys(annotations).map(Number).filter((n) => annotations[n].length);
      if (!pages.length) {
        toast(t('editor.nothingToSave'));
        return;
      }
      setButtonBusy(save, true, t('common.processing'));
      try {
        const doc = await PDFDocument.load(await readBytes(file), { updateMetadata: false });
        const allText = pages.flatMap((n) => annotations[n].filter((a) => a.type === 'text').map((a) => a.text)).join(' ');
        const font = allText ? await embedTextFont(doc, allText) : null;
        for (const n of pages) {
          const vp = await view.getViewport1(n);
          const list = annotations[n];
          if (list.some((a) => a.type !== 'text')) {
            const scale = 3; // ~216 dpi
            const c = document.createElement('canvas');
            c.width = Math.round(vp.width * scale);
            c.height = Math.round(vp.height * scale);
            paint(c.getContext('2d'), c.width, c.height, list, { includeText: false });
            await drawOverlayOnPage(doc, n - 1, vp, await readBytes(await canvasToBlob(c, 'image/png')));
          }
          const page = doc.getPage(n - 1);
          for (const a of list.filter((x) => x.type === 'text')) {
            const p = viewportPointToPdf(vp, a.fx * vp.width, a.fy * vp.height);
            page.drawText(a.text, { x: p.x, y: p.y, size: a.size * vp.width, font, color: hexToRgb01(a.color), rotate: p.rotate });
          }
        }
        dirty = false;
        const blob = pdfBlob(await doc.save());
        m.close();
        showResult({ blob, filename: `${baseName(file.name)}_edited.pdf` });
      } catch (err) {
        showError(err);
        setButtonBusy(save, false, t('actions.edit'));
      }
    };
  });
  return m;
}
