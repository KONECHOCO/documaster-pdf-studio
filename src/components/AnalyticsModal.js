// Analisi del documento con dati misurati (niente stime inventate): peso reale di immagini, font
// e contenuti, testo per pagina, pagine scansionate, formati carta, campi modulo, metadati.
import { Chart } from 'chart.js/auto';
import { t, formatBytes, formatNumber } from '../i18n/index.js';
import { getTool } from '../tools.js';
import { openModal, button, showError, createDropzone, loadingBlock, escapeHtml } from './ui.js';
import { analyzePdfDocument } from '../utils/pdfHelper.js';

const PALETTE = ['#6366f1', '#ec4899', '#10b981', '#94a3b8', '#f59e0b', '#06b6d4'];

export function openAnalyticsModal(initialFile = null, onAction) {
  const tool = getTool('analytics');
  const charts = [];
  const m = openModal({
    title: t('tools.analytics.title'),
    subtitle: t('tools.analytics.desc'),
    icon: tool.icon,
    color: tool.color,
    size: 'lg',
    onClose: () => charts.forEach((c) => c.destroy()),
  });
  const closeBtn = button(t('common.close'));
  closeBtn.onclick = () => m.close();
  m.footer.append(closeBtn);

  function showPicker() {
    m.body.innerHTML = '';
    m.body.appendChild(createDropzone({ accept: 'pdf', onFiles: ([f]) => run(f) }));
  }

  async function run(file) {
    m.body.innerHTML = '';
    m.body.appendChild(loadingBlock(t('analytics.analyzing')));
    try {
      render(file, await analyzePdfDocument(file));
    } catch (err) {
      showError(err);
      showPicker();
    }
  }

  function render(file, s) {
    const stat = (label, value, color) =>
      `<div class="stat-card"><span class="stat-label">${escapeHtml(label)}</span><span class="stat-val" style="color:${color}">${escapeHtml(value)}</span></div>`;
    const tips = [];
    const imgShare = s.composition.images / s.fileSize;
    if (imgShare > 0.5 && s.fileSize > 300 * 1024) tips.push(['compress', t('analytics.tipCompress', { pct: Math.round(imgShare * 100) })]);
    if (s.scannedPages) tips.push(['ocr', t('analytics.tipOcr', { n: s.scannedPages })]);
    if (s.formFields) tips.push(['fillForm', t('analytics.tipForm', { n: s.formFields })]);
    if (s.author || s.title) tips.push(['metadata', t('analytics.tipMetadata')]);
    if (!tips.length) tips.push([null, t('analytics.tipAllGood')]);

    m.body.innerHTML = `
      <div class="analytics-head">
        <div><span class="stat-label">${escapeHtml(t('analytics.file'))}</span><h4 class="analytics-file"></h4></div>
        <button class="btn btn-secondary btn-sm" id="an-change">${escapeHtml(t('analytics.change'))}</button>
      </div>
      <div class="analytics-grid">
        ${stat(t('analytics.pages'), formatNumber(s.numPages), 'var(--primary)')}
        ${stat(t('analytics.size'), formatBytes(s.fileSize), 'var(--accent)')}
        ${stat(t('analytics.textPages'), `${s.numPages - s.scannedPages} / ${s.numPages}`, 'var(--success)')}
        ${stat(t('analytics.security'), s.isEncrypted ? t('analytics.protected') : t('analytics.notProtected'), s.isEncrypted ? 'var(--success)' : 'var(--warning)')}
        ${stat(t('analytics.images'), formatNumber(s.imageCount), 'var(--secondary)')}
        ${stat(t('analytics.fonts'), formatNumber(s.fontCount), 'var(--primary)')}
        ${stat(t('analytics.formFields'), formatNumber(s.formFields), 'var(--accent)')}
        ${stat(t('analytics.version'), s.pdfVersion ? `PDF ${s.pdfVersion}` : '—', 'var(--text-secondary)')}
      </div>
      <div class="charts-row">
        <div class="chart-box"><h4 class="chart-title">${escapeHtml(t('analytics.chartWeight'))}</h4><div class="chart-wrapper"><canvas id="c-weight"></canvas></div></div>
        <div class="chart-box"><h4 class="chart-title">${escapeHtml(t('analytics.chartFormats'))}</h4><div class="chart-wrapper"><canvas id="c-formats"></canvas></div></div>
      </div>
      <div class="chart-box chart-wide"><h4 class="chart-title">${escapeHtml(t('analytics.chartText'))}</h4><div class="chart-wrapper"><canvas id="c-text"></canvas></div></div>
      <div class="chart-box">
        <h4 class="chart-title">${escapeHtml(t('analytics.tipsTitle'))}</h4>
        <ul class="tips-list">${tips
          .map(([action, text]) => `<li><span>${escapeHtml(text)}</span>${action ? `<button class="btn btn-primary btn-sm" data-action="${action}">${escapeHtml(t(`tools.${action}.title`))}</button>` : ''}</li>`)
          .join('')}</ul>
        ${s.producer ? `<p class="field-hint">${escapeHtml(t('analytics.producer'))}: ${escapeHtml(s.producer)}</p>` : ''}
      </div>`;
    m.body.querySelector('.analytics-file').textContent = s.fileName;
    m.body.querySelector('#an-change').onclick = () => {
      charts.splice(0).forEach((c) => c.destroy());
      showPicker();
    };
    m.body.querySelectorAll('[data-action]').forEach((b) =>
      b.addEventListener('click', () => {
        m.close();
        onAction?.(b.dataset.action, file);
      })
    );

    const css = getComputedStyle(document.documentElement);
    const textColor = css.getPropertyValue('--text-secondary').trim() || '#94a3b8';
    const gridColor = css.getPropertyValue('--border-color').trim() || 'rgba(127,127,127,.15)';
    const legend = { position: 'bottom', labels: { color: textColor, font: { family: 'Inter', size: 11 }, boxWidth: 12 } };

    const weightLabels = ['images', 'fonts', 'content', 'other'];
    charts.push(
      new Chart(m.body.querySelector('#c-weight'), {
        type: 'doughnut',
        data: {
          labels: weightLabels.map((k) => t(`analytics.part_${k}`)),
          datasets: [{ data: weightLabels.map((k) => Math.round(s.composition[k] / 1024)), backgroundColor: PALETTE, borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '64%',
          plugins: { legend, tooltip: { callbacks: { label: (c) => `${c.label}: ${formatBytes(c.raw * 1024)}` } } },
        },
      })
    );

    const formatEntries = Object.entries(s.formats).sort((a, b) => b[1] - a[1]);
    charts.push(
      new Chart(m.body.querySelector('#c-formats'), {
        type: 'doughnut',
        data: {
          labels: formatEntries.map(([k]) => k),
          datasets: [{ data: formatEntries.map(([, v]) => v), backgroundColor: PALETTE, borderWidth: 0 }],
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '64%', plugins: { legend } },
      })
    );

    const shown = s.charsPerPage.slice(0, 200);
    charts.push(
      new Chart(m.body.querySelector('#c-text'), {
        type: 'bar',
        data: {
          labels: shown.map((_, i) => String(i + 1)),
          datasets: [
            {
              label: t('analytics.characters'),
              data: shown,
              backgroundColor: shown.map((c) => (c < 10 ? '#f59e0b' : '#6366f1')),
              borderRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: textColor, maxTicksLimit: 20 }, grid: { display: false }, title: { display: true, text: t('common.page'), color: textColor } },
            y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true },
          },
        },
      })
    );
  }

  if (initialFile) run(initialFile);
  else showPicker();
  return m;
}
