// Tools Grid and Category Filter Navigation
import { t } from '../i18n/translations.js';

export const TOOLS_LIST = [
  // 1. Scanner da Fotocamera & Upload (Feature richiesta speciale)
  {
    id: 'scanner',
    category: 'scan',
    popular: true,
    color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`
  },
  // 2. Grafici & Document Inspector (Feature richiesta speciale)
  {
    id: 'analytics',
    category: 'analytics',
    popular: true,
    color: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`
  },
  // 3. Unisci PDF
  {
    id: 'merge',
    category: 'organize',
    popular: true,
    color: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 10h6"/><path d="M12 7v6"/><path d="M8 18h8"/></svg>`
  },
  // 4. Dividi PDF
  {
    id: 'split',
    category: 'organize',
    popular: true,
    color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`
  },
  // 5. Comprimi PDF
  {
    id: 'compress',
    category: 'popular',
    popular: true,
    color: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`
  },
  // 6. Modifica & Annota PDF
  {
    id: 'edit',
    category: 'edit',
    popular: true,
    color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`
  },
  // 7. Firma Elettronica
  {
    id: 'sign',
    category: 'edit',
    popular: true,
    color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/><path d="M14 8c-2 2-3 4-3 6s1 2 2 2 3-1 3-3"/></svg>`
  },
  // 8. Compila Moduli PDF (Fill & Sign)
  {
    id: 'fillForm',
    category: 'edit',
    popular: true,
    color: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="12" y2="11"/></svg>`
  },
  // 8. Organizza & Riordina Pagine
  {
    id: 'organize',
    category: 'organize',
    popular: false,
    color: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
  },
  // 9. Ruota PDF
  {
    id: 'rotate',
    category: 'organize',
    popular: false,
    color: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`
  },
  // 10. PDF in Immagini (JPG / PNG)
  {
    id: 'pdfToImg',
    category: 'convert',
    popular: true,
    color: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
  },
  // 11. Immagini in PDF
  {
    id: 'imgToPdf',
    category: 'convert',
    popular: false,
    color: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`
  },
  // 12. Aggiungi Filigrana
  {
    id: 'watermark',
    category: 'edit',
    popular: false,
    color: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`
  },
  // 13. Numera Pagine
  {
    id: 'pageNumbers',
    category: 'edit',
    popular: false,
    color: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`
  },
  // 14. Proteggi con Password
  {
    id: 'protect',
    category: 'security',
    popular: false,
    color: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
  },
  // 15. Sblocca PDF
  {
    id: 'unlock',
    category: 'security',
    popular: false,
    color: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`
  },
  // 16. Estrai Testo & OCR
  {
    id: 'pdfToText',
    category: 'convert',
    popular: false,
    color: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`
  },
  // 17. Appiattisci PDF (Flatten)
  {
    id: 'flatten',
    category: 'security',
    popular: false,
    color: 'linear-gradient(135deg, #d946ef 0%, #c026d3 100%)',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`
  }
];

export function renderToolGrid(container, onSelectTool) {
  let activeCategory = 'all';
  let searchQuery = '';

  const categories = [
    { id: 'all', label: t('catAll') },
    { id: 'popular', label: t('catPopular') },
    { id: 'scan', label: t('catScan') },
    { id: 'edit', label: t('catEdit') },
    { id: 'organize', label: t('catOrganize') },
    { id: 'convert', label: t('catConvert') },
    { id: 'security', label: t('catSecurity') },
    { id: 'analytics', label: t('catAnalytics') },
  ];

  function getFilteredTools() {
    return TOOLS_LIST.filter((tool) => {
      // Category match
      let matchCat = false;
      if (activeCategory === 'all') matchCat = true;
      else if (activeCategory === 'popular') matchCat = tool.popular;
      else matchCat = tool.category === activeCategory;

      if (!matchCat) return false;

      // Search match
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const title = t(`tools.${tool.id}.title`).toLowerCase();
      const desc = t(`tools.${tool.id}.desc`).toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }

  function render() {
    const filtered = getFilteredTools();

    container.innerHTML = `
      <section class="hero-section">
        <div class="hero-glow"></div>
        <h1 class="hero-title">
          ${t('appTitle').split(' ')[0]} <span class="gradient-text">PDF Studio</span>
        </h1>
        <p class="hero-subtitle">${t('tagline')}</p>

        <!-- Search Bar -->
        <div class="search-wrapper">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            class="search-input" 
            id="tool-search-input" 
            placeholder="${t('searchPlaceholder')}" 
            value="${searchQuery}"
            autocomplete="off"
          />
        </div>

        <!-- Category Tabs -->
        <div class="tabs-container" id="category-tabs">
          ${categories.map(cat => `
            <button class="tab-btn ${activeCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}">
              ${cat.label}
            </button>
          `).join('')}
        </div>
      </section>

      <!-- Tools Grid -->
      <section class="tools-section">
        <div class="tools-grid">
          ${filtered.map(tool => {
            const title = t(`tools.${tool.id}.title`);
            const desc = t(`tools.${tool.id}.desc`);
            const badge = t(`tools.${tool.id}.badge`);
            return `
              <div class="tool-card" data-tool-id="${tool.id}" tabindex="0" role="button">
                <div class="card-top">
                  <div class="card-icon" style="background: ${tool.color};">
                    ${tool.iconSvg}
                  </div>
                  <span class="card-badge">${badge}</span>
                </div>
                <h3 class="card-title">${title}</h3>
                <p class="card-desc">${desc}</p>
                <div class="card-action">
                  <span>${t('common.preview')}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <!-- Value Proposition / Features Section -->
      <section class="benefits-section">
        <h2 class="benefits-title">${t('featuresSection.title')}</h2>
        <div class="benefits-grid">
          <div class="benefit-card">
            <div class="benefit-icon" style="background:rgba(16, 185, 129, 0.15); color:var(--success);">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h4 class="benefit-title">${t('featuresSection.f1Title')}</h4>
            <p class="benefit-desc">${t('featuresSection.f1Desc')}</p>
          </div>

          <div class="benefit-card">
            <div class="benefit-icon" style="background:rgba(99, 102, 241, 0.15); color:var(--primary);">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            <h4 class="benefit-title">${t('featuresSection.f2Title')}</h4>
            <p class="benefit-desc">${t('featuresSection.f2Desc')}</p>
          </div>

          <div class="benefit-card">
            <div class="benefit-icon" style="background:rgba(236, 72, 153, 0.15); color:var(--accent);">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 3v18h18"></path>
                <path d="m19 9-5 5-4-4-3 3"></path>
              </svg>
            </div>
            <h4 class="benefit-title">${t('featuresSection.f3Title')}</h4>
            <p class="benefit-desc">${t('featuresSection.f3Desc')}</p>
          </div>

          <div class="benefit-card">
            <div class="benefit-icon" style="background:rgba(245, 158, 11, 0.15); color:var(--warning);">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <h4 class="benefit-title">${t('featuresSection.f4Title')}</h4>
            <p class="benefit-desc">${t('featuresSection.f4Desc')}</p>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <p>DocuMaster PDF Studio • 100% Client-Side Privacy Engine • By IkonetSolutions 2026</p>
      </footer>
    `;

    // Bind Category clicks
    const tabBtns = container.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-cat');
        render();
      });
    });

    // Bind Search Input
    const searchInput = container.querySelector('#tool-search-input');
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
      // Keep focus on search input
      const newSearch = container.querySelector('#tool-search-input');
      newSearch.focus();
      newSearch.selectionStart = newSearch.selectionEnd = newSearch.value.length;
    });

    // Bind Tool Card clicks
    const toolCards = container.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
      card.addEventListener('click', () => {
        const toolId = card.getAttribute('data-tool-id');
        if (onSelectTool) onSelectTool(toolId);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const toolId = card.getAttribute('data-tool-id');
          if (onSelectTool) onSelectTool(toolId);
        }
      });
    });
  }

  render();
}
