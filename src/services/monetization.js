/**
 * Monetizzazione: AdMob (apertura app, banner, interstitial, video premio) + DocuMaster Pro.
 * Stesso schema di OmniTransit (Ikonet), senza React.
 *
 * - DocuMaster Pro = acquisto una tantum (non consumabile, 2,99 €) che rimuove TUTTA la pubblicità.
 *   Prodotto da creare su App Store Connect e Play Console con ID PRO_PRODUCT_ID.
 * - Gli ID AdMob reali arrivano dalle variabili VITE_ADMOB_* (.env.production). Senza di esse si usano
 *   gli ID di test ufficiali Google: non pubblicare mai l'app con gli annunci di test.
 * - Nel browser non ci sono annunci AdMob.
 */
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import {
  AdMob,
  AdmobConsentStatus,
  AppOpenAdPluginEvents,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
} from '@capacitor-community/admob';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

export const PRO_PRODUCT_ID = 'documaster_pro';

const native = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();
const env = import.meta.env;

// ID di test ufficiali Google (https://developers.google.com/admob/android/test-ads)
const TEST_IDS = {
  android: {
    banner: 'ca-app-pub-3940256099942544/9214589741',
    appOpen: 'ca-app-pub-3940256099942544/9257395921',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
  },
  ios: {
    banner: 'ca-app-pub-3940256099942544/2435281174',
    appOpen: 'ca-app-pub-3940256099942544/5575463023',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
  },
};

const P = platform === 'ios' ? 'IOS' : 'ANDROID';
const REAL_IDS = {
  banner: env[`VITE_ADMOB_${P}_BANNER`],
  appOpen: env[`VITE_ADMOB_${P}_APP_OPEN`],
  interstitial: env[`VITE_ADMOB_${P}_INTERSTITIAL`],
};

// Frequenze come OmniTransit: sempre nei punti di passaggio (fine di un'elaborazione, apertura di uno
// strumento) e mai a raffica, dentro le regole AdMob sugli interstitial
const INTERSTITIAL_EVERY_N_ACTIONS = 2;
const MIN_GAP_BETWEEN_FULLSCREEN_MS = 45 * 1000;
const APP_OPEN_MIN_BACKGROUND_MS = 20 * 1000;
const APP_OPEN_LOAD_TIMEOUT_MS = 8000;

const PRO_KEY = 'documaster.pro';
const TEST_ADS_KEY = 'documaster.testAds';

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage non disponibile
  }
}

// In sviluppo sempre annunci di test: cliccare i propri annunci reali viola le norme AdMob.
// Nelle build di prova si attivano toccando 7 volte il logo: vedi toggleTestAds().
const USE_TEST_ADS = env.DEV || !REAL_IDS.banner || readStorage(TEST_ADS_KEY, false);
const AD_IDS = USE_TEST_ADS ? TEST_IDS[platform] || TEST_IDS.android : REAL_IDS;

// Solo in sviluppo: ?storeshot mostra l'interfaccia d'acquisto nativa per gli screenshot degli store
const previewNative = env.DEV && typeof location !== 'undefined' && location.search.includes('storeshot');

// ---------- Stato osservabile ----------
let state = {
  native: native || previewNative,
  isPro: readStorage(PRO_KEY, false),
  proPrice: null,
  adsReady: false,
  bannerHeight: 0,
  testAds: USE_TEST_ADS,
  diag: [],
};
const listeners = new Set();
function setState(patch) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}
export function getMonetization() {
  return state;
}
export function subscribeMonetization(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ---------- Annunci ----------
let lastFullscreenAt = 0;
let actionCount = 0;
let backgroundedAt = 0;
let interstitialLoaded = false;
let appOpenLoaded = false;
let fullscreenShowing = false;

function adsAllowed() {
  return native && state.adsReady && !state.isPro;
}

export function diag(msg) {
  const line = `${new Date().toLocaleTimeString()} ${msg}`;
  console.info('[ads]', line);
  setState({ diag: [...(state.diag || []).slice(-30), line] });
}

async function prepareInterstitial() {
  try {
    await AdMob.prepareInterstitial({ adId: AD_IDS.interstitial, isTesting: USE_TEST_ADS });
    interstitialLoaded = true;
    diag('interstitial caricato');
  } catch (err) {
    interstitialLoaded = false;
    diag(`interstitial non disponibile: ${err?.message || err}`);
  }
}

async function loadAppOpen() {
  try {
    await AdMob.loadAppOpen({ adId: AD_IDS.appOpen });
    appOpenLoaded = true;
    diag('app open caricato');
  } catch (err) {
    appOpenLoaded = false;
    diag(`app open non disponibile: ${err?.message || err}`);
  }
}

async function showAppOpen() {
  if (!adsAllowed() || fullscreenShowing) return;
  if (!appOpenLoaded) {
    await Promise.race([loadAppOpen(), new Promise((r) => setTimeout(r, APP_OPEN_LOAD_TIMEOUT_MS))]);
  }
  if (!appOpenLoaded) return;
  try {
    fullscreenShowing = true;
    appOpenLoaded = false;
    await AdMob.showAppOpen();
    lastFullscreenAt = Date.now();
  } catch {
    fullscreenShowing = false;
  }
}

async function showBanner() {
  if (!adsAllowed()) return;
  try {
    await AdMob.showBanner({
      adId: AD_IDS.banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: USE_TEST_ADS,
    });
    diag('banner richiesto');
  } catch (err) {
    diag(`banner errore: ${err?.message || err}`);
  }
}

async function removeAllAds() {
  if (!native) return;
  try {
    await AdMob.removeBanner();
  } catch {
    // nessun banner attivo
  }
  setState({ bannerHeight: 0 });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitUntilActive() {
  const { isActive } = await CapApp.getState();
  if (isActive) return;
  await new Promise((resolve) => {
    const handle = CapApp.addListener('appStateChange', ({ isActive: active }) => {
      if (active) {
        handle.then((h) => h.remove());
        resolve();
      }
    });
  });
}

// App Tracking Transparency (iOS): popup mostrato anche dal codice nativo (AppDelegate); si aspetta
// al massimo 10 s, poi si prosegue con annunci non personalizzati invece di bloccare tutto.
async function requestTrackingPermission() {
  if (platform !== 'ios') return;
  try {
    await waitUntilActive();
    for (let waited = 0; waited <= 10000; waited += 1000) {
      const { status } = await AdMob.trackingAuthorizationStatus();
      if (status !== 'notDetermined') {
        diag(`ATT: ${status}`);
        return;
      }
      if (waited === 3000) AdMob.requestTrackingAuthorization().catch(() => {});
      await sleep(1000);
    }
    diag('ATT: nessuna risposta in 10 s, si prosegue');
  } catch (err) {
    diag(`ATT errore: ${err?.message || err}`);
  }
}

// Consenso GDPR (UMP), PRIMA della richiesta ATT come indica Google
async function gatherConsent() {
  let canRequestAds = true;
  try {
    let info = await Promise.race([
      AdMob.requestConsentInfo(),
      sleep(10000).then(() => {
        throw new Error('UMP timeout');
      }),
    ]);
    diag(`UMP: stato=${info.status} modulo=${info.isConsentFormAvailable} canRequestAds=${info.canRequestAds}`);
    if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
      info = await AdMob.showConsentForm();
      diag(`UMP dopo il modulo: stato=${info.status} canRequestAds=${info.canRequestAds}`);
    }
    canRequestAds = info.canRequestAds !== false;
  } catch (err) {
    diag(`UMP errore: ${err?.message || err}`);
  }
  await requestTrackingPermission();
  return canRequestAds;
}

/** Da chiamare una volta all'avvio dell'app. */
export async function initMonetization() {
  if (!native) return;
  await Promise.race([refreshProStatus(), sleep(4000)]);
  if (state.isPro) return;

  diag(`avvio: test=${USE_TEST_ADS} piattaforma=${platform}`);
  const canRequestAds = await gatherConsent();
  if (!canRequestAds && !USE_TEST_ADS) {
    diag('annunci non consentiti (consenso GDPR mancante)');
    return;
  }

  try {
    await AdMob.initialize({ initializeForTesting: USE_TEST_ADS });
  } catch (err) {
    diag(`AdMob initialize errore: ${err?.message || err}`);
    return;
  }
  setState({ adsReady: true });
  diag('AdMob pronto');

  AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => setState({ bannerHeight: size.height || 0 }));
  AdMob.addListener(BannerAdPluginEvents.Loaded, () => diag('banner caricato'));
  AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (err) =>
    diag(`banner fallito: ${err?.message || err?.code || JSON.stringify(err)}`)
  );
  AdMob.addListener(AppOpenAdPluginEvents.Closed, () => {
    fullscreenShowing = false;
    lastFullscreenAt = Date.now();
    loadAppOpen();
  });
  AdMob.addListener(AppOpenAdPluginEvents.FailedToShow, () => {
    fullscreenShowing = false;
    loadAppOpen();
  });

  showBanner();
  await prepareInterstitial();
  await showAppOpen();
  if (!fullscreenShowing && Date.now() - lastFullscreenAt > MIN_GAP_BETWEEN_FULLSCREEN_MS && interstitialLoaded) {
    await showInterstitialNow();
  }

  CapApp.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) {
      backgroundedAt = Date.now();
      return;
    }
    const away = backgroundedAt ? Date.now() - backgroundedAt : 0;
    if (away >= APP_OPEN_MIN_BACKGROUND_MS && Date.now() - lastFullscreenAt >= MIN_GAP_BETWEEN_FULLSCREEN_MS) {
      showAppOpen();
    }
  });
}

async function showInterstitialNow() {
  try {
    fullscreenShowing = true;
    interstitialLoaded = false;
    await AdMob.showInterstitial();
    lastFullscreenAt = Date.now();
  } catch {
    // nessun annuncio disponibile
  } finally {
    fullscreenShowing = false;
    prepareInterstitial();
  }
}

/** Punti di passaggio naturali (apertura strumento, documento pronto): interstitial ogni N azioni. */
export async function trackAdAction() {
  if (!adsAllowed() || fullscreenShowing) return;
  actionCount += 1;
  if (actionCount % INTERSTITIAL_EVERY_N_ACTIONS !== 0) return;
  if (Date.now() - lastFullscreenAt < MIN_GAP_BETWEEN_FULLSCREEN_MS) return;
  if (!interstitialLoaded) {
    prepareInterstitial();
    return;
  }
  await showInterstitialNow();
}

// ---------- DocuMaster Pro (acquisto una tantum) ----------
function setPro(isPro) {
  writeStorage(PRO_KEY, isPro);
  setState({ isPro });
  if (isPro) removeAllAds();
}

function ownsPro(purchases) {
  return (purchases || []).some(
    (p) => p.productIdentifier === PRO_PRODUCT_ID && (platform !== 'android' || p.purchaseState === '1' || p.purchaseState == null)
  );
}

export async function refreshProStatus() {
  if (!native) return;
  try {
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP });
    setPro(ownsPro(purchases));
  } catch (err) {
    // offline: teniamo l'ultimo stato noto
    console.info('Verifica Pro non riuscita', err);
  }
  NativePurchases.getProduct({ productIdentifier: PRO_PRODUCT_ID, productType: PURCHASE_TYPE.INAPP })
    .then(({ product }) => setState({ proPrice: product?.priceString || null }))
    .catch(() => {
      // prodotto non ancora configurato negli store
    });
}

export async function buyPro() {
  if (!native) throw new Error('Acquisto disponibile solo nell\'app');
  const tx = await NativePurchases.purchaseProduct({
    productIdentifier: PRO_PRODUCT_ID,
    productType: PURCHASE_TYPE.INAPP,
    quantity: 1,
  });
  if (tx?.productIdentifier === PRO_PRODUCT_ID) setPro(true);
  return state.isPro;
}

export async function restorePro() {
  if (!native) return false;
  try {
    await NativePurchases.restorePurchases();
  } catch {
    // proseguiamo comunque con la lettura degli acquisti
  }
  await refreshProStatus();
  return state.isPro;
}

/** Interruttore nascosto per le build di prova: annunci di test on/off (serve riavviare l'app). */
export function toggleTestAds() {
  const next = !readStorage(TEST_ADS_KEY, false);
  writeStorage(TEST_ADS_KEY, next);
  return next;
}
