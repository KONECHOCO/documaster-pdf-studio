// Sintesi vocale: nell'app il motore del sistema (AVSpeechSynthesizer su iOS, TextToSpeech su Android,
// tramite @capacitor-community/text-to-speech), nel browser la Web Speech API.
// Si parla una frase alla volta: così pausa, avanti/indietro e velocità rispondono subito.
import { Capacitor } from '@capacitor/core';
import { TextToSpeech, QueueStrategy } from '@capacitor-community/text-to-speech';

const native = Capacitor.isNativePlatform();

export const SPEECH_LANGS = { it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-BR', ja: 'ja-JP' };

export function speechAvailable() {
  return native || (typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
}

/** true se il dispositivo ha una voce per la lingua (su Android può mancare il pacchetto vocale). */
export async function languageSupported(lang) {
  const tag = SPEECH_LANGS[lang] || lang;
  try {
    if (native) return (await TextToSpeech.isLanguageSupported({ lang: tag })).supported;
    const voices = await webVoices();
    // Alcuni browser non elencano le voci: in quel caso si prova comunque
    return !voices.length || voices.some((v) => v.lang.toLowerCase().startsWith(tag.slice(0, 2).toLowerCase()));
  } catch {
    return true;
  }
}

/** Solo Android permette di aprire l'installazione delle voci dall'app. */
export const canInstallVoices = native && Capacitor.getPlatform() === 'android';

/** Android: apre l'installazione dei pacchetti vocali del sistema. */
export function openVoiceInstall() {
  if (native && Capacitor.getPlatform() === 'android') TextToSpeech.openInstall().catch(() => {});
}

function webVoices() {
  const synth = window.speechSynthesis;
  const list = synth.getVoices();
  if (list.length) return Promise.resolve(list);
  return new Promise((resolve) => {
    const done = () => resolve(synth.getVoices());
    synth.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });
}

async function pickWebVoice(tag) {
  const voices = await webVoices();
  const lc = tag.toLowerCase();
  const short = lc.slice(0, 2);
  return (
    voices.find((v) => v.lang.toLowerCase() === lc && v.localService) ||
    voices.find((v) => v.lang.toLowerCase() === lc) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(short)) ||
    null
  );
}

let webUtterance = null;

/** Pronuncia una frase; la promessa si risolve a fine lettura (o subito dopo stop()). */
export async function speak(text, { lang = 'en', rate = 1 } = {}) {
  const tag = SPEECH_LANGS[lang] || lang;
  if (native) {
    // 'playback': si sente anche con l'interruttore silenzioso dell'iPhone attivo
    await TextToSpeech.speak({ text, lang: tag, rate, pitch: 1, volume: 1, category: 'playback', queueStrategy: QueueStrategy.Flush });
    return;
  }
  const synth = window.speechSynthesis;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = tag;
  u.rate = rate;
  const voice = await pickWebVoice(tag);
  if (voice) u.voice = voice;
  webUtterance = u;
  await new Promise((resolve, reject) => {
    u.onend = () => resolve();
    u.onerror = (e) => (e.error === 'interrupted' || e.error === 'canceled' ? resolve() : reject(new Error(e.error)));
    synth.speak(u);
  });
}

export async function stopSpeaking() {
  try {
    if (native) await TextToSpeech.stop();
    else {
      webUtterance = null;
      window.speechSynthesis.cancel();
    }
  } catch {
    // niente in riproduzione
  }
}

/**
 * Divide il testo in frasi brevi (max ~220 caratteri): il motore vocale parte prima e
 * Chrome non interrompe le letture lunghe.
 */
export function splitSentences(text, lang = 'en') {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  let parts;
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    parts = [...new Intl.Segmenter(lang, { granularity: 'sentence' }).segment(clean)].map((s) => s.segment.trim());
  } else {
    parts = clean.match(/[^.!?。！？]+[.!?。！？]*\s*/g)?.map((s) => s.trim()) || [clean];
  }
  const out = [];
  for (const p of parts.filter(Boolean)) {
    if (p.length <= 220) {
      // frasi brevissime (numeri di pagina, sigle) unite alla precedente
      if (out.length && p.length < 25 && out[out.length - 1].length + p.length < 220) out[out.length - 1] += ` ${p}`;
      else out.push(p);
      continue;
    }
    let rest = p;
    while (rest.length > 220) {
      let cut = Math.max(rest.lastIndexOf(', ', 220), rest.lastIndexOf('; ', 220), rest.lastIndexOf('、', 220));
      if (cut < 80) cut = rest.lastIndexOf(' ', 220);
      if (cut < 80) cut = 220;
      out.push(rest.slice(0, cut + 1).trim());
      rest = rest.slice(cut + 1).trim();
    }
    if (rest) out.push(rest);
  }
  return out;
}
