// Abbonamento dell'app del Microsoft Store (Digital Goods API di Edge). Solo lì: sito e app mobile non cambiano.
// La prova di 7 giorni è quella del componente aggiuntivo: la gestisce Microsoft, una volta per account.
// Se il negozio non risponde o i componenti aggiuntivi non sono ancora pubblicati (prima revisione), l'app resta utilizzabile.
import { isInstalledApp } from '../platform/pwa.js';

const BILLING = 'https://store.microsoft.com/billing';
export const SUB_MONTHLY = 'documaster_pro_monthly';
export const SUB_YEARLY = 'documaster_pro_yearly';

let service = null;
let products = [];
let subscribed = false;

export async function initStoreSubscription() {
  if (!isInstalledApp || !window.getDigitalGoodsService) return;
  try {
    service = await window.getDigitalGoodsService(BILLING);
    products = await service.getDetails([SUB_MONTHLY, SUB_YEARLY]);
    await refreshSubscription();
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

/** Senza abbonamento né prova in corso gli strumenti non si aprono. */
export function mustSubscribe() {
  return storeSubscriptionActive() && !subscribed;
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
