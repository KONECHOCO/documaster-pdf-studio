// Electronic Signature (eSign) Modal: Draw, Type, Upload & Place onto PDF
import { t } from '../i18n/translations.js';
import { fileToArrayBuffer, loadPdfLibDoc, loadPdfJsDoc, renderPageToCanvas } from '../utils/pdfHelper.js';
import confetti from 'canvas-confetti';

export function openSignatureModal(initialFile = null, onClose) {
  let activeFile = initialFile;
  let activeTab = 'draw'; // 'draw', 'type', 'upload'
  let signatureDataUrl = null;
  let pdfJsDoc = null;
  let currentPage = 1;
  let totalPages = 1;
  let sigPos = { x: 50, y: 50, width: 180, height: 70 };
  let inkColor = '#1e3a8a'; // Royal Navy Blue

  const modalEl = document.createElement('div');
  modalEl.className = 'modal-overlay active';
  modalEl.innerHTML = `
    <div class="modal-content" style="max-width: 900px;">
      <div class="modal-header">
        <div class="modal-title-group">
          <div class="modal-title-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
              <path d="M14 8c-2 2-3 4-3 6s1 2 2 2 3-1 3-3"></path>
            </svg>
          </div>
          <div>
            <h3 class="modal-title">${t('toolDetails.signTitle')}</h3>
            <p class="modal-subtitle">${t('toolDetails.signDesc')}</p>
          </div>
        </div>
        <button class="close-modal-btn" id="btn-close-sign">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body" id="sign-modal-body">
        ${!activeFile ? `
          <div class="dropzone" id="sign-dropzone">
            <input type="file" id="sign-file-input" accept="application/pdf" style="display:none;" />
            <div class="dropzone-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <p class="dropzone-prompt">${t('common.uploadPrompt')}</p>
            <button class="btn btn-secondary" style="margin-top:0.85rem;" onclick="document.getElementById('sign-file-input').click()">
              ${t('common.browseFiles')}
            </button>
          </div>
        ` : `
          <div style="text-align:center; padding:2rem 0; color:var(--text-muted);">
            Inizializzazione documento...
          </div>
        `}
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" id="btn-cancel-sign">${t('common.cancel')}</button>
        <button class="btn btn-success" id="btn-burn-signature" disabled>
          ${t('common.download')} PDF Firmato
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  const bodyEl = modalEl.querySelector('#sign-modal-body');
  const btnClose = modalEl.querySelector('#btn-close-sign');
  const btnCancel = modalEl.querySelector('#btn-cancel-sign');
  const btnBurn = modalEl.querySelector('#btn-burn-signature');

  function bindUploadEvents() {
    const dropzone = modalEl.querySelector('#sign-dropzone');
    const fileInput = modalEl.querySelector('#sign-file-input');
    if (!dropzone || !fileInput) return;

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        activeFile = e.target.files[0];
        initSignFlow();
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
        initSignFlow();
      }
    });
  }

  async function initSignFlow() {
    try {
      const buffer = await fileToArrayBuffer(activeFile);
      pdfJsDoc = await loadPdfJsDoc(buffer);
      totalPages = pdfJsDoc.numPages;
      currentPage = 1;
      renderSignaturePad();
    } catch (err) {
      console.error('Error loading PDF for signing:', err);
      bodyEl.innerHTML = `<div style="color:var(--danger); padding:2rem; text-align:center;">Errore: ${err.message}</div>`;
    }
  }

  function renderSignaturePad() {
    bodyEl.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:1.25rem;">
        <!-- Tabs -->
        <div style="display:flex; gap:0.6rem;">
          <button class="tab-btn active" id="tab-draw-sig">${t('toolDetails.signTabDraw')}</button>
          <button class="tab-btn" id="tab-type-sig">${t('toolDetails.signTabType')}</button>
          <button class="tab-btn" id="tab-upload-sig">${t('toolDetails.signTabUpload')}</button>
        </div>

        <!-- Mode 1: Draw Signature Canvas -->
        <div id="draw-sig-container">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem;">
            <div style="display:flex; gap:0.5rem; align-items:center;">
              <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">${t('toolDetails.color')}</span>
              <button class="btn" style="width:24px; height:24px; border-radius:50%; background:#1e3a8a; padding:0; border:2px solid #fff;" data-ink="#1e3a8a" title="Blu Reale"></button>
              <button class="btn" style="width:24px; height:24px; border-radius:50%; background:#090d16; padding:0; border:2px solid #64748b;" data-ink="#090d16" title="Nero"></button>
              <button class="btn" style="width:24px; height:24px; border-radius:50%; background:#dc2626; padding:0; border:2px solid #64748b;" data-ink="#dc2626" title="Rosso"></button>
            </div>
            <button class="btn btn-secondary" id="btn-clear-sig-pad" style="font-size:0.75rem; padding:0.25rem 0.65rem;">
              ${t('toolDetails.clearSignature')}
            </button>
          </div>
          <canvas id="sig-pad-canvas" class="signature-canvas" width="800" height="220"></canvas>
        </div>

        <!-- Mode 2: Type Signature -->
        <div id="type-sig-container" style="display:none; flex-direction:column; gap:1rem;">
          <input type="text" id="type-sig-input" class="search-input" placeholder="${t('toolDetails.typePlaceholder')}" style="padding-left:1.25rem;" />
          <div style="background:#fff; border-radius:var(--radius-md); padding:1.5rem; text-align:center; min-height:120px; display:flex; align-items:center; justify-content:center;">
            <span id="typed-sig-preview" style="font-family:'Brush Script MT', 'Dancing Script', cursive; font-size:3.2rem; color:${inkColor};">
              Firma Anteprima
            </span>
          </div>
        </div>

        <!-- Mode 3: Upload Image Signature -->
        <div id="upload-sig-container" style="display:none;">
          <input type="file" id="sig-image-input" accept="image/png, image/jpeg" style="display:none;" />
          <button class="btn btn-secondary" onclick="document.getElementById('sig-image-input').click()">
            Seleziona Immagine Firma (PNG o JPG)
          </button>
        </div>

        <!-- Proceed to Place Signature Button -->
        <button class="btn btn-primary" id="btn-confirm-sig" style="margin-top:0.5rem; align-self:flex-start;">
          ${t('toolDetails.placeSignature')}
        </button>

        <!-- Preview Placement Canvas on PDF Page -->
        <div id="placement-section" style="display:none; flex-direction:column; gap:1rem; margin-top:1rem; border-top:1px solid var(--border-color); padding-top:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="font-size:0.95rem; font-weight:700; color:var(--text-primary);">
              Trascina o clicca sulla pagina per posizionare la firma:
            </h4>
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <button class="btn btn-secondary" id="btn-sig-prev-p" style="padding:0.25rem 0.6rem;">◀</button>
              <span id="sig-page-lbl" style="font-size:0.85rem; font-weight:600;">1 / ${totalPages}</span>
              <button class="btn btn-secondary" id="btn-sig-next-p" style="padding:0.25rem 0.6rem;">▶</button>
            </div>
          </div>
          
          <div style="position:relative; width:100%; max-height:480px; overflow:auto; display:flex; justify-content:center; background:#1e293b; padding:1.5rem; border-radius:var(--radius-md);">
            <div style="position:relative;" id="sig-page-container">
              <canvas id="sig-page-bg"></canvas>
              <div id="signature-stamp-box" style="position:absolute; border:2px dashed var(--primary); cursor:move; display:flex; align-items:center; justify-content:center; background:rgba(99, 102, 241, 0.1);">
                <img id="stamp-img-preview" style="width:100%; height:100%; object-fit:contain; pointer-events:none;" />
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    bindPadEvents();
  }

  function bindPadEvents() {
    const pad = bodyEl.querySelector('#sig-pad-canvas');
    const ctx = pad.getContext('2d');
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = inkColor;

    let drawing = false;

    pad.onmousedown = (e) => {
      drawing = true;
      const rect = pad.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (pad.width / rect.width);
      const y = (e.clientY - rect.top) * (pad.height / rect.height);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    pad.onmousemove = (e) => {
      if (!drawing) return;
      const rect = pad.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (pad.width / rect.width);
      const y = (e.clientY - rect.top) * (pad.height / rect.height);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    pad.onmouseup = () => (drawing = false);
    pad.onmouseleave = () => (drawing = false);

    // Clear Pad
    bodyEl.querySelector('#btn-clear-sig-pad').onclick = () => {
      ctx.clearRect(0, 0, pad.width, pad.height);
    };

    // Color Swatches
    bodyEl.querySelectorAll('button[data-ink]').forEach((btn) => {
      btn.onclick = () => {
        inkColor = btn.getAttribute('data-ink');
        ctx.strokeStyle = inkColor;
        bodyEl.querySelectorAll('button[data-ink]').forEach((b) => (b.style.border = '2px solid #64748b'));
        btn.style.border = '2px solid #fff';
        const preview = bodyEl.querySelector('#typed-sig-preview');
        if (preview) preview.style.color = inkColor;
      };
    });

    // Tab clicks
    const tabDraw = bodyEl.querySelector('#tab-draw-sig');
    const tabType = bodyEl.querySelector('#tab-type-sig');
    const tabUpload = bodyEl.querySelector('#tab-upload-sig');
    const drawBox = bodyEl.querySelector('#draw-sig-container');
    const typeBox = bodyEl.querySelector('#type-sig-container');
    const uploadBox = bodyEl.querySelector('#upload-sig-container');

    tabDraw.onclick = () => {
      activeTab = 'draw';
      tabDraw.classList.add('active');
      tabType.classList.remove('active');
      tabUpload.classList.remove('active');
      drawBox.style.display = 'block';
      typeBox.style.display = 'none';
      uploadBox.style.display = 'none';
    };

    tabType.onclick = () => {
      activeTab = 'type';
      tabType.classList.add('active');
      tabDraw.classList.remove('active');
      tabUpload.classList.remove('active');
      drawBox.style.display = 'none';
      typeBox.style.display = 'flex';
      uploadBox.style.display = 'none';
    };

    tabUpload.onclick = () => {
      activeTab = 'upload';
      tabUpload.classList.add('active');
      tabDraw.classList.remove('active');
      tabType.classList.remove('active');
      drawBox.style.display = 'none';
      typeBox.style.display = 'none';
      uploadBox.style.display = 'block';
    };

    const typeInput = bodyEl.querySelector('#type-sig-input');
    const typePreview = bodyEl.querySelector('#typed-sig-preview');
    typeInput.oninput = (e) => {
      typePreview.textContent = e.target.value || 'Firma Anteprima';
    };

    const sigImageInput = bodyEl.querySelector('#sig-image-input');
    sigImageInput.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (re) => {
          signatureDataUrl = re.target.result;
          alert('Immagine firma caricata! Clicca ora "Posiziona Firma su PDF".');
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    };

    // Confirm signature & open placement on PDF
    bodyEl.querySelector('#btn-confirm-sig').onclick = async () => {
      if (activeTab === 'draw') {
        signatureDataUrl = pad.toDataURL('image/png');
      } else if (activeTab === 'type') {
        // Render typed text to a canvas
        const tc = document.createElement('canvas');
        tc.width = 600;
        tc.height = 180;
        const tctx = tc.getContext('2d');
        tctx.font = `64px 'Brush Script MT', 'Dancing Script', cursive`;
        tctx.fillStyle = inkColor;
        tctx.textAlign = 'center';
        tctx.textBaseline = 'middle';
        tctx.fillText(typeInput.value || 'Firma', tc.width / 2, tc.height / 2);
        signatureDataUrl = tc.toDataURL('image/png');
      }

      if (!signatureDataUrl) {
        alert('Disegna o inserisci una firma prima di posizionarla.');
        return;
      }

      renderPlacementSection();
    };
  }

  async function renderPlacementSection() {
    const placementSec = bodyEl.querySelector('#placement-section');
    placementSec.style.display = 'flex';
    btnBurn.disabled = false;

    const bgCanvas = bodyEl.querySelector('#sig-page-bg');
    const stampBox = bodyEl.querySelector('#signature-stamp-box');
    const stampImg = bodyEl.querySelector('#stamp-img-preview');
    stampImg.src = signatureDataUrl;

    const { canvas: pageCanvas } = await renderPageToCanvas(pdfJsDoc, currentPage, 1.2);
    bgCanvas.width = pageCanvas.width;
    bgCanvas.height = pageCanvas.height;
    const bgCtx = bgCanvas.getContext('2d');
    bgCtx.drawImage(pageCanvas, 0, 0);

    // Initial Stamp box position
    stampBox.style.width = '180px';
    stampBox.style.height = '70px';
    stampBox.style.left = '40px';
    stampBox.style.top = `${bgCanvas.height - 120}px`;
    sigPos = { x: 40, y: bgCanvas.height - 120, width: 180, height: 70 };

    // Drag signature box on canvas
    let isDraggingStamp = false;
    let offsetStartX = 0;
    let offsetStartY = 0;

    stampBox.onmousedown = (e) => {
      isDraggingStamp = true;
      offsetStartX = e.clientX - stampBox.offsetLeft;
      offsetStartY = e.clientY - stampBox.offsetTop;
    };

    window.onmousemove = (e) => {
      if (!isDraggingStamp) return;
      let newX = e.clientX - offsetStartX;
      let newY = e.clientY - offsetStartY;
      newX = Math.max(0, Math.min(newX, bgCanvas.width - stampBox.offsetWidth));
      newY = Math.max(0, Math.min(newY, bgCanvas.height - stampBox.offsetHeight));
      stampBox.style.left = `${newX}px`;
      stampBox.style.top = `${newY}px`;
      sigPos.x = newX;
      sigPos.y = newY;
    };

    window.onmouseup = () => (isDraggingStamp = false);

    // Page navigation in sign view
    bodyEl.querySelector('#sig-page-lbl').textContent = `${currentPage} / ${totalPages}`;
    bodyEl.querySelector('#btn-sig-prev-p').onclick = async () => {
      if (currentPage > 1) {
        currentPage--;
        renderPlacementSection();
      }
    };
    bodyEl.querySelector('#btn-sig-next-p').onclick = async () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderPlacementSection();
      }
    };
  }

  // Burn signature into PDF
  btnBurn.onclick = async () => {
    btnBurn.disabled = true;
    btnBurn.textContent = t('common.processing');

    try {
      const buffer = await fileToArrayBuffer(activeFile);
      const pdfDoc = await loadPdfLibDoc(buffer);

      const page = pdfDoc.getPage(currentPage - 1);
      const { width: pageWidth, height: pageHeight } = page.getSize();
      const bgCanvas = bodyEl.querySelector('#sig-page-bg');

      // Calculate relative position and scale
      const scaleX = pageWidth / bgCanvas.width;
      const scaleY = pageHeight / bgCanvas.height;

      const pdfX = sigPos.x * scaleX;
      // In PDF, origin (0,0) is bottom-left
      const pdfY = (bgCanvas.height - (sigPos.y + sigPos.height)) * scaleY;
      const pdfWidth = sigPos.width * scaleX;
      const pdfHeight = sigPos.height * scaleY;

      // Embed signature image PNG
      const bin = atob(signatureDataUrl.split(',')[1]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

      const sigImg = await pdfDoc.embedPng(bytes);
      page.drawImage(sigImg, {
        x: pdfX,
        y: pdfY,
        width: pdfWidth,
        height: pdfHeight,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DocuMaster_Signed_${activeFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      confetti({ particleCount: 75, spread: 65 });
      close();
    } catch (err) {
      console.error('Error burning signature:', err);
      alert('Errore firma: ' + err.message);
      btnBurn.disabled = false;
      btnBurn.textContent = 'Riprova';
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
    initSignFlow();
  } else {
    bindUploadEvents();
  }
}
