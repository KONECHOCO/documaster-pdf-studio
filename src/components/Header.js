// Navigation Header Component with Language & Theme Switcher
import { t, getLanguage, setLanguage } from '../i18n/translations.js';

export function renderHeader(container, onLanguageChange, onThemeToggle) {
  const currentLang = getLanguage();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  container.innerHTML = `
    <nav class="navbar">
      <div class="brand" id="brand-home">
        <div class="brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="m9 15 2 2 4-4"></path>
          </svg>
        </div>
        <div style="display:flex; flex-direction:column; line-height:1.1;">
          <span style="display:flex; align-items:center; gap:0.4rem;">
            DocuMaster <span class="brand-badge">PRO</span>
          </span>
          <span style="font-size:0.7rem; font-weight:400; color:var(--text-muted); font-family:var(--font-sans);">PDF Studio</span>
        </div>
      </div>

      <div class="nav-actions">
        <div class="privacy-pill" title="Elaborazione 100% Locale nel browser: nessun file viene inviato a server esterni.">
          <span class="privacy-dot"></span>
          <span>${t('badgePrivacy')}</span>
        </div>

        <!-- Language Selector -->
        <select class="lang-select" id="lang-select" aria-label="Seleziona Lingua">
          <option value="it" ${currentLang === 'it' ? 'selected' : ''}>🇮🇹 Italiano</option>
          <option value="en" ${currentLang === 'en' ? 'selected' : ''}>🇬🇧 English</option>
          <option value="es" ${currentLang === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
          <option value="fr" ${currentLang === 'fr' ? 'selected' : ''}>🇫🇷 Français</option>
          <option value="de" ${currentLang === 'de' ? 'selected' : ''}>🇩🇪 Deutsch</option>
          <option value="pt" ${currentLang === 'pt' ? 'selected' : ''}>🇵🇹 Português</option>
        </select>

        <!-- Theme Toggle -->
        <button class="control-btn" id="theme-toggle-btn" aria-label="Cambia Tema">
          ${isDark ? `
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ` : `
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          `}
        </button>
      </div>
    </nav>
  `;

  // Bind events
  const langSelect = container.querySelector('#lang-select');
  langSelect.addEventListener('change', (e) => {
    setLanguage(e.target.value);
    if (onLanguageChange) onLanguageChange(e.target.value);
  });

  const themeToggle = container.querySelector('#theme-toggle-btn');
  themeToggle.addEventListener('click', () => {
    if (onThemeToggle) onThemeToggle();
  });

  const brandHome = container.querySelector('#brand-home');
  brandHome.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
