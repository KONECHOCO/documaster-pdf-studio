// Pubblicità sul sito web (Google AdSense). Solo nel browser: nell'app nativa ci sono gli annunci AdMob.
// Si attiva impostando VITE_ADSENSE_CLIENT (ca-pub-…) e VITE_ADSENSE_SLOT in .env.production
// dopo l'approvazione del sito su AdSense. Il consenso GDPR è gestito dal messaggio di Google (Privacy e messaggi).
import { Capacitor } from '@capacitor/core';

const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT;
const SLOT = import.meta.env.VITE_ADSENSE_SLOT;
const enabled = !Capacitor.isNativePlatform() && !!CLIENT && !!SLOT;
let scriptLoaded = false;

function loadScript() {
  if (scriptLoaded) return;
  scriptLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(CLIENT)}`;
  document.head.appendChild(s);
}

/** Inserisce un annuncio responsive nel contenitore (nessun effetto se AdSense non è configurato). */
export function renderAdSlot(container) {
  if (!enabled || !container) return;
  loadScript();
  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.display = 'block';
  ins.dataset.adClient = CLIENT;
  ins.dataset.adSlot = SLOT;
  ins.dataset.adFormat = 'auto';
  ins.dataset.fullWidthResponsive = 'true';
  container.classList.add('ad-slot');
  container.appendChild(ins);
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {
    // annuncio non disponibile
  }
}
