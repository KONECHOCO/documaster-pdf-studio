// Visual Page Reorder, Rotate & Delete Organizer Modal
import { t } from '../i18n/translations.js';
import { generateAllThumbnails, reorganizePdf } from '../utils/pdfHelper.js';
import confetti from 'canvas-confetti';

export function openOrganizeModal(initialFile = null, onClose) {
  let activeFile = initialFile;
  let pageList = []; // Array of { id, originalIndex, pageNum, dataUrl, rotationDelta }

  const modalEl = document.createElement('div');
  modalEl.className = 'modal-overlay active';
  modalEl.innerHTML = `
    <div class="modal-content" style="max-width: 960px;">
      <div class="modal-header">
        <div class="modal-title-group">
          <div class="modal-title-icon" style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <div>
            <h3 class="modal-title">${t('tools.organize.title')}</h3>
            <p class="modal-subtitle">${t('tools.organize.desc')}</p>
          </div>
        </div>
        <button class="close-modal-btn" id="btn-close-organize">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body" id="organize-modal-body">
        ${!activeFile ? `
          <div class="dropzone" id="organize-dropzone">
            <input type="file" id="organize-file-input" accept="application/pdf" style="display:none;" />
            <div class="dropzone-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </div>
            <p class="dropzone-prompt">${t('common.uploadPrompt')}</p>
            <button class="btn btn-secondary" style="margin-top:0.85rem;" onclick="document.getElementById('organize-file-input').click()">
              ${t('common.browseFiles')}
            </button>
          </div>
        ` : `
          <div style="text-align:center; padding:3rem 0; color:var(--text-muted);">
            Caricamento e generazione anteprime pagine in corso...
          </div>
        `}
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" id="btn-cancel-organize">${t('common.cancel')}</button>
        <button class="btn btn-success" id="btn-save-organize" disabled>
          ${t('common.saveChanges')} & ${t('common.download')}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  const bodyEl = modalEl.querySelector('#organize-modal-body');
  const btnClose = modalEl.querySelector('#btn-close-organize');
  const btnCancel = modalEl.querySelector('#btn-cancel-organize');
  const btnSave = modalEl.querySelector('#btn-save-organize');

  function bindUploadEvents() {
    const dropzone = modalEl.querySelector('#organize-dropzone');
    const fileInput = modalEl.querySelector('#organize-file-input');
    if (!dropzone || !fileInput) return;

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        activeFile = e.target.files[0];
        loadThumbnails();
      }
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        activeFile = e.dataTransfer.files[0];
        loadThumbnails();
      }
    });
  }

  async function loadThumbnails() {
    bodyEl.innerHTML = `
      <div style="text-align:center; padding:3rem 0; display:flex; flex-direction:column; align-items:center; gap:1rem;">
        <div style="width:40px; height:40px; border:3px solid var(--border-color); border-top-color:var(--primary); border-radius:50%; animation:spin 1s infinite linear;"></div>
        <p style="font-weight:600; color:var(--text-primary);">Generazione anteprime pagine in corso...</p>
      </div>
    `;

    try {
      const result = await generateAllThumbnails(activeFile);
      pageList = result.thumbnails.map((item) => ({
        id: Math.random(),
        originalIndex: item.pageIndex,
        pageNum: item.pageNum,
        dataUrl: item.dataUrl,
        rotationDelta: 0,
      }));
      renderThumbnailsGrid();
    } catch (err) {
      console.error('Error generating thumbnails:', err);
      bodyEl.innerHTML = `<div style="color:var(--danger); text-align:center; padding:2rem;">Errore caricamento: ${err.message}</div>`;
    }
  }

  function renderThumbnailsGrid() {
    btnSave.disabled = pageList.length === 0;

    bodyEl.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
        <div>
          <span style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">
            ${t('common.dragToReorder')} (${pageList.length} ${t('common.pages')})
          </span>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-secondary" id="btn-rotate-all-cw" style="font-size:0.78rem; padding:0.35rem 0.75rem;">
            ↻ Ruota Tutte 90°
          </button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(135px, 1fr)); gap:1.1rem; padding:0.5rem 0;" id="organize-grid">
      </div>
    `;

    const grid = bodyEl.querySelector('#organize-grid');

    pageList.forEach((page, index) => {
      const card = document.createElement('div');
      card.className = 'scanned-thumb-card';
      card.style.width = '100%';
      card.style.height = '180px';
      card.style.position = 'relative';

      card.innerHTML = `
        <img src="${page.dataUrl}" style="transform: rotate(${page.rotationDelta}deg); transition: transform 0.2s;" alt="Page ${index + 1}" />
        <span class="thumb-page-num">${index + 1}</span>
        
        <div style="position:absolute; bottom:6px; left:6px; right:6px; display:flex; justify-content:space-between; gap:4px; z-index:5;">
          <!-- Move Left -->
          <button class="btn" style="padding:2px 5px; font-size:0.7rem; background:rgba(0,0,0,0.75); color:#fff; border:none;" title="Sposta a Sinistra" data-act="left">
            ◀
          </button>
          <!-- Rotate -->
          <button class="btn" style="padding:2px 5px; font-size:0.7rem; background:rgba(0,0,0,0.75); color:#fff; border:none;" title="Ruota 90°" data-act="rot">
            ↻
          </button>
          <!-- Move Right -->
          <button class="btn" style="padding:2px 5px; font-size:0.7rem; background:rgba(0,0,0,0.75); color:#fff; border:none;" title="Sposta a Destra" data-act="right">
            ▶
          </button>
          <!-- Delete -->
          <button class="btn" style="padding:2px 5px; font-size:0.7rem; background:rgba(239,68,68,0.85); color:#fff; border:none;" title="Elimina" data-act="del">
            ×
          </button>
        </div>
      `;

      // Actions
      card.querySelector('[data-act="left"]').addEventListener('click', () => {
        if (index > 0) {
          const temp = pageList[index - 1];
          pageList[index - 1] = pageList[index];
          pageList[index] = temp;
          renderThumbnailsGrid();
        }
      });

      card.querySelector('[data-act="right"]').addEventListener('click', () => {
        if (index < pageList.length - 1) {
          const temp = pageList[index + 1];
          pageList[index + 1] = pageList[index];
          pageList[index] = temp;
          renderThumbnailsGrid();
        }
      });

      card.querySelector('[data-act="rot"]').addEventListener('click', () => {
        page.rotationDelta = (page.rotationDelta + 90) % 360;
        card.querySelector('img').style.transform = `rotate(${page.rotationDelta}deg)`;
      });

      card.querySelector('[data-act="del"]').addEventListener('click', () => {
        pageList.splice(index, 1);
        renderThumbnailsGrid();
      });

      grid.appendChild(card);
    });

    modalEl.querySelector('#btn-rotate-all-cw').addEventListener('click', () => {
      pageList.forEach((p) => (p.rotationDelta = (p.rotationDelta + 90) % 360));
      renderThumbnailsGrid();
    });
  }

  btnSave.addEventListener('click', async () => {
    if (pageList.length === 0) return;
    btnSave.disabled = true;
    btnSave.textContent = t('common.processing');

    try {
      const specs = pageList.map((p) => ({
        originalIndex: p.originalIndex,
        rotationDelta: p.rotationDelta,
      }));

      const newPdfBlob = await reorganizePdf(activeFile, specs);
      const url = URL.createObjectURL(newPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DocuMaster_Organized_${activeFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      confetti({ particleCount: 70, spread: 60 });
      close();
    } catch (err) {
      console.error('Error reorganizing PDF:', err);
      alert('Errore: ' + err.message);
      btnSave.disabled = false;
      btnSave.textContent = t('common.saveChanges');
    }
  });

  function close() {
    modalEl.classList.remove('active');
    setTimeout(() => {
      modalEl.remove();
      if (onClose) onClose();
    }, 250);
  }

  btnClose.addEventListener('click', close);
  btnCancel.addEventListener('click', close);

  if (activeFile) {
    loadThumbnails();
  } else {
    bindUploadEvents();
  }
}
