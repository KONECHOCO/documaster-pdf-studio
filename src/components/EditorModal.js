// Visual Interactive PDF Editor & Annotator
import { t } from '../i18n/translations.js';
import { fileToArrayBuffer, loadPdfJsDoc, renderPageToCanvas, loadPdfLibDoc } from '../utils/pdfHelper.js';
import { rgb, degrees, StandardFonts } from 'pdf-lib';
import confetti from 'canvas-confetti';

export function openEditorModal(initialFile = null, onClose) {
  let activeFile = initialFile;
  let pdfJsDoc = null;
  let currentPage = 1;
  let totalPages = 1;
  let activeTool = 'pen'; // 'pen', 'highlighter', 'text', 'rect', 'stamp'
  let strokeColor = '#ef4444';
  let strokeWidth = 3;
  let currentStamp = 'APPROVATO';
  let annotationsPerPage = {}; // pageNum -> array of action objects

  const modalEl = document.createElement('div');
  modalEl.className = 'modal-overlay active';
  modalEl.innerHTML = `
    <div class="modal-content" style="max-width: 1040px; height: 94vh;">
      <div class="modal-header">
        <div class="modal-title-group">
          <div class="modal-title-icon" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </div>
          <div>
            <h3 class="modal-title">${t('toolDetails.editorTitle')}</h3>
            <p class="modal-subtitle">${t('toolDetails.editorDesc')}</p>
          </div>
        </div>
        <button class="close-modal-btn" id="btn-close-editor">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body" id="editor-modal-body" style="display:flex; flex-direction:column; padding:1rem;">
        ${!activeFile ? `
          <div class="dropzone" id="editor-dropzone">
            <input type="file" id="editor-file-input" accept="application/pdf" style="display:none;" />
            <div class="dropzone-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <p class="dropzone-prompt">${t('common.uploadPrompt')}</p>
            <button class="btn btn-secondary" style="margin-top:0.85rem;" onclick="document.getElementById('editor-file-input').click()">
              ${t('common.browseFiles')}
            </button>
          </div>
        ` : `
          <div style="text-align:center; padding:3rem 0; color:var(--text-muted);">
            Caricamento visuale documento in corso...
          </div>
        `}
      </div>

      <div class="modal-footer">
        <div style="margin-right:auto; display:flex; align-items:center; gap:0.5rem;" id="page-nav-bar" style="display:none;">
          <button class="btn btn-secondary" id="btn-prev-page" style="padding:0.35rem 0.7rem; font-size:0.8rem;">◀</button>
          <span style="font-size:0.85rem; font-weight:600; color:var(--text-primary);" id="page-indicator">1 / 1</span>
          <button class="btn btn-secondary" id="btn-next-page" style="padding:0.35rem 0.7rem; font-size:0.8rem;">▶</button>
        </div>
        <button class="btn btn-secondary" id="btn-cancel-editor">${t('common.cancel')}</button>
        <button class="btn btn-success" id="btn-save-editor" disabled>
          ${t('toolDetails.applyEditor')}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  const bodyEl = modalEl.querySelector('#editor-modal-body');
  const btnClose = modalEl.querySelector('#btn-close-editor');
  const btnCancel = modalEl.querySelector('#btn-cancel-editor');
  const btnSave = modalEl.querySelector('#btn-save-editor');
  const pageNavBar = modalEl.querySelector('#page-nav-bar');
  const pageIndicator = modalEl.querySelector('#page-indicator');
  const btnPrevPage = modalEl.querySelector('#btn-prev-page');
  const btnNextPage = modalEl.querySelector('#btn-next-page');

  function bindUploadEvents() {
    const dropzone = modalEl.querySelector('#editor-dropzone');
    const fileInput = modalEl.querySelector('#editor-file-input');
    if (!dropzone || !fileInput) return;

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        activeFile = e.target.files[0];
        initEditor();
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
        initEditor();
      }
    });
  }

  async function initEditor() {
    try {
      const buffer = await fileToArrayBuffer(activeFile);
      pdfJsDoc = await loadPdfJsDoc(buffer);
      totalPages = pdfJsDoc.numPages;
      currentPage = 1;
      buildEditorUI();
      renderPage();
    } catch (err) {
      console.error('Error initializing editor:', err);
      bodyEl.innerHTML = `<div style="color:var(--danger); text-align:center; padding:2rem;">Errore caricamento: ${err.message}</div>`;
    }
  }

  function buildEditorUI() {
    pageNavBar.style.display = 'flex';
    btnSave.disabled = false;

    bodyEl.innerHTML = `
      <!-- Toolbar -->
      <div class="editor-toolbar">
        <button class="editor-tool-btn active" data-tool="pen">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          ${t('toolDetails.toolDraw')}
        </button>

        <button class="editor-tool-btn" data-tool="highlighter">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 2-7 7"/></svg>
          ${t('toolDetails.toolHighlight')}
        </button>

        <button class="editor-tool-btn" data-tool="text">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
          ${t('toolDetails.toolText')}
        </button>

        <button class="editor-tool-btn" data-tool="rect">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          ${t('toolDetails.toolShape')}
        </button>

        <!-- Stamp Selector -->
        <div style="display:flex; align-items:center; gap:0.35rem; margin-left:0.5rem;">
          <select id="stamp-selector" class="lang-select" style="padding:0.3rem 0.6rem; font-size:0.8rem;">
            <option value="APPROVATO">APPROVATO</option>
            <option value="CONFIDENZIALE">CONFIDENZIALE</option>
            <option value="BOZZA">BOZZA</option>
            <option value="PAGATO">PAGATO</option>
            <option value="URGENTE">URGENTE</option>
          </select>
          <button class="editor-tool-btn" data-tool="stamp">
            Timbro
          </button>
        </div>

        <!-- Color & Width Controls -->
        <div style="display:flex; align-items:center; gap:0.5rem; margin-left:auto;">
          <input type="color" id="editor-color-picker" value="${strokeColor}" style="width:28px; height:28px; border:none; background:none; cursor:pointer;" />
          <button class="btn btn-secondary" id="btn-clear-page" style="padding:0.35rem 0.65rem; font-size:0.75rem;">
            Cancella
          </button>
        </div>
      </div>

      <!-- Canvas Viewport -->
      <div class="editor-viewport" id="editor-viewport">
        <div style="position:relative;" id="canvas-container">
          <canvas id="pdf-base-canvas" class="editor-canvas-layer"></canvas>
          <canvas id="pdf-draw-canvas" style="position:absolute; top:0; left:0; pointer-events:auto; cursor:crosshair;"></canvas>
        </div>
      </div>
    `;

    // Bind Tool switching
    const toolBtns = bodyEl.querySelectorAll('.editor-tool-btn');
    toolBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        toolBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeTool = btn.getAttribute('data-tool');
      });
    });

    const stampSelect = bodyEl.querySelector('#stamp-selector');
    stampSelect.addEventListener('change', (e) => {
      currentStamp = e.target.value;
    });

    const colorPicker = bodyEl.querySelector('#editor-color-picker');
    colorPicker.addEventListener('input', (e) => {
      strokeColor = e.target.value;
    });

    bodyEl.querySelector('#btn-clear-page').addEventListener('click', () => {
      annotationsPerPage[currentPage] = [];
      const drawCanvas = bodyEl.querySelector('#pdf-draw-canvas');
      const ctx = drawCanvas.getContext('2d');
      ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    });
  }

  async function renderPage() {
    pageIndicator.textContent = `${t('common.page')} ${currentPage} ${t('common.of')} ${totalPages}`;
    btnPrevPage.disabled = currentPage <= 1;
    btnNextPage.disabled = currentPage >= totalPages;

    const baseCanvas = bodyEl.querySelector('#pdf-base-canvas');
    const drawCanvas = bodyEl.querySelector('#pdf-draw-canvas');
    if (!baseCanvas || !drawCanvas) return;

    // Render underlying PDF page
    const { canvas: rendered } = await renderPageToCanvas(pdfJsDoc, currentPage, 1.35);
    baseCanvas.width = rendered.width;
    baseCanvas.height = rendered.height;
    const baseCtx = baseCanvas.getContext('2d');
    baseCtx.drawImage(rendered, 0, 0);

    // Setup drawing canvas overlay
    drawCanvas.width = rendered.width;
    drawCanvas.height = rendered.height;
    const drawCtx = drawCanvas.getContext('2d');
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

    // Replay any existing annotations for this page
    if (annotationsPerPage[currentPage]) {
      redrawAnnotations(drawCtx, annotationsPerPage[currentPage]);
    }

    bindDrawingEvents(drawCanvas, drawCtx);
  }

  function bindDrawingEvents(drawCanvas, ctx) {
    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let currentPath = [];

    if (!annotationsPerPage[currentPage]) {
      annotationsPerPage[currentPage] = [];
    }

    drawCanvas.onmousedown = (e) => {
      const rect = drawCanvas.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      isDrawing = true;

      if (activeTool === 'pen' || activeTool === 'highlighter') {
        currentPath = [{ x: startX, y: startY }];
      } else if (activeTool === 'text') {
        const text = prompt('Inserisci testo da aggiungere sul PDF:');
        if (text) {
          annotationsPerPage[currentPage].push({
            type: 'text',
            text,
            x: startX,
            y: startY,
            color: strokeColor,
            size: 20,
          });
          redrawAnnotations(ctx, annotationsPerPage[currentPage]);
        }
        isDrawing = false;
      } else if (activeTool === 'stamp') {
        annotationsPerPage[currentPage].push({
          type: 'stamp',
          text: currentStamp,
          x: startX,
          y: startY,
        });
        redrawAnnotations(ctx, annotationsPerPage[currentPage]);
        isDrawing = false;
      }
    };

    drawCanvas.onmousemove = (e) => {
      if (!isDrawing) return;
      const rect = drawCanvas.getBoundingClientRect();
      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;

      if (activeTool === 'pen' || activeTool === 'highlighter') {
        currentPath.push({ x: curX, y: curY });
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = activeTool === 'highlighter' ? 18 : strokeWidth;
        ctx.globalAlpha = activeTool === 'highlighter' ? 0.35 : 1.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        const p1 = currentPath[currentPath.length - 2];
        const p2 = currentPath[currentPath.length - 1];
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    };

    drawCanvas.onmouseup = (e) => {
      if (!isDrawing) return;
      isDrawing = false;
      const rect = drawCanvas.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;

      if (activeTool === 'pen' || activeTool === 'highlighter') {
        annotationsPerPage[currentPage].push({
          type: activeTool,
          path: [...currentPath],
          color: strokeColor,
          width: activeTool === 'highlighter' ? 18 : strokeWidth,
          opacity: activeTool === 'highlighter' ? 0.35 : 1.0,
        });
      } else if (activeTool === 'rect') {
        annotationsPerPage[currentPage].push({
          type: 'rect',
          x: Math.min(startX, endX),
          y: Math.min(startY, endY),
          w: Math.abs(endX - startX),
          h: Math.abs(endY - startY),
          color: strokeColor,
          width: strokeWidth,
        });
        redrawAnnotations(ctx, annotationsPerPage[currentPage]);
      }
    };
  }

  function redrawAnnotations(ctx, items) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (const item of items) {
      if (item.type === 'pen' || item.type === 'highlighter') {
        if (item.path.length < 2) continue;
        ctx.save();
        ctx.strokeStyle = item.color;
        ctx.lineWidth = item.width;
        ctx.globalAlpha = item.opacity;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(item.path[0].x, item.path[0].y);
        for (let i = 1; i < item.path.length; i++) {
          ctx.lineTo(item.path[i].x, item.path[i].y);
        }
        ctx.stroke();
        ctx.restore();
      } else if (item.type === 'text') {
        ctx.save();
        ctx.fillStyle = item.color;
        ctx.font = `bold ${item.size}px 'Inter', sans-serif`;
        ctx.fillText(item.text, item.x, item.y);
        ctx.restore();
      } else if (item.type === 'rect') {
        ctx.save();
        ctx.strokeStyle = item.color;
        ctx.lineWidth = item.width;
        ctx.strokeRect(item.x, item.y, item.w, item.h);
        ctx.restore();
      } else if (item.type === 'stamp') {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(-0.15);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.fillRect(0, 0, 160, 48);
        ctx.strokeRect(0, 0, 160, 48);
        ctx.font = `bold 16px 'Outfit', sans-serif`;
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText(item.text, 80, 30);
        ctx.restore();
      }
    }
  }

  btnPrevPage.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  });

  btnNextPage.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderPage();
    }
  });

  // Save modified PDF
  btnSave.addEventListener('click', async () => {
    btnSave.disabled = true;
    btnSave.textContent = t('common.processing');

    try {
      const buffer = await fileToArrayBuffer(activeFile);
      const pdfDoc = await loadPdfLibDoc(buffer);

      // Merge drawing canvas annotations into each modified page
      for (let pNum = 1; pNum <= totalPages; pNum++) {
        const pageAnnotations = annotationsPerPage[pNum];
        if (!pageAnnotations || pageAnnotations.length === 0) continue;

        // Render annotations to a transparent PNG canvas
        const page = pdfDoc.getPage(pNum - 1);
        const { width: pWidth, height: pHeight } = page.getSize();

        const offCanvas = document.createElement('canvas');
        offCanvas.width = pWidth * 2;
        offCanvas.height = pHeight * 2;
        const offCtx = offCanvas.getContext('2d');
        offCtx.scale(2, 2);

        redrawAnnotations(offCtx, pageAnnotations);

        const pngUrl = offCanvas.toDataURL('image/png');
        const bin = atob(pngUrl.split(',')[1]);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

        const embeddedPng = await pdfDoc.embedPng(bytes);
        page.drawImage(embeddedPng, {
          x: 0,
          y: 0,
          width: pWidth,
          height: pHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DocuMaster_Edited_${activeFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      confetti({ particleCount: 70, spread: 60 });
      close();
    } catch (err) {
      console.error('Error saving edited PDF:', err);
      alert('Errore salvataggio: ' + err.message);
      btnSave.disabled = false;
      btnSave.textContent = t('toolDetails.applyEditor');
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
    initEditor();
  } else {
    bindUploadEvents();
  }
}
