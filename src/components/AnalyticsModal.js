// Professional Document Inspector & Analytics Charts Modal (Chart.js)
import { t } from '../i18n/translations.js';
import { analyzePdfDocument } from '../utils/pdfHelper.js';
import { Chart } from 'chart.js/auto';

export function openAnalyticsModal(initialFile = null, onClose, onAction) {
  let activeFile = initialFile;
  let chart1 = null;
  let chart2 = null;
  let chart3 = null;

  const modalEl = document.createElement('div');
  modalEl.className = 'modal-overlay active';
  modalEl.innerHTML = `
    <div class="modal-content" style="max-width: 960px;">
      <div class="modal-header">
        <div class="modal-title-group">
          <div class="modal-title-icon" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3v18h18"></path>
              <path d="m19 9-5 5-4-4-3 3"></path>
            </svg>
          </div>
          <div>
            <h3 class="modal-title">${t('analyticsModal.title')}</h3>
            <p class="modal-subtitle">${t('analyticsModal.subtitle')}</p>
          </div>
        </div>
        <button class="close-modal-btn" id="btn-close-analytics">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body" id="analytics-modal-body">
        ${!activeFile ? `
          <div class="dropzone" id="analytics-dropzone">
            <input type="file" id="analytics-file-input" accept="application/pdf" style="display:none;" />
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
            <p class="dropzone-sub">${t('common.supportedFormats')}</p>
            <button class="btn btn-secondary" style="margin-top:0.85rem;" onclick="document.getElementById('analytics-file-input').click()">
              ${t('common.browseFiles')}
            </button>
          </div>
        ` : `
          <div id="analytics-content-container">
            <div style="text-align:center; padding:2rem 0; color:var(--text-muted);">
              Analisi approfondita del documento in corso...
            </div>
          </div>
        `}
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" id="btn-cancel-analytics">${t('common.close')}</button>
        <button class="btn btn-primary" id="btn-compress-from-analytics" style="display:none;">
          ${t('tools.compress.title')}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  const bodyEl = modalEl.querySelector('#analytics-modal-body');
  const btnClose = modalEl.querySelector('#btn-close-analytics');
  const btnCancel = modalEl.querySelector('#btn-cancel-analytics');
  const btnCompressAction = modalEl.querySelector('#btn-compress-from-analytics');

  function bindUploadEvents() {
    const dropzone = modalEl.querySelector('#analytics-dropzone');
    const fileInput = modalEl.querySelector('#analytics-file-input');
    if (!dropzone || !fileInput) return;

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        activeFile = e.target.files[0];
        runAnalysis();
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
        runAnalysis();
      }
    });
  }

  async function runAnalysis() {
    bodyEl.innerHTML = `
      <div style="text-align:center; padding:3rem 0; display:flex; flex-direction:column; align-items:center; gap:1rem;">
        <div style="width:40px; height:40px; border:3px solid var(--border-color); border-top-color:var(--primary); border-radius:50%; animation:spin 1s infinite linear;"></div>
        <p style="font-weight:600; color:var(--text-primary);">Analisi vettoriale e diagnostica in corso...</p>
      </div>
    `;

    try {
      const stats = await analyzePdfDocument(activeFile);
      renderDashboard(stats);
    } catch (err) {
      console.error('Error analyzing document:', err);
      bodyEl.innerHTML = `
        <div style="color:var(--danger); padding:2rem; text-align:center;">
          Errore durante l'analisi del file PDF: ${err.message}
        </div>
      `;
    }
  }

  function renderDashboard(stats) {
    bodyEl.innerHTML = `
      <div style="margin-bottom:1.25rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
        <div>
          <span style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">FILE ANALIZZATO:</span>
          <h4 style="font-size:1.1rem; font-weight:700; color:var(--text-primary); font-family:var(--font-heading);">${stats.fileName}</h4>
        </div>
        <button class="btn btn-secondary" id="btn-change-doc" style="font-size:0.82rem; padding:0.4rem 0.8rem;">
          Cambia Documento
        </button>
      </div>

      <!-- Top Metric Cards -->
      <div class="analytics-grid">
        <div class="stat-card">
          <span class="stat-label">${t('analyticsModal.statPages')}</span>
          <span class="stat-val" style="color:var(--primary);">${stats.numPages}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">${t('analyticsModal.statSize')}</span>
          <span class="stat-val" style="color:var(--accent);">${stats.fileSizeKB} KB</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">${t('analyticsModal.statDpi')}</span>
          <span class="stat-val" style="color:var(--warning);">${stats.avgDpi} DPI</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">${t('analyticsModal.statSecurity')}</span>
          <span class="stat-val" style="color:var(--success);">${t('analyticsModal.statOpen')}</span>
        </div>
      </div>

      <!-- Professional Charts Row -->
      <div class="charts-row">
        <!-- Chart 1: Composition -->
        <div class="chart-box">
          <h4 class="chart-title">${t('analyticsModal.chart1Title')}</h4>
          <div class="chart-wrapper">
            <canvas id="chart-composition"></canvas>
          </div>
        </div>

        <!-- Chart 2: Compression Simulation -->
        <div class="chart-box">
          <h4 class="chart-title">${t('analyticsModal.chart2Title')}</h4>
          <div class="chart-wrapper">
            <canvas id="chart-compression"></canvas>
          </div>
        </div>
      </div>

      <!-- Chart 3 & Insights Row -->
      <div class="charts-row">
        <div class="chart-box">
          <h4 class="chart-title">${t('analyticsModal.chart3Title')}</h4>
          <div class="chart-wrapper">
            <canvas id="chart-orientation"></canvas>
          </div>
        </div>

        <div class="chart-box" style="justify-content:center;">
          <h4 class="chart-title">${t('analyticsModal.insightsTitle')}</h4>
          <div style="display:flex; flex-direction:column; gap:0.9rem; font-size:0.88rem; color:var(--text-secondary);">
            <div style="display:flex; gap:0.6rem; align-items:flex-start;">
              <span style="color:var(--success); font-size:1.1rem; line-height:1;">✔</span>
              <span>${t('analyticsModal.tipOptimize')}</span>
            </div>
            <div style="display:flex; gap:0.6rem; align-items:flex-start;">
              <span style="color:var(--primary); font-size:1.1rem; line-height:1;">⚡</span>
              <span>${t('analyticsModal.tipCompress')}</span>
            </div>
            <div style="display:flex; gap:0.6rem; align-items:flex-start;">
              <span style="color:var(--warning); font-size:1.1rem; line-height:1;">🛡️</span>
              <span>Protezione metadati: pronto per conformità GDPR e privacy al 100%.</span>
            </div>
          </div>
        </div>
      </div>
    `;

    btnCompressAction.style.display = 'inline-flex';
    btnCompressAction.onclick = () => {
      close();
      if (onAction) onAction('compress', activeFile);
    };

    modalEl.querySelector('#btn-change-doc').addEventListener('click', () => {
      activeFile = null;
      renderUploadDropzone();
    });

    initCharts(stats);
  }

  function renderUploadDropzone() {
    bodyEl.innerHTML = `
      <div class="dropzone" id="analytics-dropzone">
        <input type="file" id="analytics-file-input" accept="application/pdf" style="display:none;" />
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
        <p class="dropzone-sub">${t('common.supportedFormats')}</p>
        <button class="btn btn-secondary" style="margin-top:0.85rem;" onclick="document.getElementById('analytics-file-input').click()">
          ${t('common.browseFiles')}
        </button>
      </div>
    `;
    btnCompressAction.style.display = 'none';
    bindUploadEvents();
  }

  function initCharts(stats) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

    // 1. Doughnut Composition Chart
    const ctx1 = modalEl.querySelector('#chart-composition').getContext('2d');
    chart1 = new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: ['Contenuto Testo', 'Elementi Grafici / Immagini', 'Spazio Strutturale'],
        datasets: [{
          data: [stats.textDensityScore, stats.imageDensityScore, stats.whitespaceScore],
          backgroundColor: ['#6366f1', '#ec4899', '#10b981'],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, font: { family: 'Inter', size: 11 } }
          }
        },
        cutout: '68%'
      }
    });

    // 2. Bar Compression Chart
    const ctx2 = modalEl.querySelector('#chart-compression').getContext('2d');
    chart2 = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: ['Originale', 'Leggera (-15%)', 'Consigliata (-48%)', 'Massima (-66%)'],
        datasets: [{
          label: 'Dimensione Stimata (KB)',
          data: [
            stats.compressionSimulation.original,
            stats.compressionSimulation.low,
            stats.compressionSimulation.recommended,
            stats.compressionSimulation.extreme
          ],
          backgroundColor: ['#64748b', '#3b82f6', '#10b981', '#f59e0b'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: { color: textColor, font: { family: 'Inter', size: 10 } },
            grid: { display: false }
          },
          y: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          }
        }
      }
    });

    // 3. Polar Area Orientation Chart
    const ctx3 = modalEl.querySelector('#chart-orientation').getContext('2d');
    chart3 = new Chart(ctx3, {
      type: 'polarArea',
      data: {
        labels: ['Verticale (Portrait)', 'Orizzontale (Landscape)'],
        datasets: [{
          data: [stats.portraitCount, Math.max(1, stats.landscapeCount)],
          backgroundColor: ['rgba(99, 102, 241, 0.75)', 'rgba(236, 72, 153, 0.75)'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, font: { family: 'Inter', size: 11 } }
          }
        },
        scales: {
          r: {
            grid: { color: gridColor },
            ticks: { display: false }
          }
        }
      }
    });
  }

  function close() {
    if (chart1) chart1.destroy();
    if (chart2) chart2.destroy();
    if (chart3) chart3.destroy();
    modalEl.classList.remove('active');
    setTimeout(() => {
      modalEl.remove();
      if (onClose) onClose();
    }, 250);
  }

  btnClose.addEventListener('click', close);
  btnCancel.addEventListener('click', close);

  if (activeFile) {
    runAnalysis();
  } else {
    bindUploadEvents();
  }
}
