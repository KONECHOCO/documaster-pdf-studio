// App installata dal sito o dal Microsoft Store: lavoro offline e apertura dei PDF da Esplora file.
import { isNative } from './files.js';

/** La pagina /app/ è quella dell'app installata: niente pubblicità né donazioni. */
export const isInstalledApp = !isNative && location.pathname.startsWith('/app/');

export function initPwa(receiveFile) {
  if (isNative || !('serviceWorker' in navigator) || !window.isSecureContext) return;
  navigator.serviceWorker.register('/sw.js').then(async () => {
    if (!isInstalledApp) return;
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage('precache');
  }).catch((err) => console.warn('Service worker', err));

  if ('launchQueue' in window) {
    window.launchQueue.setConsumer(async ({ files }) => {
      if (!files?.length) return;
      receiveFile(await files[0].getFile());
    });
  }
}
