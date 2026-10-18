// Versione web (offlinepdfstudio.com): una pagina per ogni lingua e per ogni strumento,
// es. /it/merge-pdf/ e /ja/compress-pdf/, con titolo, descrizione, hreflang e testo indicizzabile.
// L'app è la stessa: la pagina indica solo lingua (data-page-lang) e strumento da aprire (data-tool).
// Testi lunghi (uso, passaggi, domande frequenti, chi siamo, contatti, guide) in seo-content/<lingua>.mjs.
// Uso: npm run build:web (dopo vite build).
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { TOOLS } from '../src/tools.js';

const SITE = 'https://offlinepdfstudio.com';
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
const exists = (p) => access(p).then(() => true, () => false);
const content = Object.fromEntries(
  await Promise.all(
    LANGS.map(async (l) => [l, (await exists(new URL(`../seo-content/${l}.mjs`, import.meta.url))) ? (await import(`../seo-content/${l}.mjs`)).default : null])
  )
);
const template = await readFile('dist/index.html', 'utf8');
// AdSense solo sul sito (questa build non finisce nell'app nativa, che usa AdMob)
const ADSENSE_CLIENT = 'ca-pub-1151868778464777';
const ADSENSE_TAG = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const urlFor = (lang, toolId) => `${SITE}/${lang}/${toolId ? `${SLUGS[toolId]}/` : ''}`;
const today = new Date().toISOString().slice(0, 10);
const DONATE_URL = 'https://www.paypal.com/donate/?hosted_button_id=P4M7TSSVDX2F8';

function alternates(pathFor) {
  return [
    ...LANGS.filter((l) => pathFor(l)).map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}${pathFor(l)}" />`),
    pathFor('en') ? `<link rel="alternate" hreflang="x-default" href="${SITE}${pathFor('en')}" />` : '',
  ].join('\n    ');
}

/** Link in fondo a ogni pagina: chi siamo, contatti, privacy, guide. */
function footerLinks(lang) {
  const c = content[lang];
  if (!c) return '';
  const L = c.labels;
  const guides = c.guides?.length ? ` · <a href="/${lang}/guides/">${esc(L.guides)}</a>` : '';
  const donate = L.donate ? ` · <a href="${DONATE_URL}" target="_blank" rel="noopener">${esc(L.donate)}</a>` : '';
  return `<p class="seo-footer"><a href="/${lang}/about/">${esc(L.about)}</a> · <a href="/${lang}/contact/">${esc(L.contact)}</a> · <a href="/privacy.html">${esc(L.privacy)}</a>${guides}${donate}</p>`;
}

/** Sezioni lunghe per uno strumento (se il testo esiste in questa lingua). */
function toolDetails(lang, toolId) {
  const c = content[lang]?.tools?.[toolId];
  if (!c) return { html: '', faq: null };
  const L = content[lang].labels;
  const guide = content[lang].guides?.find((g) => g.tool === toolId);
  const html = `
    <p>${esc(c.intro)}</p>
    <h2>${esc(L.uses)}</h2>
    <ul>${c.uses.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>
    <h2>${esc(L.steps)}</h2>
    <ol>${c.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <h2>${esc(L.faq)}</h2>
    ${c.faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('\n    ')}
    <p class="seo-tip"><strong>${esc(L.tip)}:</strong> ${esc(c.tip)}</p>
    ${guide ? `<p><a href="/${lang}/guides/${guide.slug}/">${esc(L.readGuide)}: ${esc(guide.title)}</a></p>` : ''}`;
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  return { html, faq };
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
  const details = toolId ? toolDetails(lang, toolId) : { html: '', faq: null };
  // Home: elenco ragionato degli strumenti con la loro descrizione e le guide
  const homeExtra =
    !toolId && content[lang]
      ? `
    <h2>${esc(d.seo.otherTools)}</h2>
    <ul class="seo-tool-list">${TOOLS.map((t) => `<li><a href="/${lang}/${SLUGS[t.id]}/"><strong>${esc(d.tools[t.id].title)}</strong></a> – ${esc(d.tools[t.id].desc)}</li>`).join('')}</ul>
    ${content[lang].guides?.length ? `<h2>${esc(content[lang].labels.guides)}</h2><ul>${content[lang].guides.map((g) => `<li><a href="/${lang}/guides/${g.slug}/">${esc(g.title)}</a></li>`).join('')}</ul>` : ''}
    <h2>${esc(content[lang].about.title)}</h2>
    <p>${esc(content[lang].about.paragraphs[0])}</p>`
      : '';
  const seoBlock = `
  <section class="seo-content" lang="${lang}">
    <h1>${esc(tool ? tool.title : d.seo.homeTitle)}</h1>
    <p>${esc(tool ? tool.desc : d.seo.homeDesc)}</p>
    ${details.html || `<h2>${esc(d.seo.howTitle)}</h2>
    <ol><li>${esc(d.seo.how1)}</li><li>${esc(d.seo.how2)}</li><li>${esc(d.seo.how3)}</li></ol>`}
    <h2>${esc(d.seo.whyTitle)}</h2>
    <p>${esc(d.seo.why)}</p>
    ${homeExtra}
    ${toolId || !content[lang] ? `<h2>${esc(d.seo.otherTools)}</h2>
    <ul class="seo-links">${links}</ul>` : ''}
    <p class="seo-langs">${LANGS.map((l) => `<a href="/${l}/${toolId ? `${SLUGS[toolId]}/` : ''}" hreflang="${l}">${l.toUpperCase()}</a>`).join(' · ')}</p>
    ${footerLinks(lang)}
  </section>`;

  return template
    .replace('<html lang="en" data-theme="dark">', `<html lang="${lang}" data-theme="dark" data-page-lang="${lang}"${toolId ? ` data-tool="${toolId}" data-slug="${SLUGS[toolId]}"` : ''}>`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${urlFor(lang, toolId)}" />
    ${alternates((l) => `/${l}/${toolId ? `${SLUGS[toolId]}/` : ''}`)}
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${urlFor(lang, toolId)}" />
    <meta property="og:type" content="website" />
    <script type="application/ld+json">${JSON.stringify(structured)}</script>
    ${details.faq ? `<script type="application/ld+json">${JSON.stringify(details.faq)}</script>` : ''}
    <meta name="google-adsense-account" content="${ADSENSE_CLIENT}" />
    ${ADSENSE_TAG}`)
    .replace('<div id="app"></div>', `<div id="app"></div>${seoBlock}`);
}

/** Pagine di solo testo (chi siamo, contatti, guide): leggere, senza l'app. */
function textPage({ lang, path, title, description, body, pathFor }) {
  const c = content[lang];
  const home = dicts[lang].seo.homeTitle;
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} | DocuMaster</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${SITE}${path}" />
  ${pathFor ? alternates(pathFor) : ''}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="google-adsense-account" content="${ADSENSE_CLIENT}" />
  ${ADSENSE_TAG}
  <style>
    :root { color-scheme: dark light; }
    body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; background: #090d16; color: #cbd5e1; margin: 0; line-height: 1.7; }
    header, main, footer { max-width: 760px; margin: 0 auto; padding: 0 16px; }
    header { padding-top: 20px; } header a { color: #fff; font-weight: 700; text-decoration: none; font-size: 1.1rem; }
    main { padding-bottom: 32px; }
    h1 { color: #fff; line-height: 1.25; margin-top: 28px; } h2 { color: #a5b4fc; margin-top: 1.8em; font-size: 1.2rem; }
    a { color: #a5b4fc; } .cta { display: inline-block; margin: 12px 0; padding: 10px 18px; border-radius: 10px; background: #6366f1; color: #fff; text-decoration: none; font-weight: 600; }
    .meta { color: #64748b; font-size: .85rem; } footer { border-top: 1px solid #1e293b; padding: 20px 16px 40px; font-size: .9rem; }
  </style>
</head>
<body>
  <header><a href="/${lang}/">DocuMaster PDF Studio</a> <span class="meta">· ${esc(home)}</span></header>
  <main>
${body}
  </main>
  <footer>${footerLinks(lang)}<p class="meta">© ${new Date().getFullYear()} Ikonet Solutions</p></footer>
</body>
</html>
`;
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

  const c = content[lang];
  if (!c) continue;
  const withContent = (key) => (l) => (content[l]?.[key] ? `/${l}/${key}/` : null);
  for (const key of ['about', 'contact']) {
    const p = c[key];
    const mail = (s) => esc(s).replace(/konechocoproduction@gmail\.com/g, '<a href="mailto:konechocoproduction@gmail.com">konechocoproduction@gmail.com</a>');
    const body = `    <h1>${esc(p.title)}</h1>\n${p.paragraphs.map((x) => `    <p>${mail(x)}</p>`).join('\n')}\n    <p><a class="cta" href="/${lang}/">${esc(c.labels.openTool)}</a></p>`;
    await mkdir(`dist/${lang}/${key}`, { recursive: true });
    await writeFile(`dist/${lang}/${key}/index.html`, textPage({ lang, path: `/${lang}/${key}/`, title: p.title, description: p.description, body, pathFor: withContent(key) }));
    urls.push(`${SITE}/${lang}/${key}/`);
  }
  if (c.guides?.length) {
    const list = `    <h1>${esc(c.labels.guides)}</h1>\n    <ul>${c.guides.map((g) => `<li><a href="/${lang}/guides/${g.slug}/">${esc(g.title)}</a><br /><span class="meta">${esc(g.description)}</span></li>`).join('')}</ul>`;
    await mkdir(`dist/${lang}/guides`, { recursive: true });
    await writeFile(`dist/${lang}/guides/index.html`, textPage({ lang, path: `/${lang}/guides/`, title: c.labels.guides, description: c.guides.map((g) => g.title).join(' · '), body: list }));
    urls.push(`${SITE}/${lang}/guides/`);
    for (const g of c.guides) {
      const article = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: g.title,
        description: g.description,
        inLanguage: lang,
        dateModified: today,
        author: { '@type': 'Organization', name: 'Ikonet Solutions' },
        publisher: { '@type': 'Organization', name: 'Ikonet Solutions' },
      };
      const body = `    <h1>${esc(g.title)}</h1>
    <p class="meta">${esc(c.labels.updated)}: ${today}</p>
    <p>${esc(g.description)}</p>
${g.sections.map(([h, t]) => `    <h2>${esc(h)}</h2>\n    <p>${esc(t)}</p>`).join('\n')}
    <p><a class="cta" href="/${lang}/${SLUGS[g.tool]}/">${esc(c.labels.openTool)}: ${esc(dicts[lang].tools[g.tool].title)}</a></p>
    <script type="application/ld+json">${JSON.stringify(article)}</script>`;
      await mkdir(`dist/${lang}/guides/${g.slug}`, { recursive: true });
      await writeFile(`dist/${lang}/guides/${g.slug}/index.html`, textPage({ lang, path: `/${lang}/guides/${g.slug}/`, title: g.title, description: g.description, body }));
      urls.push(`${SITE}/${lang}/guides/${g.slug}/`);
    }
  }
}

// La radice: inglese come x-default, con i collegamenti alle lingue
await writeFile('dist/index.html', page('en', null).replace(' data-page-lang="en"', ''));

await writeFile(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[`${SITE}/`, ...urls]
    .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`
);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`${urls.length + 1} pagine SEO + sitemap.xml + robots.txt`);
