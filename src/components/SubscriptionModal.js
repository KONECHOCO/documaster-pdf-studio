// Schermata abbonamento dell'app del Microsoft Store: mensile o annuale, dopo 3 giorni di prova.
import { t } from '../i18n/index.js';
import { SUB_MONTHLY, SUB_YEARLY, isSubscribed, subscribe, subscriptionPrice, trialDaysLeft } from '../services/storeSubscription.js';
import { openModal, escapeHtml, ICONS } from './ui.js';

const MANAGE_URL = 'https://account.microsoft.com/services';

export function openSubscriptionModal() {
  const m = openModal({ title: t('pro.title'), subtitle: t('sub.subtitle'), icon: ICONS.crown, color: 'linear-gradient(135deg,#f59e0b,#d97706)', size: 'sm' });

  function plan(id, labelKey) {
    const price = subscriptionPrice(id);
    return price ? `<button class="btn btn-pro btn-block" data-plan="${id}">${ICONS.crown}<span>${escapeHtml(t(labelKey, { price }))}</span></button>` : '';
  }

  function render(message = '') {
    const days = trialDaysLeft();
    const status = isSubscribed() ? t('sub.active') : days > 0 ? t('sub.trialLeft', { days }) : t('sub.trialOver');
    m.body.innerHTML = `
      <ul class="pro-benefits">
        ${['benefitAll', 'benefitNoAds', 'benefitPrivate'].map((k) => `<li>✓ <span>${escapeHtml(t(`sub.${k}`))}</span></li>`).join('')}
      </ul>
      <p class="${isSubscribed() ? 'pro-owned' : 'muted-text'}">${escapeHtml(status)}</p>
      ${message ? `<p class="muted-text">${escapeHtml(message)}</p>` : ''}
      ${isSubscribed() ? '' : `${plan(SUB_MONTHLY, 'sub.monthly')}${plan(SUB_YEARLY, 'sub.yearly')}`}
      <a class="btn btn-link btn-block" href="${MANAGE_URL}" target="_blank" rel="noopener">${escapeHtml(t('sub.manage'))}</a>
      <p class="field-hint">${escapeHtml(t('sub.legal'))}</p>`;
    m.body.querySelectorAll('[data-plan]').forEach((b) => {
      b.addEventListener('click', async () => {
        try {
          await subscribe(b.dataset.plan);
          render();
        } catch (err) {
          console.warn('Abbonamento', err);
          render(t('pro.error'));
        }
      });
    });
  }

  render();
}
