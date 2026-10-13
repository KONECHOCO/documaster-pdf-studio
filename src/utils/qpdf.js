// Cifratura e decifratura reali tramite QPDF compilato in WebAssembly (tutto in locale).
import createModule from '@neslinesli93/qpdf-wasm';

const WASM_URL = `${import.meta.env.BASE_URL}vendor/qpdf/qpdf.wasm`;

async function runQpdf(args, input) {
  const log = [];
  const qpdf = await createModule({
    noInitialRun: true,
    locateFile: () => WASM_URL,
    print: (s) => log.push(s),
    printErr: (s) => log.push(s),
  });
  qpdf.FS.writeFile('/in.pdf', input);
  let code;
  try {
    code = qpdf.callMain(args);
  } catch (err) {
    code = typeof err?.status === 'number' ? err.status : 1;
  }
  let output = null;
  try {
    output = qpdf.FS.readFile('/out.pdf');
  } catch {
    // nessun file prodotto
  }
  // Exit code 3 = completato con avvisi: il file è comunque valido
  return { ok: (code === 0 || code === 3) && !!output, code, output, log };
}

/** Protegge il PDF con AES-256. `permissions`: { print, copy, modify } (true = consentito). */
export async function encryptPdfBytes(bytes, userPassword, permissions = {}) {
  const ownerPassword = `${userPassword}#${crypto.getRandomValues(new Uint32Array(4)).join('')}`;
  const args = [
    '--encrypt',
    `--user-password=${userPassword}`,
    `--owner-password=${ownerPassword}`,
    '--bits=256',
  ];
  if (permissions.print === false) args.push('--print=none');
  if (permissions.copy === false) args.push('--extract=n');
  if (permissions.modify === false) args.push('--modify=none');
  args.push('--', '/in.pdf', '/out.pdf');
  const res = await runQpdf(args, bytes);
  if (!res.ok) throw new Error(res.log.join('\n') || `qpdf ${res.code}`);
  return res.output;
}

/** Rimuove password e restrizioni. Restituisce null se la password è sbagliata. */
export async function decryptPdfBytes(bytes, password = '') {
  const res = await runQpdf([`--password=${password}`, '--decrypt', '/in.pdf', '/out.pdf'], bytes);
  return res.ok ? res.output : null;
}

/** Controllo veloce: il PDF contiene un dizionario di cifratura? */
export function looksEncrypted(bytes) {
  // "/Encrypt" in ASCII; nei PDF compare sempre in chiaro nel trailer o nel dizionario dello stream XRef
  const needle = [47, 69, 110, 99, 114, 121, 112, 116];
  outer: for (let i = 0; i <= bytes.length - needle.length; i++) {
    if (bytes[i] !== 47) continue;
    for (let j = 1; j < needle.length; j++) if (bytes[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}
