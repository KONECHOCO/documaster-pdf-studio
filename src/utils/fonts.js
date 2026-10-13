// Font Unicode incorporati nei PDF generati: i font standard di pdf-lib (Helvetica) accettano solo
// WinAnsi e vanno in errore con ✓ ✗, cirillico, greco, giapponese... DejaVu copre latino, cirillico,
// greco e simboli; Noto Sans JP (ridotto ai caratteri JIS livello 1+2) si carica solo per il giapponese.
// Il subset di fontkit corrompe Noto Sans JP (restano visibili pochi glifi): quel font va incorporato intero.
import fontkit from '@pdf-lib/fontkit';

const cache = new Map();
const CJK = /[　-ヿ㐀-䶿一-鿿豈-﫿＀-￯]/;

function fetchFont(name) {
  if (!cache.has(name)) {
    const url = `${import.meta.env.BASE_URL}fonts/${name}`;
    cache.set(
      name,
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`Font ${name} non disponibile`);
        return r.arrayBuffer();
      })
    );
  }
  return cache.get(name).catch((err) => {
    cache.delete(name);
    throw err;
  });
}

export function needsCjkFont(text) {
  return CJK.test(text || '');
}

/** Incorpora (in subset) un font capace di scrivere `text` nel documento. */
export async function embedTextFont(pdfDoc, text = '', { bold = false } = {}) {
  pdfDoc.registerFontkit(fontkit);
  const cjk = needsCjkFont(text);
  const name = cjk ? 'NotoSansJP-JIS.ttf' : bold ? 'DejaVuSans-Bold.ttf' : 'DejaVuSans.ttf';
  const bytes = await fetchFont(name);
  return pdfDoc.embedFont(bytes, { subset: !cjk });
}
