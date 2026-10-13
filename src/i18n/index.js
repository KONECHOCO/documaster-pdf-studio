// Traduzioni: una cartella per lingua, lingua del dispositivo al primo avvio, inglese come riserva.
import it from './locales/it.js';
import en from './locales/en.js';
import es from './locales/es.js';
import fr from './locales/fr.js';
import de from './locales/de.js';
import pt from './locales/pt.js';
import ja from './locales/ja.js';

const DICTS = { it, en, es, fr, de, pt, ja };

export const LANGUAGES = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
];

const STORAGE_KEY = 'documaster_lang';

function detectLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && DICTS[saved]) return saved;
  } catch {
    // storage non disponibile
  }
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];
  for (const p of prefs) {
    const code = String(p).toLowerCase().split('-')[0];
    if (DICTS[code]) return code;
  }
  return 'en';
}

let current = detectLanguage();
document.documentElement.lang = current;

export function getLanguage() {
  return current;
}

export function setLanguage(lang) {
  if (!DICTS[lang]) return false;
  current = lang;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // storage non disponibile
  }
  return true;
}

function lookup(dict, path) {
  let node = dict;
  for (const key of path.split('.')) {
    if (node == null || node[key] === undefined) return undefined;
    node = node[key];
  }
  return node;
}

/** t('tools.merge.title') · t('errors.rangeOutOfBounds', { total: 4 }) */
export function t(path, vars) {
  let value = lookup(DICTS[current], path);
  if (value === undefined) value = lookup(DICTS.en, path);
  if (value === undefined) value = lookup(DICTS.it, path);
  if (value === undefined) return path;
  if (typeof value === 'string' && vars) {
    return value.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
  }
  return value;
}

/** Numeri e dimensioni nel formato della lingua scelta. */
export function formatBytes(bytes) {
  const locale = current === 'ja' ? 'ja-JP' : current;
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: i ? 1 : 0 }).format(v)} ${units[i]}`;
}

export function formatNumber(n) {
  return new Intl.NumberFormat(current === 'ja' ? 'ja-JP' : current).format(n);
}
