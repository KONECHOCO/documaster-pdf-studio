// Donazioni con PayPal: solo sul sito. Nelle app non si mostra (Apple vieta le donazioni a sviluppatori
// privati fuori dagli acquisti in-app, Google Play chiede la propria fatturazione): lì c'è DocuMaster Pro.
import { isNative } from '../platform/files.js';
import { getMonetization } from './monetization.js';

export const DONATE_URL = 'https://www.paypal.com/donate/?hosted_button_id=P4M7TSSVDX2F8';

export function donateAllowed() {
  return !isNative && !getMonetization().native;
}
