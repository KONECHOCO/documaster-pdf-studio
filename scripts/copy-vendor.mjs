// Copia in public/vendor i file runtime che devono funzionare offline (app nativa) e senza CDN:
// worker di pdf.js + mappe caratteri + font standard, qpdf (cifratura), tesseract (OCR).
// Eseguito automaticamente prima di `dev` e `build`.
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const nm = join(root, 'node_modules');
const out = join(root, 'public', 'vendor');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const copy = (from, to) => {
  const src = join(nm, from);
  if (!existsSync(src)) throw new Error(`File mancante: ${src} (eseguire npm install)`);
  cpSync(src, join(out, to), { recursive: true });
};

// pdf.js
copy('pdfjs-dist/build/pdf.worker.min.mjs', 'pdfjs/pdf.worker.min.mjs');
copy('pdfjs-dist/cmaps', 'pdfjs/cmaps');
copy('pdfjs-dist/standard_fonts', 'pdfjs/standard_fonts');

// qpdf (cifratura / decifratura AES-256)
copy('@neslinesli93/qpdf-wasm/dist/qpdf.wasm', 'qpdf/qpdf.wasm');

// tesseract: worker e core (solo varianti LSTM) inclusi nell'app; i modelli linguistici si scaricano al primo uso
copy('tesseract.js/dist/worker.min.js', 'tesseract/worker.min.js');
for (const f of ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js']) {
  copy(`tesseract.js-core/${f}`, `tesseract/${f}`);
}

console.log('vendor copiati in public/vendor');
