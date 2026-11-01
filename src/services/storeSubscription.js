// Abbonamento dell'app del Microsoft Store (Digital Goods API di Edge). Solo lì: sito e app mobile non cambiano.
// Microsoft offre prove solo da 1 settimana o 1 mese, quindi i 3 giorni li conta l'app.
// Se il negozio non risponde o i componenti aggiuntivi non sono ancora pubblicati (prima revisione), l'app resta utilizzabile.
import { isInstalledApp } from '../platform/pwa.js';

const BILLING = 'https://store.microsoft.com/billing';
export const SUB_MONTHLY = 'documaster_pro_monthly';
export const SUB_YEARLY = 'documaster_pro_yearly';
const TRIAL_DAYS = 3;
const TRIAL_KEY = 'documaster.trialStart';
const DAY_MS = 24 * 60 * 60 * 1000;

let service = null;
let products = [];
let subscribed = false;

function trialStart() {
  try {
    const saved = Number(localStorage.getItem(TRIAL_KEY));
    if (saved) return saved;
    const now = Date.now();
    localStorage.setItem(TRIAL_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

export async function initStoreSubscription() {
  if (!isInstalledApp || !window.getDigitalGoodsService) return;
  try {
    service = await window.getDigitalGoodsService(BILLING);
    products = await service.getDetails([SUB_MONTHLY, SUB_YEARLY]);
    await refreshSubscription();
    trialStart();
  } catch (err) {
    console.warn('Microsoft Store', err);
    service = null;
    products = [];
  }
}

async function refreshSubscription() {
  const purchases = await service.listPurchases();
  subscribed = purchases.some((p) => p.itemId === SUB_MONTHLY || p.itemId === SUB_YEARLY);
  return subscribed;
}

/** L'abbonamento è in vendita in questa installazione. */
export function storeSubscriptionActive() {
  return !!service && products.length > 0;
}

export function isSubscribed() {
  return subscribed;
}

export function trialDaysLeft() {
  return Math.max(0, Math.ceil((trialStart() + TRIAL_DAYS * DAY_MS - Date.now()) / DAY_MS));
}

/** Prova finita e nessun abbonamento: gli strumenti si aprono solo dopo l'abbonamento. */
export function mustSubscribe() {
  return storeSubscriptionActive() && !subscribed && trialDaysLeft() === 0;
}

export function subscriptionPrice(itemId) {
  const item = products.find((p) => p.itemId === itemId);
  if (!item) return null;
  return new Intl.NumberFormat(navigator.language, { style: 'currency', currency: item.price.currency }).format(item.price.value);
}

/** Restituisce true se l'abbonamento è attivo dopo il pagamento; false se l'utente annulla. */
export async function subscribe(itemId) {
  const request = new PaymentRequest([{ supportedMethods: BILLING, data: { sku: itemId } }]);
  try {
    const response = await request.show();
    await response.complete?.('success');
  } catch (err) {
    if (err?.name === 'AbortError') return false;
    throw err;
  }
  return refreshSubscription();
}
