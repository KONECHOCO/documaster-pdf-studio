// Strumenti "carica → opzioni → elabora": unisci, dividi, comprimi, ruota, filigrana, numeri di pagina,
// conversioni, OCR, protezione, sblocco, metadati, appiattimento.
import { t, getLanguage, formatBytes, formatNumber } from '../i18n/index.js';
import { getTool } from '../tools.js';
import {
  openModal,
  createDropzone,
  fileRow,
  button,
  setButtonBusy,
  createProgress,
  showResult,
  showError,
  escapeHtml,
  ICONS,
} from './ui.js';
import {
  mergePdfs,
  splitPdf,
  compressPdf,
  rotatePdf,
  addWatermarkToPdf,
  addPageNumbersToPdf,
  convertPdfToImages,
  imagesToPdfBlob,
  imageToCanvas,
  extractTextFromPdf,
  convertPdfToDocx,
  flattenPdf,
  protectPdf,
  readMetadata,
  writeMetadata,
  loadPdfLibDoc,
  baseName,
  isPdfFile,
  UserError,
} from '../utils/pdfHelper.js';
import { ocrPdf, ocrCanvasesToPdf, OCR_LANGS } from '../utils/ocr.js';

const MULTI = new Set(['merge', 'imgToPdf']);
const ACCEPT = { imgToPdf: 'image', ocr: 'pdf,image' };

export function openGenericToolModal(toolId, initialFiles = []) {
  const tool = getTool(toolId);
  const multiple = MULTI.has(toolId);
  const accept = ACCEPT[toolId] || 'pdf';
  let files = [];
  let pageCount = 0;

  const m = openModal({
    title: t(`tools.${toolId}.title`),
    subtitle: t(`tools.${toolId}.desc`),
    icon: tool.icon,
    color: tool.color,
    size: 'md',
  });

  const dropzone = createDropzone({ accept, multiple, onFiles: addFiles });
  const filesBox = document.createElement('div');
  filesBox.className = 'selected-files-list';
  const optionsBox = document.createElement('div');
  optionsBox.className = 'options-panel';
  optionsBox.hidden = true;
  const progress = createProgress();
  progress.el.hidden = true;
  m.body.append(dropzone, filesBox, optionsBox, progress.el);

  const actionBtn = button(t(`actions.${toolId}`), { variant: 'success', disabled: true });
  const cancelBtn = button(t('common.cancel'));
  cancelBtn.onclick = () => m.requestClose();
  m.footer.append(cancelBtn, actionBtn);

  async function addFiles(newFiles) {
    files = multiple ? [...files, ...newFiles] : [newFiles[0]];
    pageCount = 0;
    if (files.length === 1 && isPdfFile(files[0])) {
      try {
        pageCount = (await loadPdfLibDoc(files[0])).getPageCount();
      } catch (err) {
        showError(err);
        files = [];
      }
    }
    if (toolId === 'unlock' && files[0] && !files[0].wasEncrypted) {
      showError(new UserError('errors.notEncrypted'));
      files = [];
    }
    render();
  }

  function render() {
    dropzone.classList.toggle('dropzone-compact', files.length > 0);
    dropzone.hidden = files.length > 0 && !multiple;
    filesBox.innerHTML = '';
    files.forEach((file, index) => {
      const actions = `
        ${multiple && index > 0 ? `<button class="icon-btn" data-act="up" aria-label="${escapeHtml(t('common.moveUp'))}">${ICONS.up}</button>` : ''}
        ${multiple && index < files.length - 1 ? `<button class="icon-btn" data-act="down" aria-label="${escapeHtml(t('common.moveDown'))}">${ICONS.down}</button>` : ''}
        <button class="icon-btn danger" data-act="remove" aria-label="${escapeHtml(t('common.remove'))}">${ICONS.trash}</button>`;
      const row = fileRow(file, actions);
      if (!multiple && pageCount) {
        row.querySelector('.file-size').textContent = `${formatBytes(file.size)} · ${t('common.pagesCount', { n: pageCount })}`;
      }
      row.querySelector('[data-act="up"]')?.addEventListener('click', () => {
        [files[index - 1], files[index]] = [files[index], files[index - 1]];
        render();
      });
      row.querySelector('[data-act="down"]')?.addEventListener('click', () => {
        [files[index + 1], files[index]] = [files[index], files[index + 1]];
        render();
      });
      row.querySelector('[data-act="remove"]').addEventListener('click', () => {
        files.splice(index, 1);
        render();
      });
      filesBox.appendChild(row);
    });
    const ready = toolId === 'merge' ? files.length >= 2 : files.length > 0;
    actionBtn.disabled = !ready;
    if (toolId === 'merge' && files.length === 1) {
      const hint = document.createElement('p');
      hint.className = 'muted-text';
      hint.textContent = t('opts.mergeHint');
      filesBox.appendChild(hint);
    }
    renderOptions();
  }

  // ------------------------------------------------------------ Opzioni per strumento

  const field = (label, control, hint = '') => `
    <label class="field"><span class="field-label">${escapeHtml(label)}</span>${control}${hint ? `<span class="field-hint">${escapeHtml(hint)}</span>` : ''}</label>`;
  const select = (id, options, value) =>
    `<select id="${id}" class="select-input">${options.map(([v, l]) => `<option value="${escapeHtml(v)}" ${String(v) === String(value) ? 'selected' : ''}>${escapeHtml(l)}</option>`).join('')}</select>`;
  const radios = (name, options, value) =>
    `<div class="radio-list">${options
      .map(
        ([v, l, d]) => `
      <label class="radio-card"><input type="radio" name="${name}" value="${v}" ${v === value ? 'checked' : ''}/>
        <span><strong>${escapeHtml(l)}</strong>${d ? `<small>${escapeHtml(d)}</small>` : ''}</span></label>`
      )
      .join('')}</div>`;
  const rangeInput = (id, placeholder) =>
    `<input id="${id}" class="text-input" inputmode="numeric" autocomplete="off" placeholder="${escapeHtml(placeholder)}" />`;

  let optionsRendered = false;
  function renderOptions() {
    const visible = files.length > 0;
    optionsBox.hidden = !visible;
    if (!visible || optionsRendered) return;
    optionsRendered = true;
    const pages = pageCount ? t('opts.allPagesHint', { n: pageCount }) : '';
    let html = '';

    switch (toolId) {
      case 'split':
        html =
          radios(
            'split-mode',
            [
              ['range', t('opts.splitRange'), t('opts.splitRangeDesc')],
              ['each', t('opts.splitEach'), t('opts.splitEachDesc')],
              ['chunks', t('opts.splitChunks'), t('opts.splitChunksDesc')],
            ],
            'range'
          ) +
          `<div class="field-row">
            ${field(t('opts.pages'), rangeInput('split-range', '1-3, 5'), pages)}
            ${field(t('opts.chunkSize'), '<input id="split-chunk" class="text-input" type="number" min="1" value="2" />')}
          </div>`;
        break;
      case 'compress':
        html = radios(
          'comp-level',
          [
            ['recommended', t('opts.compRecommended'), t('opts.compRecommendedDesc')],
            ['extreme', t('opts.compExtreme'), t('opts.compExtremeDesc')],
            ['low', t('opts.compLow'), t('opts.compLowDesc')],
          ],
          'recommended'
        );
        break;
      case 'rotate':
        html = `<div class="segmented" id="rot-angle">
            <button type="button" data-angle="90" class="active">↻ 90°</button>
            <button type="button" data-angle="180">180°</button>
            <button type="button" data-angle="270">↺ 90°</button>
          </div>
          ${field(t('opts.pagesOptional'), rangeInput('rot-range', t('opts.allPages')), pages)}`;
        break;
      case 'watermark':
        html = `${field(t('opts.wmText'), `<input id="wm-text" class="text-input" value="${escapeHtml(t('opts.wmDefault'))}" maxlength="80" />`)}
          <div class="field-row">
            ${field(t('opts.wmLayout'), select('wm-layout', [['center', t('opts.wmCenter')], ['tile', t('opts.wmTile')]], 'center'))}
            ${field(t('opts.wmAngle'), select('wm-angle', [['45', '45°'], ['0', '0°'], ['-45', '-45°'], ['90', '90°']], '45'))}
          </div>
          <div class="field-row">
            ${field(t('opts.wmSize'), select('wm-size', [['32', 'S'], ['48', 'M'], ['72', 'L'], ['100', 'XL']], '48'))}
            ${field(t('opts.wmOpacity'), '<input id="wm-opacity" type="range" min="0.05" max="0.9" step="0.05" value="0.25" />')}
            ${field(t('opts.color'), '<input id="wm-color" type="color" value="#808080" class="color-input" />')}
          </div>`;
        break;
      case 'pageNumbers':
        html = `<div class="field-row">
            ${field(t('opts.pnFormat'), select('pn-format', [['{n}', '1'], ['{n} / {total}', '1 / 9'], [t('opts.pnPageOf'), t('opts.pnPageOf').replace('{n}', '1').replace('{total}', '9')], ['- {n} -', '- 1 -']], '{n}'))}
            ${field(t('opts.pnPosition'), select('pn-pos', [['bottom-center', t('opts.posBottomCenter')], ['bottom-right', t('opts.posBottomRight')], ['bottom-left', t('opts.posBottomLeft')], ['top-center', t('opts.posTopCenter')], ['top-right', t('opts.posTopRight')], ['top-left', t('opts.posTopLeft')]], 'bottom-center'))}
          </div>
          <div class="field-row">
            ${field(t('opts.pnStart'), '<input id="pn-start" class="text-input" type="number" min="0" value="1" />')}
            ${field(t('opts.wmSize'), select('pn-size', [['9', '9 pt'], ['11', '11 pt'], ['14', '14 pt'], ['18', '18 pt']], '11'))}
          </div>
          ${field(t('opts.pagesOptional'), rangeInput('pn-range', t('opts.allPages')), pages)}`;
        break;
      case 'pdfToImg':
        html = `<div class="field-row">
            ${field(t('opts.imgFormat'), select('img-fmt', [['jpg', 'JPG'], ['png', 'PNG']], 'jpg'))}
            ${field(t('opts.quality'), select('img-dpi', [['72', t('opts.dpiLow')], ['150', t('opts.dpiMedium')], ['300', t('opts.dpiHigh')]], '150'))}
          </div>
          ${field(t('opts.pagesOptional'), rangeInput('img-range', t('opts.allPages')), pages)}`;
        break;
      case 'imgToPdf':
        html = `<div class="field-row">
            ${field(t('opts.pageSize'), select('img-pagesize', [['a4', 'A4'], ['letter', 'US Letter'], ['fit', t('opts.pageFit')]], 'a4'))}
            ${field(t('opts.margin'), select('img-margin', [['20', t('opts.marginNormal')], ['0', t('opts.marginNone')], ['40', t('opts.marginWide')]], '20'))}
          </div>`;
        break;
      case 'ocr': {
        const lang = getLanguage();
        const defaults = new Set([lang, 'en']);
        html = `<p class="muted-text">${escapeHtml(t('opts.ocrInfo'))}</p>
          <div class="field-label">${escapeHtml(t('opts.ocrLangs'))}</div>
          <div class="chip-list">${Object.keys(OCR_LANGS)
            .map((c) => `<label class="chip"><input type="checkbox" name="ocr-lang" value="${c}" ${defaults.has(c) ? 'checked' : ''}/><span>${escapeHtml(t(`languages.${c}`))}</span></label>`)
            .join('')}</div>`;
        break;
      }
      case 'protect':
        html = `${field(t('opts.password'), '<input id="pw1" class="text-input" type="password" autocomplete="new-password" />')}
          ${field(t('opts.passwordConfirm'), '<input id="pw2" class="text-input" type="password" autocomplete="new-password" />')}
          <label class="check-row"><input type="checkbox" id="pw-show" /> <span>${escapeHtml(t('opts.showPassword'))}</span></label>
          <div class="field-label">${escapeHtml(t('opts.permissions'))}</div>
          <label class="check-row"><input type="checkbox" id="perm-print" checked /> <span>${escapeHtml(t('opts.permPrint'))}</span></label>
          <label class="check-row"><input type="checkbox" id="perm-copy" checked /> <span>${escapeHtml(t('opts.permCopy'))}</span></label>
          <label class="check-row"><input type="checkbox" id="perm-modify" checked /> <span>${escapeHtml(t('opts.permModify'))}</span></label>
          <p class="field-hint">${escapeHtml(t('opts.protectInfo'))}</p>`;
        break;
      case 'unlock':
        html = `<p class="muted-text">${escapeHtml(t('opts.unlockReady'))}</p>`;
        break;
      case 'metadata':
        html = `<div id="meta-fields">${['title', 'author', 'subject', 'keywords', 'creator']
          .map((k) => field(t(`opts.meta_${k}`), `<input id="meta-${k}" class="text-input" />`))
          .join('')}</div>
          <label class="check-row"><input type="checkbox" id="meta-clear" /> <span>${escapeHtml(t('opts.metaClear'))}</span></label>`;
        readMetadata(files[0])
          .then((meta) => {
            for (const [k, v] of Object.entries(meta)) {
              const input = optionsBox.querySelector(`#meta-${k}`);
              if (input) input.value = v;
            }
          })
          .catch(showError);
        break;
      case 'pdfToWord':
        html = `<p class="muted-text">${escapeHtml(t('opts.wordInfo'))}</p>`;
        break;
      case 'pdfToText':
        html = `<p class="muted-text">${escapeHtml(t('opts.textInfo'))}</p>`;
        break;
      case 'flatten':
        html = `<p class="muted-text">${escapeHtml(t('opts.flattenInfo'))}</p>`;
        break;
      default:
        html = '';
    }
    optionsBox.innerHTML = html;
    optionsBox.hidden = !html;

    // Comportamenti delle opzioni
    if (toolId === 'split') {
      const sync = () => {
        const mode = optionsBox.querySelector('input[name="split-mode"]:checked').value;
        optionsBox.querySelector('#split-range').closest('.field').hidden = mode !== 'range';
        optionsBox.querySelector('#split-chunk').closest('.field').hidden = mode !== 'chunks';
      };
      optionsBox.querySelectorAll('input[name="split-mode"]').forEach((r) => r.addEventListener('change', sync));
      sync();
    }
    if (toolId === 'rotate') {
      const btns = optionsBox.querySelectorAll('#rot-angle button');
      btns.forEach((b) =>
        b.addEventListener('click', () => {
          btns.forEach((x) => x.classList.remove('active'));
          b.classList.add('active');
        })
      );
    }
    if (toolId === 'protect') {
      optionsBox.querySelector('#pw-show').addEventListener('change', (e) => {
        optionsBox.querySelectorAll('#pw1, #pw2').forEach((i) => (i.type = e.target.checked ? 'text' : 'password'));
      });
    }
    if (toolId === 'metadata') {
      optionsBox.querySelector('#meta-clear').addEventListener('change', (e) => {
        optionsBox.querySelector('#meta-fields').classList.toggle('disabled', e.target.checked);
      });
    }
  }

  const val = (sel) => optionsBox.querySelector(sel)?.value ?? '';
  const checked = (sel) => !!optionsBox.querySelector(sel)?.checked;

  // ------------------------------------------------------------ Elaborazione

  async function run() {
    const file = files[0];
    const name = file ? baseName(file.name) : 'document';
    const onProgress = (f, phase) => {
      progress.el.hidden = false;
      progress.set(f, phase === 'download' ? t('progress.downloadingModel') : t('progress.working', { pct: Math.round(f * 100) }));
    };

    switch (toolId) {
      case 'merge':
        return { blob: await mergePdfs(files), filename: `${baseName(files[0].name)}_merged.pdf`, details: [t('result.mergedCount', { n: files.length })] };
      case 'split': {
        const mode = optionsBox.querySelector('input[name="split-mode"]:checked').value;
        return splitPdf(file, { mode, range: val('#split-range'), chunkSize: val('#split-chunk') });
      }
      case 'compress': {
        const level = optionsBox.querySelector('input[name="comp-level"]:checked').value;
        const r = await compressPdf(file, level, onProgress);
        const pct = Math.round((1 - r.compressedSize / r.originalSize) * 100);
        const details = r.alreadyOptimized
          ? [t('result.alreadyOptimized')]
          : [t('result.compressed', { from: formatBytes(r.originalSize), to: formatBytes(r.compressedSize), pct })];
        if (r.imagesTotal) details.push(t('result.imagesOptimized', { n: r.imagesReplaced, total: r.imagesTotal }));
        return { blob: r.blob, filename: `${name}_compressed.pdf`, details };
      }
      case 'rotate': {
        const angle = parseInt(optionsBox.querySelector('#rot-angle .active').dataset.angle, 10);
        return { blob: await rotatePdf(file, angle, val('#rot-range')), filename: `${name}_rotated.pdf` };
      }
      case 'watermark':
        return {
          blob: await addWatermarkToPdf(file, val('#wm-text'), {
            opacity: parseFloat(val('#wm-opacity')),
            angle: parseInt(val('#wm-angle'), 10),
            size: parseInt(val('#wm-size'), 10),
            color: val('#wm-color'),
            layout: val('#wm-layout'),
          }),
          filename: `${name}_watermark.pdf`,
        };
      case 'pageNumbers':
        return {
          blob: await addPageNumbersToPdf(file, {
            format: val('#pn-format'),
            position: val('#pn-pos'),
            start: parseInt(val('#pn-start'), 10) || 1,
            fontSize: parseInt(val('#pn-size'), 10),
            range: val('#pn-range'),
          }),
          filename: `${name}_numbered.pdf`,
        };
      case 'pdfToImg':
        return convertPdfToImages(file, { format: val('#img-fmt'), dpi: parseInt(val('#img-dpi'), 10), range: val('#img-range') }, onProgress);
      case 'imgToPdf': {
        const blob = await imagesToPdfBlob(
          files.map((f) => ({ blob: f })),
          { pageSize: val('#img-pagesize'), margin: parseInt(val('#img-margin'), 10) }
        );
        return { blob, filename: `${baseName(files[0].name)}.pdf`, details: [t('common.pagesCount', { n: files.length })] };
      }
      case 'ocr': {
        const langs = [...optionsBox.querySelectorAll('input[name="ocr-lang"]:checked')].map((c) => c.value);
        if (!langs.length) throw new UserError('errors.ocrNoLang');
        onProgress(0, 'download');
        if (isPdfFile(file)) {
          const r = await ocrPdf(file, { langs, onProgress });
          return { blob: r.blob, filename: `${name}_ocr.pdf`, details: [t('result.ocrPages', { n: r.pagesProcessed })] };
        }
        const canvas = await imageToCanvas(file, 2600);
        const r = await ocrCanvasesToPdf([canvas], { langs, pageSize: 'fit', margin: 0, onProgress });
        return { blob: r.blob, filename: `${name}_ocr.pdf`, details: [t('result.ocrPages', { n: 1 })] };
      }
      case 'pdfToText': {
        const r = await extractTextFromPdf(file, t('common.page'));
        if (!r.words) throw new UserError('errors.noTextLayer');
        const details = [t('result.words', { n: formatNumber(r.words) })];
        if (r.emptyPages) details.push(t('result.pagesWithoutText', { n: r.emptyPages }));
        return { blob: new Blob([r.fullText], { type: 'text/plain;charset=utf-8' }), filename: `${name}.txt`, details };
      }
      case 'pdfToWord':
        return convertPdfToDocx(file);
      case 'flatten':
        return { blob: await flattenPdf(file), filename: `${name}_flattened.pdf` };
      case 'protect': {
        const pw = val('#pw1');
        if (!pw) throw new UserError('errors.passwordEmpty');
        if (pw !== val('#pw2')) throw new UserError('errors.passwordMismatch');
        const blob = await protectPdf(file, pw, {
          print: checked('#perm-print'),
          copy: checked('#perm-copy'),
          modify: checked('#perm-modify'),
        });
        return { blob, filename: `${name}_protected.pdf`, details: [t('result.protected')] };
      }
      case 'unlock':
        // Il file è già stato decifrato al caricamento con la password inserita dall'utente
        return { blob: new Blob([await file.arrayBuffer()], { type: 'application/pdf' }), filename: `${name}_unlocked.pdf`, details: [t('result.unlocked')] };
      case 'metadata': {
        const meta = {};
        for (const k of ['title', 'author', 'subject', 'keywords', 'creator']) meta[k] = val(`#meta-${k}`);
        return { blob: await writeMetadata(file, meta, { removeAll: checked('#meta-clear') }), filename: `${name}.pdf` };
      }
      default:
        throw new Error(`Strumento sconosciuto: ${toolId}`);
    }
  }

  actionBtn.addEventListener('click', async () => {
    setButtonBusy(actionBtn, true, t('common.processing'));
    cancelBtn.disabled = true;
    try {
      const result = await run();
      m.close();
      showResult({ blob: result.blob, filename: result.filename, details: result.details || [] });
    } catch (err) {
      showError(err);
      progress.el.hidden = true;
      setButtonBusy(actionBtn, false, t(`actions.${toolId}`));
      cancelBtn.disabled = false;
    }
  });

  if (initialFiles.length) {
    const usable = initialFiles.filter((f) => (accept.includes('pdf') && isPdfFile(f)) || (accept.includes('image') && f.type?.startsWith('image/')));
    if (usable.length) addFiles(multiple ? usable : [usable[0]]);
  }
  return m;
}
