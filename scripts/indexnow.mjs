// Avvisa Bing, Yandex, Seznam, Naver (e chi usa i loro indici: DuckDuckGo, Ecosia, Yahoo, Copilot, ChatGPT)
// che le pagine del sito sono nuove o cambiate. Uso: node scripts/indexnow.mjs (dopo il deploy).
import { readFile, readdir } from 'node:fs/promises';

const HOST = 'offlinepdfstudio.com';
const key = (await readdir('public')).find((f) => /^[0-9a-f]{32}\.txt$/.test(f)).replace('.txt', '');
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList }),
});
console.log(`IndexNow: ${urlList.length} indirizzi inviati → HTTP ${res.status} ${await res.text()}`);
