// Advanced Document Scanner Modal (Live Camera & File Upload with Image Enhancement)
import { t } from '../i18n/translations.js';
import { applyDocumentFilter, rotateCanvas } from '../utils/imageFilters.js';
import { convertImagesToPdf } from '../utils/pdfHelper.js';
import confetti from 'canvas-confetti';

export function openScannerModal(onClose) {
  let stream = null;
  let facingMode = 'environment'; // 'user' or 'environment'
  let capturedPages = []; // Array of { id, originalCanvas, filteredCanvas, filter, rotation }
  let activeFilter = 'bw'; // default to clean B&W document
  let activeTab = 'camera'; // 'camera' or 'upload'

  // Create Modal DOM
  const modalEl = document.createElement('div');
  modalEl.className = 'modal-overlay active';
  modalEl.innerHTML = `
    <div class="modal-content" style="max-width: 920px;">
      <div class="modal-header">
        <div class="modal-title-group">
          <div class="modal-title-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </div>
          <div>
            <h3 class="modal-title">${t('scannerModal.title')}</h3>
            <p class="modal-subtitle">${t('scannerModal.subtitle')}</p>
          </div>
        </div>
        <button class="close-modal-btn" id="btn-close-scanner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- Tab Selector: Live Camera vs Upload -->
        <div style="display:flex; gap:0.6rem; margin-bottom:1.25rem;">
          <button class="tab-btn active" id="tab-camera-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            ${t('scannerModal.tabCamera')}
          </button>
          <button class="tab-btn" id="tab-upload-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            ${t('scannerModal.tabUpload')}
          </button>
        </div>

        <!-- Camera Section -->
        <div id="camera-section" class="scanner-container">
          <div class="scanner-video-box">
            <video id="scanner-video" class="scanner-video" autoplay playsinline muted></video>
            <div class="scanner-guide"></div>
            <div id="camera-loading" style="position:absolute; color:#fff; font-size:0.95rem; font-weight:500; display:flex; flex-direction:column; align-items:center; gap:0.5rem;">
              <span>${t('scannerModal.cameraPermission')}</span>
            </div>
          </div>

          <div class="scanner-controls">
            <button class="btn btn-secondary" id="btn-toggle-camera">
              ${t('scannerModal.startCamera')}
            </button>
            <button class="btn-snap" id="btn-snap-photo" title="${t('scannerModal.capturePage')}">
              <div class="btn-snap-inner"></div>
            </button>
            <button class="btn btn-secondary" id="btn-switch-camera" title="${t('scannerModal.switchCamera')}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8h8"></path>
                <polyline points="16 14 20 18 16 22"></polyline>
              </svg>
              ${t('scannerModal.switchCamera')}
            </button>
          </div>
        </div>

        <!-- File Upload Section (Alternative to live camera) -->
        <div id="upload-section" style="display:none;">
          <div class="dropzone" id="scanner-upload-dropzone">
            <input type="file" id="scanner-file-input" multiple accept="image/png, image/jpeg, image/webp" style="display:none;" />
            <div class="dropzone-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <p class="dropzone-prompt">${t('common.uploadPromptImages')}</p>
            <button class="btn btn-secondary" style="margin-top:0.75rem;" onclick="document.getElementById('scanner-file-input').click()">
              ${t('common.browseFiles')}
            </button>
          </div>
        </div>

        <!-- Filter Selector & Settings Bar -->
        <div style="margin-top:1.5rem; padding:1rem; background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md);">
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">${t('scannerModal.filterTitle')}</span>
              <div class="filter-selector">
                <button class="filter-btn ${activeFilter === 'bw' ? 'active' : ''}" data-filter="bw">${t('scannerModal.filterBw')}</button>
                <button class="filter-btn ${activeFilter === 'grayscale' ? 'active' : ''}" data-filter="grayscale">${t('scannerModal.filterGray')}</button>
                <button class="filter-btn ${activeFilter === 'vivid' ? 'active' : ''}" data-filter="vivid">${t('scannerModal.filterVivid')}</button>
                <button class="filter-btn ${activeFilter === 'original' ? 'active' : ''}" data-filter="original">${t('scannerModal.filterOriginal')}</button>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">${t('scannerModal.pageSize')}</span>
              <select id="scanner-pagesize" class="lang-select" style="padding:0.35rem 0.6rem;">
                <option value="a4">${t('scannerModal.pageA4')}</option>
                <option value="letter">${t('scannerModal.pageLetter')}</option>
                <option value="fit">${t('scannerModal.pageFit')}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Scanned Pages Strip -->
        <div style="margin-top:1.5rem;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem;">
            <h4 style="font-size:0.95rem; font-weight:700; color:var(--text-primary);" id="scanned-count-heading">
              ${t('scannerModal.pagesScanned')} (0)
            </h4>
            <button class="btn btn-danger" id="btn-clear-scans" style="padding:0.3rem 0.75rem; font-size:0.78rem; display:none;">
              ${t('scannerModal.clearAll')}
            </button>
          </div>

          <div class="scanned-strip" id="scanned-pages-strip">
            <div style="color:var(--text-muted); font-size:0.85rem; padding:1.5rem 0; width:100%; text-align:center;">
              ${t('scannerModal.noPagesYet')}
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" id="btn-cancel-scanner">${t('common.cancel')}</button>
        <button class="btn btn-success" id="btn-generate-pdf" disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          ${t('scannerModal.generatePdf')}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  const video = modalEl.querySelector('#scanner-video');
  const cameraLoading = modalEl.querySelector('#camera-loading');
  const btnToggleCamera = modalEl.querySelector('#btn-toggle-camera');
  const btnSnapPhoto = modalEl.querySelector('#btn-snap-photo');
  const btnSwitchCamera = modalEl.querySelector('#btn-switch-camera');
  const pagesStrip = modalEl.querySelector('#scanned-pages-strip');
  const scannedHeading = modalEl.querySelector('#scanned-count-heading');
  const btnClearScans = modalEl.querySelector('#btn-clear-scans');
  const btnGeneratePdf = modalEl.querySelector('#btn-generate-pdf');
  const fileInput = modalEl.querySelector('#scanner-file-input');
  const uploadDropzone = modalEl.querySelector('#scanner-upload-dropzone');

  // Start Camera
  async function startCamera() {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      cameraLoading.style.display = 'flex';
      cameraLoading.innerHTML = `<span>Connessione fotocamera...</span>`;

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      await video.play();

      cameraLoading.style.display = 'none';
      btnToggleCamera.textContent = t('scannerModal.stopCamera');
    } catch (err) {
      console.warn('Camera access error:', err);
      cameraLoading.style.display = 'flex';
      cameraLoading.innerHTML = `<span style="color:#ef4444;">${t('scannerModal.cameraError')}</span>`;
      btnToggleCamera.textContent = t('scannerModal.startCamera');
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    video.srcObject = null;
    btnToggleCamera.textContent = t('scannerModal.startCamera');
    cameraLoading.style.display = 'flex';
    cameraLoading.innerHTML = `<span>${t('scannerModal.cameraPermission')}</span>`;
  }

  // Toggle Camera
  btnToggleCamera.addEventListener('click', () => {
    if (stream) stopCamera();
    else startCamera();
  });

  // Switch Front / Back Camera
  btnSwitchCamera.addEventListener('click', () => {
    facingMode = facingMode === 'environment' ? 'user' : 'environment';
    if (stream) startCamera();
  });

  // Automatically start camera on open if on camera tab
  startCamera();

  // Tab switching
  const tabCameraBtn = modalEl.querySelector('#tab-camera-btn');
  const tabUploadBtn = modalEl.querySelector('#tab-upload-btn');
  const cameraSection = modalEl.querySelector('#camera-section');
  const uploadSection = modalEl.querySelector('#upload-section');

  tabCameraBtn.addEventListener('click', () => {
    activeTab = 'camera';
    tabCameraBtn.classList.add('active');
    tabUploadBtn.classList.remove('active');
    cameraSection.style.display = 'flex';
    uploadSection.style.display = 'none';
    if (!stream) startCamera();
  });

  tabUploadBtn.addEventListener('click', () => {
    activeTab = 'upload';
    tabUploadBtn.classList.add('active');
    tabCameraBtn.classList.remove('active');
    cameraSection.style.display = 'none';
    uploadSection.style.display = 'block';
    stopCamera();
  });

  // Shutter snap photo
  btnSnapPhoto.addEventListener('click', () => {
    if (!video.videoWidth) {
      // In case camera not active, start it
      startCamera();
      return;
    }

    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = video.videoWidth;
    snapCanvas.height = video.videoHeight;
    const ctx = snapCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);

    // Apply active filter
    const processed = applyDocumentFilter(snapCanvas, activeFilter);

    addCapturedPage(snapCanvas, processed);
  });

  // Process File Uploads
  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  uploadDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadDropzone.classList.add('dragover');
  });

  uploadDropzone.addEventListener('dragleave', () => {
    uploadDropzone.classList.remove('dragover');
  });

  uploadDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadDropzone.classList.remove('dragover');
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  });

  function handleFiles(files) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const img = new Image();
      img.onload = () => {
        const snapCanvas = document.createElement('canvas');
        snapCanvas.width = img.width;
        snapCanvas.height = img.height;
        const ctx = snapCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const processed = applyDocumentFilter(snapCanvas, activeFilter);
        addCapturedPage(snapCanvas, processed);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  function addCapturedPage(originalCanvas, filteredCanvas) {
    const pageObj = {
      id: Date.now() + Math.random(),
      originalCanvas,
      filteredCanvas,
      rotation: 0,
    };
    capturedPages.push(pageObj);
    renderPagesStrip();
  }

  function renderPagesStrip() {
    scannedHeading.textContent = `${t('scannerModal.pagesScanned')} (${capturedPages.length})`;
    btnGeneratePdf.disabled = capturedPages.length === 0;
    btnClearScans.style.display = capturedPages.length > 0 ? 'inline-block' : 'none';

    if (capturedPages.length === 0) {
      pagesStrip.innerHTML = `
        <div style="color:var(--text-muted); font-size:0.85rem; padding:1.5rem 0; width:100%; text-align:center;">
          ${t('scannerModal.noPagesYet')}
        </div>
      `;
      return;
    }

    pagesStrip.innerHTML = '';
    capturedPages.forEach((page, index) => {
      const card = document.createElement('div');
      card.className = 'scanned-thumb-card';
      const thumbUrl = page.filteredCanvas.toDataURL('image/jpeg', 0.8);

      card.innerHTML = `
        <img src="${thumbUrl}" alt="Page ${index + 1}" />
        <span class="thumb-page-num">${index + 1}</span>
        <button class="thumb-delete-btn" title="${t('common.remove')}">×</button>
        <button class="btn" style="position:absolute; bottom:5px; right:5px; padding:2px 6px; font-size:0.65rem; background:rgba(0,0,0,0.7); color:#fff; border:none;" title="Ruota 90°">
          ↻
        </button>
      `;

      // Delete
      card.querySelector('.thumb-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        capturedPages.splice(index, 1);
        renderPagesStrip();
      });

      // Rotate
      card.querySelector('button[title="Ruota 90°"]').addEventListener('click', (e) => {
        e.stopPropagation();
        page.rotation = (page.rotation + 90) % 360;
        page.filteredCanvas = rotateCanvas(page.filteredCanvas, 90);
        renderPagesStrip();
      });

      pagesStrip.appendChild(card);
    });
  }

  // Filter switching
  const filterBtns = modalEl.querySelectorAll('.filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');

      // Reapply filter to all existing pages
      capturedPages.forEach((p) => {
        p.filteredCanvas = applyDocumentFilter(p.originalCanvas, activeFilter);
        if (p.rotation !== 0) {
          p.filteredCanvas = rotateCanvas(p.filteredCanvas, p.rotation);
        }
      });
      renderPagesStrip();
    });
  });

  // Clear all
  btnClearScans.addEventListener('click', () => {
    capturedPages = [];
    renderPagesStrip();
  });

  // Generate PDF
  btnGeneratePdf.addEventListener('click', async () => {
    if (capturedPages.length === 0) return;

    btnGeneratePdf.disabled = true;
    btnGeneratePdf.textContent = t('common.processing');

    try {
      const pageSize = modalEl.querySelector('#scanner-pagesize').value;
      const imagesToExport = capturedPages.map((p) => ({
        dataUrl: p.filteredCanvas.toDataURL('image/jpeg', 0.92),
      }));

      const pdfBlob = await convertImagesToPdf(imagesToExport, {
        pageSize: pageSize,
        margin: pageSize === 'fit' ? 0 : 20,
      });

      // Trigger download
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `DocuMaster_Scan_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      close();
    } catch (err) {
      console.error('Error generating scan PDF:', err);
      alert('Errore durante la creazione del PDF: ' + err.message);
      btnGeneratePdf.disabled = false;
      btnGeneratePdf.textContent = t('scannerModal.generatePdf');
    }
  });

  function close() {
    stopCamera();
    modalEl.classList.remove('active');
    setTimeout(() => {
      modalEl.remove();
      if (onClose) onClose();
    }, 250);
  }

  modalEl.querySelector('#btn-close-scanner').addEventListener('click', close);
  modalEl.querySelector('#btn-cancel-scanner').addEventListener('click', close);
}
