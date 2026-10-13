// Organizza pagine: anteprime con sposta, ruota, duplica, elimina e inserisci pagina vuota.
import { t } from '../i18n/index.js';
import { getTool } from '../tools.js';
import { openModal, button, setButtonBusy, showResult, showError, createDropzone, loadingBlock, escapeHtml, ICONS } from './ui.js';
import { generateAllThumbnails, reorganizePdf, baseName } from '../utils/pdfHelper.js';

export function openOrganizeModal(initialFile = null) {
  const tool = getTool('organize');
  const m = openModal({ title: t('tools.organize.title'), subtitle: t('tools.organize.desc'), icon: tool.icon, color: tool.color, size: 'xl' });
  let file = null;
  let pages = [];
  let uid = 0;

  const cancel = button(t('common.cancel'));
  const save = button(t('actions.organize'), { variant: 'success', disabled: true });
  cancel.onclick = () => m.requestClose();
  m.footer.append(cancel, save);

  async function load(f) {
    file = f;
    m.body.innerHTML = '';
    m.body.appendChild(loadingBlock(t('common.loadingPages')));
    try {
      const { thumbnails } = await generateAllThumbnails(f);
      pages = thumbnails.map((th) => ({ id: ++uid, originalIndex: th.pageIndex, dataUrl: th.dataUrl, rotationDelta: 0 }));
      render();
    } catch (err) {
      showError(err);
      showPicker();
    }
  }

  function showPicker() {
    m.body.innerHTML = '';
    m.body.appendChild(createDropzone({ accept: 'pdf', onFiles: ([f]) => load(f) }));
  }

  function render() {
    save.disabled = pages.length === 0;
    m.body.innerHTML = `
      <div class="organize-bar">
        <span class="muted-text">${escapeHtml(t('organize.count', { n: pages.length }))}</span>
        <div class="tool-group">
          <button class="btn btn-secondary btn-sm" id="rot-all">${ICONS.rotate}<span>${escapeHtml(t('organize.rotateAll'))}</span></button>
          <button class="btn btn-secondary btn-sm" id="add-blank">${ICONS.plus}<span>${escapeHtml(t('organize.addBlank'))}</span></button>
        </div>
      </div>
      <div class="organize-grid"></div>`;
    const grid = m.body.querySelector('.organize-grid');
    pages.forEach((p, i) => {
      const card = document.createElement('div');
      card.className = 'organize-card';
      card.innerHTML = `
        <div class="organize-thumb">${p.blank ? '<div class="blank-page"></div>' : `<img src="${p.dataUrl}" alt="" style="transform:rotate(${p.rotationDelta}deg)" />`}</div>
        <span class="thumb-page-num">${i + 1}</span>
        <div class="organize-actions">
          <button class="icon-btn" data-a="left" aria-label="${escapeHtml(t('organize.moveLeft'))}" ${i === 0 ? 'disabled' : ''}>‹</button>
          <button class="icon-btn" data-a="rot" aria-label="${escapeHtml(t('organize.rotate'))}" ${p.blank ? 'disabled' : ''}>${ICONS.rotate}</button>
          <button class="icon-btn" data-a="dup" aria-label="${escapeHtml(t('organize.duplicate'))}">${ICONS.copy}</button>
          <button class="icon-btn danger" data-a="del" aria-label="${escapeHtml(t('common.remove'))}">${ICONS.trash}</button>
          <button class="icon-btn" data-a="right" aria-label="${escapeHtml(t('organize.moveRight'))}" ${i === pages.length - 1 ? 'disabled' : ''}>›</button>
        </div>`;
      card.querySelector('[data-a="left"]').onclick = () => {
        [pages[i - 1], pages[i]] = [pages[i], pages[i - 1]];
        render();
      };
      card.querySelector('[data-a="right"]').onclick = () => {
        [pages[i + 1], pages[i]] = [pages[i], pages[i + 1]];
        render();
      };
      card.querySelector('[data-a="rot"]').onclick = () => {
        p.rotationDelta = (p.rotationDelta + 90) % 360;
        card.querySelector('img').style.transform = `rotate(${p.rotationDelta}deg)`;
      };
      card.querySelector('[data-a="dup"]').onclick = () => {
        pages.splice(i + 1, 0, { ...p, id: ++uid });
        render();
      };
      card.querySelector('[data-a="del"]').onclick = () => {
        pages.splice(i, 1);
        render();
      };
      grid.appendChild(card);
    });
    m.body.querySelector('#rot-all').onclick = () => {
      pages.forEach((p) => (p.rotationDelta = (p.rotationDelta + 90) % 360));
      render();
    };
    m.body.querySelector('#add-blank').onclick = () => {
      pages.push({ id: ++uid, blank: true, rotationDelta: 0 });
      render();
    };
  }

  save.onclick = async () => {
    setButtonBusy(save, true, t('common.processing'));
    try {
      const blob = await reorganizePdf(file, pages);
      m.close();
      showResult({ blob, filename: `${baseName(file.name)}_organized.pdf`, details: [t('common.pagesCount', { n: pages.length })] });
    } catch (err) {
      showError(err);
      setButtonBusy(save, false, t('actions.organize'));
    }
  };

  if (initialFile) load(initialFile);
  else showPicker();
  return m;
}
