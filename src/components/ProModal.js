// Schermata DocuMaster Pro: acquisto una tantum che rimuove la pubblicità + Ripristina acquisti.
import { t } from '../i18n/index.js';
import { getMonetization, buyPro, restorePro } from '../services/monetization.js';
import { openModal, escapeHtml, ICONS } from './ui.js';

export function openProModal() {
  const m = openModal({ title: t('pro.title'), subtitle: t('pro.subtitle'), icon: ICONS.crown, color: 'linear-gradient(135deg,#f59e0b,#d97706)', size: 'sm' });

  function render(message = '') {
    const { isPro, native, proPrice } = getMonetization();
    m.body.innerHTML = `
      <ul class="pro-benefits">
        ${['benefitNoAds', 'benefitNoVideos', 'benefitOnce', 'benefitSupport'].map((k) => `<li>✓ <span>${escapeHtml(t(`pro.${k}`))}</span></li>`).join('')}
      </ul>
      ${isPro
        ? `<p class="pro-owned">${escapeHtml(t('pro.owned'))}</p>`
        : !native
          ? `<p class="muted-text">${escapeHtml(t('pro.appOnly'))}</p>`
          : `<button class="btn btn-pro btn-block" id="pro-buy">${ICONS.crown}<span>${escapeHtml(t('pro.buy', { price: proPrice || '2,99 €' }))}</span></button>
             <button class="btn btn-link btn-block" id="pro-restore">${escapeHtml(t('pro.restore'))}</button>`}
      ${message ? `<p class="pro-message">${escapeHtml(message)}</p>` : ''}
      <p class="field-hint">${escapeHtml(t('pro.legal'))}</p>`;

    const runAction = async (fn, ok, ko) => {
      m.body.querySelectorAll('button').forEach((b) => (b.disabled = true));
      try {
        render((await fn()) ? ok : ko);
      } catch (err) {
        console.warn('Acquisto Pro', err);
        render(t('pro.error'));
      }
    };
    m.body.querySelector('#pro-buy')?.addEventListener('click', () => runAction(buyPro, t('pro.owned'), t('pro.error')));
    m.body.querySelector('#pro-restore')?.addEventListener('click', () => runAction(restorePro, t('pro.restored'), t('pro.notFound')));
  }
  render();
  return m;
}
