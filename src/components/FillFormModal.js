// Dedicated PDF Form Filling Component (Interactive AcroForms + Visual Fill & Sign)
import { t } from '../i18n/translations.js';
import { fileToArrayBuffer, loadPdfLibDoc, loadPdfJsDoc, renderPageToCanvas } from '../utils/pdfHelper.js';
import { rgb, StandardFonts } from 'pdf-lib';
import confetti from 'canvas-confetti';

export function openFillFormModal(initialFile = null, onClose) {
  let activeFile = initialFile;
  let pdfJsDoc = null;
  let pdfLibDoc = null;
  let currentPage = 1;
  let totalPages = 1;
  let nativeFields = []; // AcroForm fields
  let visualElements = {}; // pageNum -> Array of { id, type, x, y, value, fontSize, color }
  let activeTool = 'text'; // 'text', 'check', 'cross', 'date', 'sign'
  let activeFontSize = 14;
  let activeColor = '#090d16'; // default crisp black

  const modalEl = document.createElement('div');
  modalEl.className = 'modal-overlay active';
  modalEl.innerHTML = `
    <div class="modal-content" style="max-width: 1060px; height: 95vh;">
      <div class="modal-header">
        <div class="modal-title-group">
          <div class="modal-title-icon" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="9" y1="15" x2="15" y2="15"></line>
              <line x1="9" y1="11" x2="12" y2="11"></line>
            </svg>
          </div>
          <div>
            <h3 class="modal-title">${t('fillFormModal.title')}</h3>
            <p class="modal-subtitle">${t('fillFormModal.subtitle')}</p>
          </div>
        </div>
        <button class="close-modal-btn" id="btn-close-fillform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body" id="fillform-modal-body" style="display:flex; flex-direction:column; padding:1rem;">
        ${!activeFile ? `
          <div class="dropzone" id="fillform-dropzone">
            <input type="file" id="fillform-file-input" accept="application/pdf" style="display:none;" />
            <div class="dropzone-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <p class="dropzone-prompt">${t('common.uploadPrompt')}</p>
            <p class="dropzone-sub">Carica qualsiasi modulo da compilare (F24, contratti, domande, moduli digitali o scansionati)</p>
            <button class="btn btn-secondary" style="margin-top:0.85rem;" onclick="document.getElementById('fillform-file-input').click()">
              ${t('common.browseFiles')}
            </button>
          </div>
        ` : `
          <div style="text-align:center; padding:3rem 0; color:var(--text-muted);">
            Caricamento del modulo PDF in corso...
          </div>
        `}
      </div>

      <div class="modal-footer">
        <div style="margin-right:auto; display:flex; align-items:center; gap:0.5rem;" id="fill-nav-bar" style="display:none;">
          <button class="btn btn-secondary" id="btn-fill-prev" style="padding:0.35rem 0.7rem; font-size:0.8rem;">◀</button>
          <span style="font-size:0.85rem; font-weight:600; color:var(--text-primary);" id="fill-page-indicator">1 / 1</span>
          <button class="btn btn-secondary" id="btn-fill-next" style="padding:0.35rem 0.7rem; font-size:0.8rem;">▶</button>
        </div>
        <button class="btn btn-secondary" id="btn-cancel-fillform">${t('common.cancel')}</button>
        <button class="btn btn-success" id="btn-save-filled-pdf" disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          ${t('fillFormModal.downloadFilled')}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  const bodyEl = modalEl.querySelector('#fillform-modal-body');
  const btnClose = modalEl.querySelector('#btn-close-fillform');
  const btnCancel = modalEl.querySelector('#btn-cancel-fillform');
  const btnSave = modalEl.querySelector('#btn-save-filled-pdf');
  const fillNavBar = modalEl.querySelector('#fill-nav-bar');
  const fillPageIndicator = modalEl.querySelector('#fill-page-indicator');
  const btnFillPrev = modalEl.querySelector('#btn-fill-prev');
  const btnFillNext = modalEl.querySelector('#btn-fill-next');

  function bindUploadEvents() {
    const dropzone = modalEl.querySelector('#fillform-dropzone');
    const fileInput = modalEl.querySelector('#fillform-file-input');
    if (!dropzone || !fileInput) return;

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        activeFile = e.target.files[0];
        initFormFiller();
      }
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        activeFile = e.dataTransfer.files[0];
        initFormFiller();
      }
    });
  }

  async function initFormFiller() {
    bodyEl.innerHTML = `
      <div style="text-align:center; padding:3rem 0; display:flex; flex-direction:column; align-items:center; gap:1rem;">
        <div style="width:40px; height:40px; border:3px solid var(--border-color); border-top-color:var(--primary); border-radius:50%; animation:spin 1s infinite linear;"></div>
        <p style="font-weight:600; color:var(--text-primary);">Rilevamento campi modulo e preparazione visuale...</p>
      </div>
    `;

    try {
      const buf1 = await fileToArrayBuffer(activeFile);
      const buf2 = await fileToArrayBuffer(activeFile);
      pdfJsDoc = await loadPdfJsDoc(buf1);
      pdfLibDoc = await loadPdfLibDoc(buf2);
      totalPages = pdfJsDoc.numPages;
      currentPage = 1;

      // Detect AcroForms
      nativeFields = [];
      try {
        const form = pdfLibDoc.getForm();
        const fields = form.getFields();
        nativeFields = fields.map((f) => ({
          name: f.getName(),
          type: f.constructor.name,
        }));
      } catch {
        // No native form
      }

      buildFillerLayout();
      renderCurrentPage();
    } catch (err) {
      console.error('Error initializing form filler:', err);
      bodyEl.innerHTML = `<div style="color:var(--danger); padding:2rem; text-align:center;">Errore: ${err.message}</div>`;
    }
  }

  function buildFillerLayout() {
    fillNavBar.style.display = 'flex';
    btnSave.disabled = false;

    bodyEl.innerHTML = `
      <!-- Status Notice -->
      <div style="padding:0.6rem 0.9rem; border-radius:var(--radius-sm); margin-bottom:0.75rem; font-size:0.83rem; display:flex; align-items:center; gap:0.6rem; ${
        nativeFields.length > 0
          ? 'background:rgba(16,185,129,0.12); color:var(--success); border:1px solid rgba(16,185,129,0.25);'
          : 'background:rgba(99,102,241,0.12); color:var(--primary); border:1px solid rgba(99,102,241,0.25);'
      }">
        <span style="font-weight:700;">${nativeFields.length > 0 ? '✓' : 'ℹ'}</span>
        <span>${nativeFields.length > 0 ? `${t('fillFormModal.acroFound')} (${nativeFields.length} campi rilevati)` : t('fillFormModal.acroNotFound')}</span>
      </div>

      <!-- Quick-Fill Toolbar (Aa, ✓, ✗, Date, Sign) -->
      <div class="editor-toolbar" style="margin-bottom:0.75rem;">
        <button class="editor-tool-btn active" data-fill-tool="text">
          <span style="font-weight:700; font-size:1.05rem;">Aa</span>
          ${t('fillFormModal.toolText')}
        </button>

        <button class="editor-tool-btn" data-fill-tool="check">
          <span style="font-weight:700; color:var(--success); font-size:1.15rem;">✓</span>
          ${t('fillFormModal.toolCheck')}
        </button>

        <button class="editor-tool-btn" data-fill-tool="cross">
          <span style="font-weight:700; color:var(--danger); font-size:1.15rem;">✗</span>
          ${t('fillFormModal.toolCross')}
        </button>

        <button class="editor-tool-btn" data-fill-tool="date">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${t('fillFormModal.toolDate')}
        </button>

        <button class="editor-tool-btn" data-fill-tool="sign">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/><path d="M14 8c-2 2-3 4-3 6s1 2 2 2 3-1 3-3"/></svg>
          ${t('fillFormModal.toolSign')}
        </button>

        <!-- Font size & Color selector -->
        <div style="display:flex; align-items:center; gap:0.5rem; margin-left:auto;">
          <span style="font-size:0.8rem; color:var(--text-muted);">${t('fillFormModal.fontSize')}</span>
          <select id="fill-font-size" class="lang-select" style="padding:0.25rem 0.5rem; font-size:0.8rem;">
            <option value="11">11px</option>
            <option value="13">13px</option>
            <option value="15" selected>15px</option>
            <option value="18">18px</option>
            <option value="22">22px</option>
          </select>
          <input type="color" id="fill-color" value="${activeColor}" style="width:26px; height:26px; border:none; background:none; cursor:pointer;" />
          <button class="btn btn-secondary" id="btn-clear-page-fills" style="font-size:0.75rem; padding:0.25rem 0.6rem;">
            ${t('fillFormModal.clearAll')}
          </button>
        </div>
      </div>

      <!-- Document Viewport -->
      <div class="editor-viewport" id="fill-viewport" style="cursor:crosshair;">
        <div style="position:relative;" id="fill-canvas-wrapper">
          <canvas id="fill-base-canvas" class="editor-canvas-layer"></canvas>
          <!-- Interactive overlay div where text boxes, checkmarks and stamps live -->
          <div id="fill-overlay" style="position:absolute; inset:0; pointer-events:auto;"></div>
        </div>
      </div>
    `;

    // Bind Tool switching
    const toolBtns = bodyEl.querySelectorAll('[data-fill-tool]');
    toolBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        toolBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeTool = btn.getAttribute('data-fill-tool');
      });
    });

    const sizeSelect = bodyEl.querySelector('#fill-font-size');
    sizeSelect.addEventListener('change', (e) => {
      activeFontSize = parseInt(e.target.value, 10);
    });

    const colorPicker = bodyEl.querySelector('#fill-color');
    colorPicker.addEventListener('input', (e) => {
      activeColor = e.target.value;
    });

    bodyEl.querySelector('#btn-clear-page-fills').addEventListener('click', () => {
      visualElements[currentPage] = [];
      renderOverlayElements();
    });
  }

  async function renderCurrentPage() {
    fillPageIndicator.textContent = `${t('common.page')} ${currentPage} ${t('common.of')} ${totalPages}`;
    btnFillPrev.disabled = currentPage <= 1;
    btnFillNext.disabled = currentPage >= totalPages;

    const baseCanvas = bodyEl.querySelector('#fill-base-canvas');
    const overlay = bodyEl.querySelector('#fill-overlay');
    if (!baseCanvas || !overlay) return;

    // Render underlying PDF page
    const { canvas: rendered } = await renderPageToCanvas(pdfJsDoc, currentPage, 1.4);
    baseCanvas.width = rendered.width;
    baseCanvas.height = rendered.height;
    const ctx = baseCanvas.getContext('2d');
    ctx.drawImage(rendered, 0, 0);

    overlay.style.width = `${rendered.width}px`;
    overlay.style.height = `${rendered.height}px`;

    if (!visualElements[currentPage]) {
      visualElements[currentPage] = [];
    }

    renderOverlayElements();
    bindOverlayClick(overlay);
  }

  function bindOverlayClick(overlay) {
    overlay.onclick = (e) => {
      // If clicked on an existing input or element, let it handle
      if (e.target.closest('.fill-elem')) return;

      const rect = overlay.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const now = new Date();
      const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

      let val = '';
      if (activeTool === 'text') val = 'Testo';
      else if (activeTool === 'check') val = '✓';
      else if (activeTool === 'cross') val = '✗';
      else if (activeTool === 'date') val = formattedDate;
      else if (activeTool === 'sign') val = 'Firma / Sigillo';

      const elem = {
        id: Date.now() + Math.random(),
        type: activeTool,
        x: clickX,
        y: clickY - (activeTool === 'text' ? 12 : 16),
        value: val,
        fontSize: activeFontSize,
        color: activeColor,
      };

      visualElements[currentPage].push(elem);
      renderOverlayElements();

      // If text, focus the newly created input immediately!
      if (activeTool === 'text') {
        setTimeout(() => {
          const inp = overlay.querySelector(`[data-id="${elem.id}"] input`);
          if (inp) {
            inp.focus();
            inp.select();
          }
        }, 30);
      }
    };
  }

  function renderOverlayElements() {
    const overlay = bodyEl.querySelector('#fill-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';

    const list = visualElements[currentPage] || [];

    list.forEach((elem) => {
      const box = document.createElement('div');
      box.className = 'fill-elem';
      box.dataset.id = elem.id;
      box.style.position = 'absolute';
      box.style.left = `${elem.x}px`;
      box.style.top = `${elem.y}px`;
      box.style.display = 'flex';
      box.style.alignItems = 'center';
      box.style.gap = '2px';
      box.style.cursor = 'move';
      box.style.padding = '2px 4px';
      box.style.background = 'rgba(255, 255, 255, 0.85)';
      box.style.border = '1px solid rgba(99, 102, 241, 0.5)';
      box.style.borderRadius = '4px';
      box.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
      box.style.zIndex = '10';

      if (elem.type === 'text') {
        box.innerHTML = `
          <input 
            type="text" 
            value="${elem.value}" 
            style="border:none; outline:none; background:transparent; font-family:'Inter', sans-serif; font-size:${elem.fontSize}px; color:${elem.color}; font-weight:600; width:150px;" 
          />
          <button style="border:none; background:none; color:#ef4444; font-size:12px; cursor:pointer; padding:0 3px;" title="Elimina">×</button>
        `;
        const inp = box.querySelector('input');
        inp.oninput = (ev) => {
          elem.value = ev.target.value;
          // Auto adjust width
          inp.style.width = `${Math.max(60, ev.target.value.length * 9)}px`;
        };
      } else if (elem.type === 'check' || elem.type === 'cross') {
        const isCheck = elem.type === 'check';
        box.innerHTML = `
          <span style="font-weight:800; font-size:${elem.fontSize + 4}px; color:${isCheck ? '#10b981' : '#ef4444'}; line-height:1; user-select:none;">
            ${elem.value}
          </span>
          <button style="border:none; background:none; color:#ef4444; font-size:12px; cursor:pointer; padding:0 2px;" title="Elimina">×</button>
        `;
      } else if (elem.type === 'date') {
        box.innerHTML = `
          <input 
            type="text" 
            value="${elem.value}" 
            style="border:none; outline:none; background:transparent; font-family:'Inter', sans-serif; font-size:${elem.fontSize}px; color:${elem.color}; font-weight:600; width:100px;" 
          />
          <button style="border:none; background:none; color:#ef4444; font-size:12px; cursor:pointer; padding:0 3px;" title="Elimina">×</button>
        `;
        const inp = box.querySelector('input');
        inp.oninput = (ev) => (elem.value = ev.target.value);
      } else if (elem.type === 'sign') {
        box.innerHTML = `
          <span style="font-family:'Brush Script MT', 'Dancing Script', cursive; font-size:${elem.fontSize + 10}px; color:#1e3a8a; line-height:1; user-select:none; padding:0 4px;">
            ${elem.value}
          </span>
          <button style="border:none; background:none; color:#ef4444; font-size:12px; cursor:pointer; padding:0 2px;" title="Elimina">×</button>
        `;
      }

      // Delete button handler
      box.querySelector('button').onclick = (ev) => {
        ev.stopPropagation();
        visualElements[currentPage] = visualElements[currentPage].filter((it) => it.id !== elem.id);
        renderOverlayElements();
      };

      // Drag to reposition
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      box.onmousedown = (ev) => {
        if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'BUTTON') return;
        isDragging = true;
        startX = ev.clientX - box.offsetLeft;
        startY = ev.clientY - box.offsetTop;
      };

      window.onmousemove = (ev) => {
        if (!isDragging) return;
        const newX = ev.clientX - startX;
        const newY = ev.clientY - startY;
        box.style.left = `${newX}px`;
        box.style.top = `${newY}px`;
        elem.x = newX;
        elem.y = newY;
      };

      window.onmouseup = () => (isDragging = false);

      overlay.appendChild(box);
    });
  }

  // Page navigation
  btnFillPrev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderCurrentPage();
    }
  };

  btnFillNext.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderCurrentPage();
    }
  };

  // Save Filled PDF
  btnSave.onclick = async () => {
    btnSave.disabled = true;
    btnSave.textContent = t('common.processing');

    try {
      const buffer = await fileToArrayBuffer(activeFile);
      const targetPdfDoc = await loadPdfLibDoc(buffer);
      const font = await targetPdfDoc.embedFont(StandardFonts.HelveticaBold);

      const baseCanvas = bodyEl.querySelector('#fill-base-canvas');
      const canvasWidth = baseCanvas.width;
      const canvasHeight = baseCanvas.height;

      // Burn visual fill elements into each page
      for (let pNum = 1; pNum <= totalPages; pNum++) {
        const pageElems = visualElements[pNum];
        if (!pageElems || pageElems.length === 0) continue;

        const page = targetPdfDoc.getPage(pNum - 1);
        const { width: pWidth, height: pHeight } = page.getSize();
        const scaleX = pWidth / canvasWidth;
        const scaleY = pHeight / canvasHeight;

        for (const el of pageElems) {
          const pdfX = el.x * scaleX;
          // In PDF, Y origin is bottom-left
          const pdfY = (canvasHeight - (el.y + el.fontSize * 1.3)) * scaleY;
          const pdfFontSize = el.fontSize * scaleY;

          let hex = el.color.replace('#', '');
          let r = parseInt(hex.substring(0, 2), 16) / 255;
          let g = parseInt(hex.substring(2, 4), 16) / 255;
          let b = parseInt(hex.substring(4, 6), 16) / 255;

          if (el.type === 'check') {
            r = 0.05;
            g = 0.65;
            b = 0.35;
          } else if (el.type === 'cross') {
            r = 0.9;
            g = 0.15;
            b = 0.15;
          } else if (el.type === 'sign') {
            r = 0.1;
            g = 0.2;
            b = 0.6;
          }

          page.drawText(el.value, {
            x: pdfX,
            y: pdfY,
            size: pdfFontSize,
            font: font,
            color: rgb(r, g, b),
          });
        }
      }

      const pdfBytes = await targetPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DocuMaster_Compilato_${activeFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      confetti({ particleCount: 80, spread: 70 });
      close();
    } catch (err) {
      console.error('Error saving filled PDF:', err);
      alert('Errore durante il salvataggio del modulo compilato: ' + err.message);
      btnSave.disabled = false;
      btnSave.textContent = t('fillFormModal.downloadFilled');
    }
  };

  function close() {
    modalEl.classList.remove('active');
    setTimeout(() => {
      modalEl.remove();
      if (onClose) onClose();
    }, 250);
  }

  btnClose.onclick = close;
  btnCancel.onclick = close;

  if (activeFile) {
    initFormFiller();
  } else {
    bindUploadEvents();
  }
}
