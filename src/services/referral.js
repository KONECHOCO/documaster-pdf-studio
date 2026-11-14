// Programma ambasciatori Ikonet: configurazione per DocuMaster (logica comune in referral-core.js).
// La chiave identifica l'app verso partner.ikonetsolutions.com, non è un segreto.
import { Capacitor } from '@capacitor/core';
import { configureReferral, getReferralState, canEnterCode, setReferralCode } from './referral-core.js';
import { t } from '../i18n/index.js';
import { prompt, toast } from '../components/ui.js';

configureReferral({
  api: 'https://partner.ikonetsolutions.com',
  key: 'q5Kz8-YfanSK9IZ0lM0Hd7igKyvVqiYV',
  appId: 'documaster',
  appVersion: '1.0.1',
});

export * from './referral-core.js';

/** Il pulsante regalo compare solo nell'app, nei primi 7 giorni e finché non è stato usato un codice. */
export const showReferralButton = () => Capacitor.isNativePlatform() && canEnterCode(getReferralState());

/** Chiede il codice invito finché è valido o l'utente annulla. Ritorna true se applicato. */
export async function openReferralPrompt() {
  let error = '';
  for (;;) {
    const value = await prompt({
      title: t('referral.title'),
      message: t('referral.hint'),
      placeholder: t('referral.placeholder'),
      okLabel: t('referral.apply'),
      error,
    });
    if (value == null || !value.trim()) return false;
    const res = await setReferralCode(value);
    if (res === 'ok') {
      toast(`${t('referral.applied')} ${getReferralState().code}`, 'success');
      return true;
    }
    error = t(`referral.${res}`);
    if (res === 'expired') return false;
  }
}
