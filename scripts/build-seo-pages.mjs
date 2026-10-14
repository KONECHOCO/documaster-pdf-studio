// Versione web (pdf.ikonetsolutions.com): una pagina per ogni lingua e per ogni strumento,
// es. /it/merge-pdf/ e /ja/compress-pdf/, con titolo, descrizione, hreflang e testo indicizzabile.
// L'app è la stessa: la pagina indica solo lingua (data-page-lang) e strumento da aprire (data-tool).
// Uso: npm run build:web (dopo vite build).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { TOOLS } from '../src/tools.js';

const SITE = 'https://pdf.ikonetsolutions.com';
const LANGS = ['it', 'en', 'es', 'fr', 'de', 'pt', 'ja'];
const SLUGS = {
  reader: 'pdf-reader',
  readAloud: 'read-pdf-aloud',
  scanner: 'pdf-scanner', ocr: 'ocr-pdf', merge: 'merge-pdf', split: 'split-pdf', compress: 'compress-pdf',
  edit: 'edit-pdf', sign: 'sign-pdf', fillForm: 'fill-pdf-form', pdfToWord: 'pdf-to-word', pdfToImg: 'pdf-to-jpg',
  imgToPdf: 'jpg-to-pdf', pdfToText: 'pdf-to-text', organize: 'organize-pdf', rotate: 'rotate-pdf',
  watermark: 'watermark-pdf', pageNumbers: 'add-page-numbers', protect: 'protect-pdf', unlock: 'unlock-pdf',
  redact: 'redact-pdf', metadata: 'edit-pdf-metadata', flatten: 'flatten-pdf', analytics: 'analyze-pdf',
};
const dicts = Object.fromEntries(await Promise.all(LANGS.map(async (l) => [l, (await import(`../src/i18n/locales/${l}.js`)).default])));
const template = await readFile('dist/index.html', 'utf8');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const urlFor = (lang, toolId) => `${SITE}/${lang}/${toolId ? `${SLUGS[toolId]}/` : ''}`;

function alternates(toolId) {
  return [
    ...LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${urlFor(l, toolId)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${urlFor('en', toolId)}" />`,
  ].join('\n    ');
}

function page(lang, toolId) {
  const d = dicts[lang];
  const tool = toolId ? d.tools[toolId] : null;
  const title = tool ? `${tool.title} – ${d.seo.titleSuffix} | DocuMaster` : `DocuMaster – ${d.seo.homeTitle}`;
  const description = tool ? `${tool.desc} ${d.seo.how3}` : d.seo.homeDesc;
  const links = TOOLS.filter((t) => t.id !== toolId)
    .map((t) => `<li><a href="/${lang}/${SLUGS[t.id]}/">${esc(d.tools[t.id].title)}</a></li>`)
    .join('');
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool ? `DocuMaster – ${tool.title}` : 'DocuMaster PDF Studio',
    url: urlFor(lang, toolId),
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    inLanguage: lang,
  };
  const seoBlock = `
  <section class="seo-content" lang="${lang}">
    <h1>${esc(tool ? tool.title : d.seo.homeTitle)}</h1>
    <p>${esc(tool ? tool.desc : d.seo.homeDesc)}</p>
    <h2>${esc(d.seo.howTitle)}</h2>
    <ol><li>${esc(d.seo.how1)}</li><li>${esc(d.seo.how2)}</li><li>${esc(d.seo.how3)}</li></ol>
    <h2>${esc(d.seo.whyTitle)}</h2>
    <p>${esc(d.seo.why)}</p>
    <h2>${esc(d.seo.otherTools)}</h2>
    <ul class="seo-links">${links}</ul>
    <p class="seo-langs">${LANGS.map((l) => `<a href="/${l}/${toolId ? `${SLUGS[toolId]}/` : ''}" hreflang="${l}">${l.toUpperCase()}</a>`).join(' · ')}</p>
  </section>`;

  return template
    .replace('<html lang="en" data-theme="dark">', `<html lang="${lang}" data-theme="dark" data-page-lang="${lang}"${toolId ? ` data-tool="${toolId}" data-slug="${SLUGS[toolId]}"` : ''}>`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${urlFor(lang, toolId)}" />
    ${alternates(toolId)}
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${urlFor(lang, toolId)}" />
    <meta property="og:type" content="website" />
    <script type="application/ld+json">${JSON.stringify(structured)}</script>`)
    .replace('<div id="app"></div>', `<div id="app"></div>${seoBlock}`);
}

const urls = [];
for (const lang of LANGS) {
  await mkdir(`dist/${lang}`, { recursive: true });
  await writeFile(`dist/${lang}/index.html`, page(lang, null));
  urls.push(urlFor(lang, null));
  for (const tool of TOOLS) {
    await mkdir(`dist/${lang}/${SLUGS[tool.id]}`, { recursive: true });
    await writeFile(`dist/${lang}/${SLUGS[tool.id]}/index.html`, page(lang, tool.id));
    urls.push(urlFor(lang, tool.id));
  }
}

// La radice: inglese come x-default, con i collegamenti alle lingue
await writeFile('dist/index.html', page('en', null).replace(' data-page-lang="en"', ''));

const today = new Date().toISOString().slice(0, 10);
await writeFile(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[`${SITE}/`, ...urls]
    .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`
);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`${urls.length + 1} pagine SEO + sitemap.xml + robots.txt`);
