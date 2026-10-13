// Barra superiore: logo (7 tocchi = annunci di test, per le build di prova), lingua, tema, Pro.
import { t, getLanguage, setLanguage, LANGUAGES } from '../i18n/index.js';
import { getMonetization, toggleTestAds } from '../services/monetization.js';
import { escapeHtml, toast, ICONS } from './ui.js';

let logoTaps = 0;
let logoTimer = null;

export function renderHeader(container, { onLanguageChange, onThemeToggle, onOpenPro, onHome }) {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const { isPro, native } = getMonetization();
  container.innerHTML = `
    <nav class="navbar">
      <button class="brand" id="brand-home" aria-label="DocuMaster">
        <span class="brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
        </span>
        <span class="brand-text">
          <span>DocuMaster ${isPro ? '<span class="brand-badge">PRO</span>' : ''}</span>
          <small>PDF Studio</small>
        </span>
      </button>
      <div class="nav-actions">
        <span class="privacy-pill" title="${escapeHtml(t('header.privacyLong'))}"><span class="privacy-dot"></span><span class="privacy-text">${escapeHtml(t('header.privacy'))}</span></span>
        <select class="lang-select" id="lang-select" aria-label="${escapeHtml(t('header.language'))}">
          ${LANGUAGES.map((l) => `<option value="${l.code}" ${l.code === getLanguage() ? 'selected' : ''}>${escapeHtml(l.label)}</option>`).join('')}
        </select>
        <button class="control-btn" id="theme-toggle-btn" aria-label="${escapeHtml(t('header.theme'))}">
          ${isDark
            ? '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
            : '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'}
        </button>
        ${native && !isPro ? `<button class="pro-btn" id="pro-btn">${ICONS.crown}<span>Pro</span></button>` : ''}
      </div>
    </nav>`;

  container.querySelector('#lang-select').addEventListener('change', (e) => {
    setLanguage(e.target.value);
    onLanguageChange();
  });
  container.querySelector('#theme-toggle-btn').addEventListener('click', onThemeToggle);
  container.querySelector('#pro-btn')?.addEventListener('click', onOpenPro);
  container.querySelector('#brand-home').addEventListener('click', () => {
    onHome?.();
    logoTaps += 1;
    clearTimeout(logoTimer);
    logoTimer = setTimeout(() => (logoTaps = 0), 2500);
    if (logoTaps >= 7 && getMonetization().native) {
      logoTaps = 0;
      const on = toggleTestAds();
      toast(on ? 'Test ads ON — restart the app' : 'Test ads OFF — restart the app');
    }
  });
}
