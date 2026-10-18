// Pagina principale: ricerca, categorie, griglia degli strumenti, vantaggi.
import { t } from '../i18n/index.js';
import { TOOLS, CATEGORIES } from '../tools.js';
import { escapeHtml, ICONS } from './ui.js';
import { renderAdSlot } from '../services/adsense.js';
import { DONATE_URL, donateAllowed } from '../services/donate.js';

let activeCategory = 'all';
let searchQuery = '';

function normalize(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function renderToolGrid(container, { onSelectTool, onOpenPro, showPro, showPrivacyOptions, onPrivacyOptions }) {
  container.innerHTML = `
    <section class="hero-section">
      <div class="hero-glow"></div>
      <h1 class="hero-title">${escapeHtml(t('home.title'))} <span class="gradient-text">${escapeHtml(t('home.titleAccent'))}</span></h1>
      <p class="hero-subtitle">${escapeHtml(t('home.subtitle'))}</p>
      <div class="search-wrapper">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="search" class="search-input" id="tool-search-input" autocomplete="off" />
      </div>
      <div class="tabs-container" role="tablist">
        ${CATEGORIES.map((c) => `<button class="tab-btn ${c === activeCategory ? 'active' : ''}" data-cat="${c}" role="tab">${escapeHtml(t(`categories.${c}`))}</button>`).join('')}
      </div>
    </section>
    <section class="tools-section"><div class="tools-grid"></div><p class="muted-text empty-search" hidden></p></section>
    <div id="home-ad"></div>
    <section class="benefits-section">
      <h2 class="benefits-title">${escapeHtml(t('home.whyTitle'))}</h2>
      <div class="benefits-grid">
        ${[1, 2, 3, 4]
          .map(
            (n) => `<div class="benefit-card"><h4 class="benefit-title">${escapeHtml(t(`home.why${n}Title`))}</h4><p class="benefit-desc">${escapeHtml(t(`home.why${n}Desc`))}</p></div>`
          )
          .join('')}
      </div>
      ${showPro ? `<div class="pro-banner"><div><strong>${escapeHtml(t('pro.title'))}</strong><span>${escapeHtml(t('pro.bannerText'))}</span></div><button class="btn btn-pro" id="home-pro">${ICONS.crown}<span>${escapeHtml(t('pro.discover'))}</span></button></div>` : ''}
    </section>
    <footer class="footer">
      <p>DocuMaster PDF Studio · ${escapeHtml(t('home.footer'))} · © ${new Date().getFullYear()} Ikonet Solutions</p>
      <p><a href="https://offlinepdfstudio.com/privacy.html" target="_blank" rel="noopener">${escapeHtml(t('home.privacyPolicy'))}</a>${showPrivacyOptions ? ` · <button class="link-btn" id="privacy-options">${escapeHtml(t('home.privacyOptions'))}</button>` : ''}</p>
      ${donateAllowed() ? `<p><a class="btn btn-donate" href="${DONATE_URL}" target="_blank" rel="noopener">${escapeHtml(t('home.donate'))}</a></p>` : ''}
    </footer>`;

  const search = container.querySelector('#tool-search-input');
  search.placeholder = t('home.searchPlaceholder');
  search.value = searchQuery;
  const grid = container.querySelector('.tools-grid');
  const empty = container.querySelector('.empty-search');

  function renderCards() {
    const q = normalize(searchQuery.trim());
    const list = TOOLS.filter((tool) => {
      if (activeCategory === 'popular' && !tool.popular) return false;
      if (activeCategory !== 'all' && activeCategory !== 'popular' && tool.category !== activeCategory) return false;
      if (!q) return true;
      return normalize(`${t(`tools.${tool.id}.title`)} ${t(`tools.${tool.id}.desc`)} ${t(`tools.${tool.id}.keywords`)}`).includes(q);
    });
    grid.innerHTML = list
      .map(
        (tool) => `
        <button class="tool-card" data-tool-id="${tool.id}">
          <div class="card-top">
            <div class="card-icon" style="background:${tool.color}">${tool.icon}</div>
            <span class="card-badge">${escapeHtml(t(`tools.${tool.id}.badge`))}</span>
          </div>
          <h3 class="card-title">${escapeHtml(t(`tools.${tool.id}.title`))}</h3>
          <p class="card-desc">${escapeHtml(t(`tools.${tool.id}.desc`))}</p>
        </button>`
      )
      .join('');
    empty.hidden = list.length > 0;
    empty.textContent = t('home.noResults');
    grid.querySelectorAll('.tool-card').forEach((card) => card.addEventListener('click', () => onSelectTool(card.dataset.toolId)));
  }

  search.addEventListener('input', () => {
    searchQuery = search.value;
    renderCards();
  });
  container.querySelectorAll('.tab-btn').forEach((b) =>
    b.addEventListener('click', () => {
      activeCategory = b.dataset.cat;
      container.querySelectorAll('.tab-btn').forEach((x) => x.classList.toggle('active', x === b));
      renderCards();
    })
  );
  container.querySelector('#home-pro')?.addEventListener('click', onOpenPro);
  renderAdSlot(container.querySelector('#home-ad'));
  container.querySelector('#privacy-options')?.addEventListener('click', onPrivacyOptions);
  renderCards();
}
