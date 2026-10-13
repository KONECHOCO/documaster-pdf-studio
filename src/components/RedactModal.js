// Oscuramento: l'utente traccia rettangoli sulle aree da nascondere. Al salvataggio le pagine
// interessate diventano immagini con i riquadri neri "bruciati": il testo sotto viene eliminato davvero.
import { t } from '../i18n/index.js';
import { getTool } from '../tools.js';
import { openModal, button, setButtonBusy, showResult, showError, confirmDialog, toast, escapeHtml, ICONS } from './ui.js';
import { createPageView, loadPdfInto } from './pageView.js';
import { redactPdf, baseName } from '../utils/pdfHelper.js';

export function openRedactModal(initialFile = null) {
  const tool = getTool('redact');
  const areas = {};
  const history = [];
  const m = openModal({
    title: t('tools.redact.title'),
    subtitle: t('tools.redact.desc'),
    icon: tool.icon,
    color: tool.color,
    size: 'xl',
    confirmClose: () => (history.length ? confirmDialog({ title: t('common.discardTitle'), message: t('common.discardMessage'), okLabel: t('common.discard'), danger: true }) : true),
  });

  loadPdfInto(m, initialFile, (file, pdfJsDoc) => {
    const bar = document.createElement('div');
    bar.className = 'editor-toolbar';
    bar.innerHTML = `<p class="muted-text">${escapeHtml(t('redact.hint'))}</p>
      <button class="icon-btn" id="redact-undo" aria-label="${escapeHtml(t('editor.undo'))}">${ICONS.undo}</button>`;
    m.body.appendChild(bar);

    const layer = document.createElement('div');
    layer.className = 'redact-layer';
    layer.style.touchAction = 'none';
    const view = createPageView(m.body, pdfJsDoc, {
      onPageRendered: (v) => {
        if (!layer.isConnected) v.overlay.appendChild(layer);
        draw();
      },
    });

    function draw(extra) {
      layer.innerHTML = '';
      const list = [...(areas[view.pageNum] || []), ...(extra ? [extra] : [])];
      for (const a of list) {
        const d = document.createElement('div');
        d.className = 'redact-box';
        Object.assign(d.style, { left: `${a.fx * 100}%`, top: `${a.fy * 100}%`, width: `${a.fw * 100}%`, height: `${a.fh * 100}%` });
        layer.appendChild(d);
      }
    }

    let start = null;
    let current = null;
    layer.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      e.preventDefault();
      layer.setPointerCapture(e.pointerId);
      start = view.toFraction(e);
    });
    layer.addEventListener('pointermove', (e) => {
      if (!start) return;
      const p = view.toFraction(e);
      current = { fx: Math.min(start.fx, p.fx), fy: Math.min(start.fy, p.fy), fw: Math.abs(p.fx - start.fx), fh: Math.abs(p.fy - start.fy) };
      draw(current);
    });
    const end = () => {
      if (current && current.fw > 0.005 && current.fh > 0.003) {
        (areas[view.pageNum] ||= []).push(current);
        history.push(view.pageNum);
      }
      start = current = null;
      draw();
    };
    layer.addEventListener('pointerup', end);
    layer.addEventListener('pointercancel', end);
    bar.querySelector('#redact-undo').addEventListener('click', () => {
      const n = history.pop();
      if (!n) return;
      areas[n].pop();
      if (n !== view.pageNum) view.goTo(n);
      else draw();
    });

    const cancel = button(t('common.cancel'));
    const save = button(t('actions.redact'), { variant: 'success' });
    cancel.onclick = () => m.requestClose();
    m.footer.append(cancel, save);
    save.onclick = async () => {
      if (!history.length) return toast(t('redact.empty'));
      setButtonBusy(save, true, t('common.processing'));
      try {
        const blob = await redactPdf(file, areas);
        const n = Object.values(areas).reduce((s, l) => s + l.length, 0);
        history.length = 0;
        m.close();
        showResult({ blob, filename: `${baseName(file.name)}_redacted.pdf`, details: [t('result.redacted', { n })] });
      } catch (err) {
        showError(err);
        setButtonBusy(save, false, t('actions.redact'));
      }
    };
  });
  return m;
}
