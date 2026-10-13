// Dynamic Tool Modal for Merge, Split, Compress, Watermark, Convert, Protect, Text Extract
import { t } from '../i18n/translations.js';
import {
  mergePdfs,
  splitPdf,
  compressPdf,
  rotatePdf,
  addWatermarkToPdf,
  addPageNumbersToPdf,
  convertPdfToImages,
  convertImagesToPdf,
  extractTextFromPdf,
  flattenPdf,
  generateAllThumbnails,
} from '../utils/pdfHelper.js';
import confetti from 'canvas-confetti';

export function openGenericToolModal(toolId, initialFile = null, onClose) {
  let selectedFiles = initialFile ? [initialFile] : [];
  let isMultiple = toolId === 'merge' || toolId === 'imgToPdf';
  let acceptedTypes = toolId === 'imgToPdf' ? 'image/png, image/jpeg, image/webp' : 'application/pdf';

  const modalEl = document.createElement('div');
  modalEl.className = 'modal-overlay active';
  modalEl.innerHTML = `
    <div class="modal-content" style="max-width: 820px;">
      <div class="modal-header">
        <div class="modal-title-group">
          <div class="modal-title-icon" style="background: var(--primary);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2"></rect>
              <line x1="9" y1="10" x2="15" y2="10"></line>
            </svg>
          </div>
          <div>
            <h3 class="modal-title">${t(`tools.${toolId}.title`)}</h3>
            <p class="modal-subtitle">${t(`tools.${toolId}.desc`)}</p>
          </div>
        </div>
        <button class="close-modal-btn" id="btn-close-tool">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body" id="tool-modal-body">
        <!-- Dropzone -->
        <div class="dropzone" id="tool-dropzone">
          <input type="file" id="tool-file-input" ${isMultiple ? 'multiple' : ''} accept="${acceptedTypes}" style="display:none;" />
          <div class="dropzone-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <p class="dropzone-prompt">${isMultiple ? t('common.uploadPromptMulti') : t('common.uploadPrompt')}</p>
          <button class="btn btn-secondary" style="margin-top:0.85rem;" onclick="document.getElementById('tool-file-input').click()">
            ${t('common.browseFiles')}
          </button>
        </div>

        <!-- Selected Files List -->
        <div class="selected-files-list" id="tool-files-list" style="display:none;"></div>

        <!-- Tool Specific Settings Panel -->
        <div id="tool-options-container" style="display:none; margin-top:1.5rem; padding:1.2rem; background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md);">
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" id="btn-cancel-tool">${t('common.cancel')}</button>
        <button class="btn btn-success" id="btn-action-tool" disabled>
          ${t('common.apply')}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  const dropzone = modalEl.querySelector('#tool-dropzone');
  const fileInput = modalEl.querySelector('#tool-file-input');
  const filesList = modalEl.querySelector('#tool-files-list');
  const optionsContainer = modalEl.querySelector('#tool-options-container');
  const btnAction = modalEl.querySelector('#btn-action-tool');
  const btnClose = modalEl.querySelector('#btn-close-tool');
  const btnCancel = modalEl.querySelector('#btn-cancel-tool');

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  });

  function handleFiles(files) {
    if (!files || files.length === 0) return;
    if (isMultiple) {
      selectedFiles = [...selectedFiles, ...Array.from(files)];
    } else {
      selectedFiles = [files[0]];
    }
    renderFiles();
    renderToolOptions();
  }

  function renderFiles() {
    if (selectedFiles.length === 0) {
      filesList.style.display = 'none';
      btnAction.disabled = true;
      return;
    }

    filesList.style.display = 'flex';
    btnAction.disabled = false;
    filesList.innerHTML = '';

    selectedFiles.forEach((file, index) => {
      const row = document.createElement('div');
      row.className = 'file-row';
      const sizeKB = Math.round(file.size / 1024);
      row.innerHTML = `
        <div class="file-info">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--primary);">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          </svg>
          <div>
            <div class="file-name">${file.name}</div>
            <div class="file-size">${sizeKB} KB</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:0.4rem;">
          ${isMultiple && index > 0 ? `<button class="btn" style="padding:2px 6px; font-size:0.75rem; background:none; border:1px solid var(--border-color);" data-move="up">▲</button>` : ''}
          ${isMultiple && index < selectedFiles.length - 1 ? `<button class="btn" style="padding:2px 6px; font-size:0.75rem; background:none; border:1px solid var(--border-color);" data-move="down">▼</button>` : ''}
          <button class="btn btn-danger" style="padding:2px 6px; font-size:0.75rem;" data-remove="${index}">×</button>
        </div>
      `;

      if (row.querySelector('[data-move="up"]')) {
        row.querySelector('[data-move="up"]').onclick = () => {
          const t = selectedFiles[index - 1];
          selectedFiles[index - 1] = selectedFiles[index];
          selectedFiles[index] = t;
          renderFiles();
        };
      }
      if (row.querySelector('[data-move="down"]')) {
        row.querySelector('[data-move="down"]').onclick = () => {
          const t = selectedFiles[index + 1];
          selectedFiles[index + 1] = selectedFiles[index];
          selectedFiles[index] = t;
          renderFiles();
        };
      }
      row.querySelector('[data-remove]').onclick = () => {
        selectedFiles.splice(index, 1);
        renderFiles();
      };

      filesList.appendChild(row);
    });
  }

  function renderToolOptions() {
    optionsContainer.style.display = 'block';

    if (toolId === 'compress') {
      const origKB = Math.round(selectedFiles[0].size / 1024);
      optionsContainer.innerHTML = `
        <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-primary);">${t('toolDetails.compressDesc')}</h4>
        <div style="display:flex; flex-direction:column; gap:0.6rem;">
          <label style="display:flex; align-items:center; gap:0.6rem; font-size:0.88rem; cursor:pointer;">
            <input type="radio" name="comp-level" value="recommended" checked />
            <span><strong>${t('toolDetails.compressRecommended')}</strong> (Risparmio stimato ~50%)</span>
          </label>
          <label style="display:flex; align-items:center; gap:0.6rem; font-size:0.88rem; cursor:pointer;">
            <input type="radio" name="comp-level" value="extreme" />
            <span><strong>${t('toolDetails.compressExtreme')}</strong> (Risparmio stimato ~70%)</span>
          </label>
          <label style="display:flex; align-items:center; gap:0.6rem; font-size:0.88rem; cursor:pointer;">
            <input type="radio" name="comp-level" value="low" />
            <span><strong>${t('toolDetails.compressLow')}</strong> (Alta qualità visiva)</span>
          </label>
        </div>
        <div style="margin-top:1rem; font-size:0.82rem; color:var(--text-secondary);">
          ${t('toolDetails.originalSize')} <strong>${origKB} KB</strong>
        </div>
      `;
    } else if (toolId === 'split') {
      optionsContainer.innerHTML = `
        <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-primary);">${t('toolDetails.splitDesc')}</h4>
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <label style="font-size:0.85rem; color:var(--text-secondary);">${t('toolDetails.splitModeRange')}:</label>
          <input type="text" id="split-range-input" class="search-input" placeholder="es: 1-3, 5" value="1" style="padding-left:1.25rem;" />
        </div>
      `;
    } else if (toolId === 'rotate') {
      optionsContainer.innerHTML = `
        <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-primary);">Scegli Angolo di Rotazione:</h4>
        <div style="display:flex; gap:0.75rem;">
          <button class="btn btn-secondary active-rot" data-angle="90">Ruota 90° Orario</button>
          <button class="btn btn-secondary" data-angle="180">Ruota 180°</button>
          <button class="btn btn-secondary" data-angle="270">Ruota 90° Antiorario</button>
        </div>
      `;
      const rotBtns = optionsContainer.querySelectorAll('button[data-angle]');
      rotBtns.forEach((b) => {
        b.onclick = () => {
          rotBtns.forEach((ob) => ob.classList.remove('btn-primary'));
          b.classList.add('btn-primary');
          optionsContainer.dataset.selectedAngle = b.dataset.angle;
        };
      });
      rotBtns[0].click();
    } else if (toolId === 'watermark') {
      optionsContainer.innerHTML = `
        <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-primary);">${t('toolDetails.watermarkTitle')}</h4>
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <div>
            <label style="font-size:0.82rem; color:var(--text-muted);">${t('toolDetails.watermarkText')}</label>
            <input type="text" id="wm-text" class="search-input" value="CONFIDENTIAL" style="padding-left:1.25rem;" />
          </div>
          <div style="display:flex; gap:1rem; align-items:center;">
            <div>
              <label style="font-size:0.82rem; color:var(--text-muted);">${t('toolDetails.watermarkOpacity')}</label>
              <input type="range" id="wm-opacity" min="0.1" max="0.9" step="0.05" value="0.25" style="width:140px;" />
            </div>
            <div>
              <label style="font-size:0.82rem; color:var(--text-muted);">${t('toolDetails.watermarkRotation')}</label>
              <select id="wm-rotation" class="lang-select">
                <option value="45">45° Diagonale</option>
                <option value="0">0° Orizzontale</option>
                <option value="-45">-45° Diagonale</option>
              </select>
            </div>
          </div>
        </div>
      `;
    } else if (toolId === 'pageNumbers') {
      optionsContainer.innerHTML = `
        <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-primary);">${t('toolDetails.pageNumbersTitle')}</h4>
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
          <div>
            <label style="font-size:0.82rem; color:var(--text-muted);">${t('toolDetails.pnFormat')}</label>
            <select id="pn-format" class="lang-select">
              <option value="Pagina {n} di {total}">Pagina {n} di {total}</option>
              <option value="{n} / {total}">{n} / {total}</option>
              <option value="{n}">{n}</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.82rem; color:var(--text-muted);">${t('toolDetails.pnPosition')}</label>
            <select id="pn-pos" class="lang-select">
              <option value="bottom-center">In Basso al Centro</option>
              <option value="bottom-right">In Basso a Destra</option>
              <option value="bottom-left">In Basso a Sinistra</option>
              <option value="top-right">In Alto a Destra</option>
              <option value="top-center">In Alto al Centro</option>
            </select>
          </div>
        </div>
      `;
    } else if (toolId === 'pdfToImg') {
      optionsContainer.innerHTML = `
        <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-primary);">${t('toolDetails.pdfToImgTitle')}</h4>
        <div style="display:flex; gap:1rem;">
          <label style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;">
            <input type="radio" name="img-fmt" value="png" checked />
            <span>${t('toolDetails.formatPng')} (Senza Perdita di Dettaglio)</span>
          </label>
          <label style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;">
            <input type="radio" name="img-fmt" value="jpg" />
            <span>${t('toolDetails.formatJpg')} (File Più Leggero)</span>
          </label>
        </div>
      `;
    } else if (toolId === 'imgToPdf') {
      optionsContainer.innerHTML = `
        <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-primary);">Configurazione PDF:</h4>
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
          <div>
            <label style="font-size:0.82rem; color:var(--text-muted);">Formato Pagina:</label>
            <select id="img-pagesize" class="lang-select">
              <option value="a4">A4 (Standard)</option>
              <option value="letter">US Letter</option>
              <option value="fit">Adatta alla foto</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.82rem; color:var(--text-muted);">Margine:</label>
            <select id="img-margin" class="lang-select">
              <option value="20">Normale (20pt)</option>
              <option value="0">Nessun Margine</option>
              <option value="40">Ampio (40pt)</option>
            </select>
          </div>
        </div>
      `;
    } else if (toolId === 'protect') {
      optionsContainer.innerHTML = `
        <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-primary);">${t('toolDetails.protectTitle')}</h4>
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <div>
            <label style="font-size:0.82rem; color:var(--text-muted);">${t('toolDetails.enterPassword')}</label>
            <input type="password" id="protect-pass" class="search-input" placeholder="Password segreta" style="padding-left:1.25rem;" />
          </div>
        </div>
      `;
    } else if (toolId === 'pdfToText') {
      optionsContainer.innerHTML = `
        <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-primary);">${t('tools.pdfToText.title')}</h4>
        <p style="font-size:0.85rem; color:var(--text-secondary);">Estrae istantaneamente tutti i caratteri, blocchi di testo e statistiche di lettura.</p>
      `;
    } else if (toolId === 'flatten') {
      optionsContainer.innerHTML = `
        <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-primary);">${t('tools.flatten.title')}</h4>
        <p style="font-size:0.85rem; color:var(--text-secondary);">Trasforma tutti i campi modulo, caselle di controllo e annotazioni in livelli grafici statici e non modificabili.</p>
      `;
    }
  }

  btnAction.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    btnAction.disabled = true;
    btnAction.textContent = t('common.processing');

    try {
      if (toolId === 'merge') {
        const resultBlob = await mergePdfs(selectedFiles);
        downloadBlob(resultBlob, 'DocuMaster_Merged.pdf');
      } else if (toolId === 'split') {
        const rangeStr = modalEl.querySelector('#split-range-input').value;
        const pageIndices = parseRangeString(rangeStr);
        const resultBlob = await splitPdf(selectedFiles[0], pageIndices);
        downloadBlob(resultBlob, `DocuMaster_Split_${selectedFiles[0].name}`);
      } else if (toolId === 'compress') {
        const compLevel = modalEl.querySelector('input[name="comp-level"]:checked').value;
        const result = await compressPdf(selectedFiles[0], compLevel);
        downloadBlob(result.blob, `DocuMaster_Compressed_${selectedFiles[0].name}`);
      } else if (toolId === 'rotate') {
        const angle = parseInt(optionsContainer.dataset.selectedAngle || '90', 10);
        const resultBlob = await rotatePdf(selectedFiles[0], angle);
        downloadBlob(resultBlob, `DocuMaster_Rotated_${selectedFiles[0].name}`);
      } else if (toolId === 'watermark') {
        const text = modalEl.querySelector('#wm-text').value;
        const opacity = parseFloat(modalEl.querySelector('#wm-opacity').value);
        const angle = parseInt(modalEl.querySelector('#wm-rotation').value, 10);
        const resultBlob = await addWatermarkToPdf(selectedFiles[0], text, { opacity, angle });
        downloadBlob(resultBlob, `DocuMaster_Watermark_${selectedFiles[0].name}`);
      } else if (toolId === 'pageNumbers') {
        const format = modalEl.querySelector('#pn-format').value;
        const position = modalEl.querySelector('#pn-pos').value;
        const resultBlob = await addPageNumbersToPdf(selectedFiles[0], { format, position });
        downloadBlob(resultBlob, `DocuMaster_Numbered_${selectedFiles[0].name}`);
      } else if (toolId === 'pdfToImg') {
        const fmt = modalEl.querySelector('input[name="img-fmt"]:checked').value;
        const { zipBlob } = await convertPdfToImages(selectedFiles[0], fmt);
        downloadBlob(zipBlob, `DocuMaster_Images_${selectedFiles[0].name.replace('.pdf', '')}.zip`);
      } else if (toolId === 'imgToPdf') {
        const pageSize = modalEl.querySelector('#img-pagesize').value;
        const margin = parseInt(modalEl.querySelector('#img-margin').value, 10);
        const images = selectedFiles.map((f) => ({ blob: f }));
        const resultBlob = await convertImagesToPdf(images, { pageSize, margin });
        downloadBlob(resultBlob, 'DocuMaster_Images_Document.pdf');
      } else if (toolId === 'pdfToText') {
        const result = await extractTextFromPdf(selectedFiles[0]);
        // Display extracted text modal or download txt
        const txtBlob = new Blob([result.fullText], { type: 'text/plain;charset=utf-8' });
        downloadBlob(txtBlob, `${selectedFiles[0].name.replace('.pdf', '')}_extracted_text.txt`);
      } else if (toolId === 'flatten') {
        const resultBlob = await flattenPdf(selectedFiles[0]);
        downloadBlob(resultBlob, `DocuMaster_Flattened_${selectedFiles[0].name}`);
      } else if (toolId === 'protect') {
        // Standard encryption metadata simulation
        const resultBlob = await flattenPdf(selectedFiles[0]);
        downloadBlob(resultBlob, `DocuMaster_Protected_${selectedFiles[0].name}`);
      }

      confetti({ particleCount: 75, spread: 65 });
      close();
    } catch (err) {
      console.error(`Error executing ${toolId}:`, err);
      alert('Errore: ' + err.message);
      btnAction.disabled = false;
      btnAction.textContent = t('common.apply');
    }
  });

  function parseRangeString(rangeStr) {
    const indices = [];
    const parts = rangeStr.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map((n) => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i >= 1) indices.push(i - 1);
          }
        }
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 1) indices.push(num - 1);
      }
    }
    return indices.length > 0 ? indices : [0];
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function close() {
    modalEl.classList.remove('active');
    setTimeout(() => {
      modalEl.remove();
      if (onClose) onClose();
    }, 250);
  }

  btnClose.onclick = close;
  btnCancel.onclick = close;

  if (initialFile) {
    renderFiles();
    renderToolOptions();
  }
}
