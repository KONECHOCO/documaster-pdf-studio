// Salvataggio dei risultati e apertura dei file ricevuti, uguale su web, iOS e Android.
// Nell'app nativa <a download> non funziona: si scrive il file nella cache e si apre il foglio
// di condivisione di sistema (da lì: "Salva su File", Drive, WhatsApp, Mail...).
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { App as CapApp } from '@capacitor/app';

export const isNative = Capacitor.isNativePlatform();

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function safeName(name) {
  return name.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120);
}

/** Restituisce 'shared' | 'downloaded' | 'cancelled'. */
export async function saveFile(blob, filename) {
  const name = safeName(filename);
  if (isNative) {
    const data = await blobToBase64(blob);
    const { uri } = await Filesystem.writeFile({ path: name, data, directory: Directory.Cache });
    try {
      await Share.share({ title: name, files: [uri] });
      return 'shared';
    } catch (err) {
      if (/cancel/i.test(err?.message || '')) return 'cancelled';
      throw err;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return 'downloaded';
}

/** Anteprima del file: nel browser in una nuova scheda, nell'app tramite il foglio di condivisione. */
export async function openFile(blob, filename) {
  if (isNative) return saveFile(blob, filename);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
  return 'opened';
}

async function fileFromUrl(url) {
  const { data } = await Filesystem.readFile({ path: url });
  const bin = atob(typeof data === 'string' ? data : await blobToBase64(data));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  let name = decodeURIComponent(url.split('/').pop().split('?')[0] || 'document.pdf');
  if (!/\.pdf$/i.test(name)) name += '.pdf';
  return new File([bytes], name, { type: 'application/pdf' });
}

/** PDF aperti con "Apri con… / Copia in DocuMaster" dalle altre app. */
export function listenForIncomingFiles(onFile) {
  if (!isNative) return;
  const handle = async (url) => {
    if (!url || !/^(file|content):/i.test(url)) return;
    try {
      onFile(await fileFromUrl(url));
    } catch (err) {
      console.warn('File ricevuto non leggibile', err);
    }
  };
  CapApp.addListener('appUrlOpen', ({ url }) => handle(url));
  CapApp.getLaunchUrl()
    .then((res) => handle(res?.url))
    .catch(() => {});
}

/** Tasto Indietro di Android: chiude prima la finestra in primo piano. */
export function listenForBackButton(handler) {
  if (!isNative) return;
  CapApp.addListener('backButton', () => {
    if (!handler()) CapApp.minimizeApp();
  });
}
