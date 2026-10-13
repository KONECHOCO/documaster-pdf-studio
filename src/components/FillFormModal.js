// Compilazione moduli: 1) campi interattivi del PDF (AcroForm) compilati davvero tramite pdf-lib,
// 2) per i moduli "piatti" (fotocopie, scansioni) testo, ✓, ✗, data e firma posizionabili col dito.
import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFOptionList, rgb } from 'pdf-lib';
import { t, getLanguage } from '../i18n/index.js';
import { getTool } from '../tools.js';
import { openModal, button, setButtonBusy, showResult, showError, confirmDialog, escapeHtml } from './ui.js';
import { createPageView, loadPdfInto, makeDraggable } from './pageView.js';
import { askSignature } from './SignatureModal.js';
import { readBytes, pdfBlob, baseName } from '../utils/pdfHelper.js';
import { embedTextFont } from '../utils/fonts.js';
import { viewportPointToPdf, viewportRectToPdf } from '../utils/geometry.js';

const SYMBOL = { check: '✓', cross: '✗' };

function readFields(form) {
  return form.getFields().map((f) => {
    const name = f.getName();
    const base = { name, field: f, label: name.split('.').pop().replace(/[_-]+/g, ' ') };
    if (f instanceof PDFTextField) return { ...base, kind: 'text', value: f.getText() || '', multiline: f.isMultiline() };
    if (f instanceof PDFCheckBox) return { ...base, kind: 'check', value: f.isChecked() };
    if (f instanceof PDFDropdown || f instanceof PDFOptionList)
      return { ...base, kind: 'select', options: f.getOptions(), value: f.getSelected()[0] || '' };
    if (f instanceof PDFRadioGroup) return { ...base, kind: 'select', options: f.getOptions(), value: f.getSelected() || '' };
    return { ...base, kind: 'other' };
  }).filter((f) => f.kind !== 'other' && !f.field.isReadOnly());
}

export function openFillFormModal(initialFile = null) {
  const tool = getTool('fillForm');
  let dirty = false;
  const m = openModal({
    title: t('tools.fillForm.title'),
    subtitle: t('tools.fillForm.desc'),
    icon: tool.icon,
    color: tool.color,
    size: 'xl',
    confirmClose: () => (dirty ? confirmDialog({ title: t('common.discardTitle'), message: t('common.discardMessage'), okLabel: t('common.discard'), danger: true }) : true),
  });

  loadPdfInto(m, initialFile, async (file, pdfJsDoc) => {
    const bytes = await readBytes(file);
    let fields = [];
    try {
      fields = readFields((await PDFDocument.load(bytes, { updateMetadata: false })).getForm());
    } catch {
      fields = [];
    }

    let activeTool = 'text';
    let sizePt = 11;
    let color = '#111827';
    const elements = []; // { id, page, type, fx, fy, sizePt, value, color, fw?, ratio?, dataUrl? }

    // --- Campi interattivi
    if (fields.length) {
      const panel = document.createElement('details');
      panel.className = 'form-fields-panel';
      panel.open = true;
      panel.innerHTML = `<summary>${escapeHtml(t('fill.fieldsFound', { n: fields.length }))}</summary><div class="form-fields"></div>`;
      const list = panel.querySelector('.form-fields');
      fields.forEach((f, i) => {
        const id = `ff-${i}`;
        let control = '';
        if (f.kind === 'text') {
          control = f.multiline
            ? `<textarea id="${id}" class="text-input" rows="2">${escapeHtml(f.value)}</textarea>`
            : `<input id="${id}" class="text-input" value="${escapeHtml(f.value)}" />`;
        } else if (f.kind === 'check') {
          control = `<input id="${id}" type="checkbox" ${f.value ? 'checked' : ''} />`;
        } else {
          control = `<select id="${id}" class="select-input"><option value=""></option>${f.options
            .map((o) => `<option ${o === f.value ? 'selected' : ''}>${escapeHtml(o)}</option>`)
            .join('')}</select>`;
        }
        const row = document.createElement('label');
        row.className = f.kind === 'check' ? 'check-row' : 'field';
        row.innerHTML = f.kind === 'check' ? `${control} <span></span>` : `<span class="field-label"></span>${control}`;
        row.querySelector('span').textContent = f.label;
        row.querySelector(`#${id}`).addEventListener('input', () => (dirty = true));
        list.appendChild(row);
      });
      const flat = document.createElement('label');
      flat.className = 'check-row';
      flat.innerHTML = `<input type="checkbox" id="ff-flatten" /> <span>${escapeHtml(t('fill.lockFields'))}</span>`;
      list.appendChild(flat);
      m.body.appendChild(panel);
    } else {
      const note = document.createElement('p');
      note.className = 'muted-text';
      note.textContent = t('fill.noFields');
      m.body.appendChild(note);
    }

    // --- Barra strumenti per i moduli piatti
    const bar = document.createElement('div');
    bar.className = 'editor-toolbar';
    bar.innerHTML = `
      <div class="tool-group">
        ${['text', 'check', 'cross', 'date', 'signature']
          .map((id) => `<button class="editor-tool-btn ${id === activeTool ? 'active' : ''}" data-tool="${id}">${escapeHtml(t(`fill.${id}`))}</button>`)
          .join('')}
      </div>
      <div class="tool-group">
        <select class="select-input select-sm" id="fill-size" aria-label="${escapeHtml(t('fill.size'))}">
          ${[9, 11, 13, 16, 20].map((s) => `<option value="${s}" ${s === sizePt ? 'selected' : ''}>${s} pt</option>`).join('')}
        </select>
        <input type="color" id="fill-color" class="color-input" value="${color}" aria-label="${escapeHtml(t('opts.color'))}" />
      </div>`;
    m.body.appendChild(bar);
    const hint = document.createElement('p');
    hint.className = 'muted-text editor-hint';
    hint.textContent = t('fill.hint');
    m.body.appendChild(hint);

    bar.querySelectorAll('[data-tool]').forEach((b) =>
      b.addEventListener('click', () => {
        bar.querySelectorAll('[data-tool]').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        activeTool = b.dataset.tool;
      })
    );
    bar.querySelector('#fill-size').addEventListener('change', (e) => (sizePt = parseInt(e.target.value, 10)));
    bar.querySelector('#fill-color').addEventListener('input', (e) => (color = e.target.value));

    let pageWidthPt = 595;
    const view = createPageView(m.body, pdfJsDoc, {
      onPageRendered: async (v) => {
        pageWidthPt = (await v.getViewport1(v.pageNum)).width;
        renderElements();
      },
    });
    const layer = document.createElement('div');
    layer.className = 'fill-layer';
    view.overlay.appendChild(layer);

    layer.addEventListener('click', async (e) => {
      if (e.target !== layer) return;
      const { fx, fy } = view.toFraction(e);
      const base = { id: crypto.randomUUID?.() || String(Math.random()), page: view.pageNum, fx, fy, sizePt, color };
      if (activeTool === 'signature') {
        const dataUrl = await askSignature();
        if (!dataUrl) return;
        const img = new Image();
        img.src = dataUrl;
        await img.decode();
        elements.push({ ...base, type: 'image', dataUrl, fw: 0.25, ratio: img.height / img.width });
      } else if (activeTool === 'date') {
        elements.push({ ...base, type: 'text', value: new Date().toLocaleDateString(getLanguage()) });
      } else if (activeTool === 'text') {
        elements.push({ ...base, type: 'text', value: '', focus: true });
      } else {
        elements.push({ ...base, type: activeTool, value: SYMBOL[activeTool] });
      }
      dirty = true;
      renderElements();
    });

    function renderElements() {
      layer.innerHTML = '';
      const W = view.width;
      const H = view.height;
      const pxPerPt = W / pageWidthPt;
      for (const el of elements.filter((x) => x.page === view.pageNum)) {
        const node = document.createElement('div');
        node.className = `fill-elem fill-${el.type}`;
        node.style.left = `${el.fx * W}px`;
        node.style.top = `${el.fy * H}px`;
        if (el.type === 'image') {
          node.style.width = `${el.fw * W}px`;
          node.style.height = `${el.fw * W * el.ratio}px`;
          node.innerHTML = `<img src="${el.dataUrl}" alt="" draggable="false"/><span class="sig-resize"></span>`;
        } else if (el.type === 'text') {
          node.innerHTML = '<input class="fill-input" />';
          const input = node.querySelector('input');
          input.value = el.value;
          input.placeholder = t('fill.typeHere');
          Object.assign(input.style, { fontSize: `${el.sizePt * pxPerPt}px`, color: el.color });
          input.size = Math.max(4, el.value.length + 1);
          input.addEventListener('input', () => {
            el.value = input.value;
            input.size = Math.max(4, input.value.length + 1);
          });
          if (el.focus) {
            // Focus sincrono nel gesto dell'utente: su iOS è l'unico modo di aprire subito la tastiera
            delete el.focus;
            queueMicrotask(() => input.focus());
          }
        } else {
          node.innerHTML = `<span class="fill-symbol"></span>`;
          const s = node.querySelector('span');
          s.textContent = el.value;
          Object.assign(s.style, { fontSize: `${el.sizePt * 1.3 * pxPerPt}px`, color: el.color });
        }
        const del = document.createElement('button');
        del.className = 'fill-del';
        del.setAttribute('aria-label', t('common.remove'));
        del.innerHTML = '×';
        del.addEventListener('click', (ev) => {
          ev.stopPropagation();
          elements.splice(elements.indexOf(el), 1);
          renderElements();
        });
        const grip = document.createElement('span');
        grip.className = 'fill-grip';
        grip.setAttribute('aria-hidden', 'true');
        grip.innerHTML = '⠿';
        node.append(grip, del);
        let start;
        makeDraggable(el.type === 'image' ? node : grip, {
          onStart: () => (start = { fx: el.fx, fy: el.fy }),
          onMove: (dx, dy) => {
            el.fx = Math.max(0, Math.min(0.98, start.fx + dx / W));
            el.fy = Math.max(0, Math.min(0.98, start.fy + dy / H));
            node.style.left = `${el.fx * W}px`;
            node.style.top = `${el.fy * H}px`;
          },
        });
        if (el.type === 'image') {
          makeDraggable(node.querySelector('.sig-resize'), {
            onStart: () => (start = { fw: el.fw }),
            onMove: (dx) => {
              el.fw = Math.max(0.05, Math.min(0.9, start.fw + dx / W));
              node.style.width = `${el.fw * W}px`;
              node.style.height = `${el.fw * W * el.ratio}px`;
            },
          });
        }
        layer.appendChild(node);
      }
    }

    const cancel = button(t('common.cancel'));
    const save = button(t('actions.fillForm'), { variant: 'success' });
    cancel.onclick = () => m.requestClose();
    m.footer.append(cancel, save);

    save.onclick = async () => {
      setButtonBusy(save, true, t('common.processing'));
      try {
        const doc = await PDFDocument.load(bytes, { updateMetadata: false });
        const texts = elements.filter((e) => e.type !== 'image').map((e) => e.value);
        const fieldValues = fields.map((f, i) => {
          const input = m.body.querySelector(`#ff-${i}`);
          return input ? (f.kind === 'check' ? input.checked : input.value) : f.value;
        });
        const font = await embedTextFont(doc, [...texts, ...fieldValues.filter((v) => typeof v === 'string')].join(' ') + '✓✗');

        if (fields.length) {
          const form = doc.getForm();
          fields.forEach((f, i) => {
            const field = form.getField(f.name);
            const v = fieldValues[i];
            if (f.kind === 'text') field.setText(v || undefined);
            else if (f.kind === 'check') (v ? field.check() : field.uncheck());
            else if (v) field.select(v);
            else if (field.clear) field.clear();
          });
          form.updateFieldAppearances(font);
          if (m.body.querySelector('#ff-flatten')?.checked) form.flatten({ updateFieldAppearances: false });
        }

        for (const el of elements) {
          const vp = await view.getViewport1(el.page);
          const page = doc.getPage(el.page - 1);
          if (el.type === 'image') {
            const png = await doc.embedPng(await readBytes(await (await fetch(el.dataUrl)).blob()));
            const w = el.fw * vp.width;
            page.drawImage(png, viewportRectToPdf(vp, { x: el.fx * vp.width, y: el.fy * vp.height, width: w, height: w * el.ratio }));
            continue;
          }
          if (!el.value.trim()) continue;
          const size = el.type === 'text' ? el.sizePt : el.sizePt * 1.3;
          // Il riquadro sullo schermo parte dall'alto: la linea di base del testo è ~0,8 della dimensione più in basso
          const p = viewportPointToPdf(vp, el.fx * vp.width, el.fy * vp.height + size * 0.95);
          const h = el.color.replace('#', '');
          page.drawText(el.value, {
            x: p.x,
            y: p.y,
            size,
            font,
            rotate: p.rotate,
            color: rgb(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255),
          });
        }
        dirty = false;
        const blob = pdfBlob(await doc.save());
        m.close();
        showResult({ blob, filename: `${baseName(file.name)}_filled.pdf` });
      } catch (err) {
        showError(err);
        setButtonBusy(save, false, t('actions.fillForm'));
      }
    };
  });
  return m;
}
