// Testi per il Microsoft Store (13 lingue) ricavati da store-assets/listing.json: niente telefono, File/WhatsApp
// né acquisto unico; c'è l'abbonamento con la prova di 7 giorni. Scrive store-assets/microsoft/listing.json.
// Uso: node scripts/build-msstore-listing.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const WINDOWS = {
  it: {
    fixes: [
      [/con la voce del telefono/, 'con la voce di Windows'],
      [/non lasciano mai il telefono/, 'non lasciano mai il tuo PC'],
      [/Apri i PDF direttamente da File, Mail o WhatsApp con «Apri con DocuMaster»/, 'Apri i PDF direttamente da Esplora file con «Apri con»'],
    ],
    section: 'ABBONAMENTO\nDownload gratuito. Prova tutti gli strumenti gratis per 7 giorni, poi abbonamento mensile o annuale senza pubblicità, da 2,99 € al mese nell\'area euro. Puoi disdire in qualsiasi momento dal tuo account Microsoft.',
  },
  en: {
    fixes: [
      [/with your phone's voice/, 'with your Windows voice'],
      [/never leave your phone/, 'never leave your PC'],
      [/Open PDFs straight from Files, Mail or WhatsApp with “Open in DocuMaster”/, 'Open PDFs straight from File Explorer with “Open with”'],
    ],
    section: 'SUBSCRIPTION\nFree download. Try every tool free for 7 days, then a monthly or yearly subscription with no ads, from €2.99 per month in the euro area. Cancel any time from your Microsoft account.',
  },
  fr: {
    fixes: [
      [/avec la voix du téléphone/, 'avec la voix de Windows'],
      [/ne quittent jamais votre téléphone/, 'ne quittent jamais votre PC'],
      [/Ouvrez vos PDF depuis Fichiers, Mail ou WhatsApp avec « Ouvrir dans DocuMaster »/, 'Ouvrez vos PDF directement depuis l\'Explorateur de fichiers avec « Ouvrir avec »'],
    ],
    section: 'ABONNEMENT\nTéléchargement gratuit. Essayez tous les outils gratuitement pendant 7 jours, puis abonnement mensuel ou annuel sans publicité, à partir de 2,99 € par mois en zone euro. Résiliez à tout moment depuis votre compte Microsoft.',
  },
  es: {
    fixes: [
      [/con la voz del teléfono/, 'con la voz de Windows'],
      [/nunca salen del móvil/, 'nunca salen de tu PC'],
      [/Abre los PDF desde Archivos, Mail o WhatsApp con «Abrir en DocuMaster»/, 'Abre los PDF directamente desde el Explorador de archivos con «Abrir con»'],
    ],
    section: 'SUSCRIPCIÓN\nDescarga gratuita. Prueba todas las herramientas gratis durante 7 días y después suscripción mensual o anual sin anuncios, desde 2,99 € al mes en la zona euro. Cancela cuando quieras desde tu cuenta Microsoft.',
  },
  de: {
    fixes: [
      [/mit der Stimme des Handys/, 'mit der Windows-Stimme'],
      [/verlassen nie dein Handy/, 'verlassen nie deinen PC'],
      [/Öffne PDFs direkt aus Dateien, Mail oder WhatsApp mit „In DocuMaster öffnen“/, 'Öffne PDFs direkt aus dem Datei-Explorer mit „Öffnen mit“'],
    ],
    section: 'ABO\nKostenloser Download. Teste alle Werkzeuge 7 Tage kostenlos, danach Monats- oder Jahresabo ohne Werbung, ab 2,99 € pro Monat im Euroraum. Jederzeit über dein Microsoft-Konto kündbar.',
  },
  pt: {
    fixes: [
      [/com a voz do celular/, 'com a voz do Windows'],
      [/nunca saem do celular/, 'nunca saem do seu PC'],
      [/Abra PDFs direto do app Arquivos, Mail ou WhatsApp com “Abrir no DocuMaster”/, 'Abra PDFs direto do Explorador de Arquivos com “Abrir com”'],
    ],
    section: 'ASSINATURA\nDownload grátis. Experimente todas as ferramentas grátis por 7 dias e depois assinatura mensal ou anual sem anúncios, a partir de 2,99 € por mês na zona do euro. Cancele quando quiser na sua conta Microsoft.',
  },
  ja: {
    fixes: [
      [/スマホの音声で読み上げ/, 'Windowsの音声で読み上げ'],
      [/書類がスマホの外に出ることはありません/, '書類がPCの外に出ることはありません'],
      [/「ファイル」「メール」「LINE」などから「DocuMasterで開く」で直接開けます/, 'エクスプローラーの「プログラムから開く」で直接開けます'],
    ],
    section: 'サブスクリプション\n無料でダウンロードできます。すべてのツールを7日間無料でお試しいただき、その後は広告なしの月額または年額プラン（ユーロ圏で月額2.99ユーロから）をご利用ください。Microsoftアカウントからいつでも解約できます。',
  },
};

const source = JSON.parse(await readFile('store-assets/listing.json', 'utf8'));
const out = {};
for (const [locale, entry] of Object.entries(source)) {
  const w = WINDOWS[locale.slice(0, 2)];
  let description = entry.description.replace(/\n\s*\n\s*DocuMaster Pro\s*\n[^]*$/i, '');
  for (const [from, to] of w.fixes) {
    if (!from.test(description)) throw new Error(`${locale}: ${from}`);
    description = description.replace(from, to);
  }
  out[locale] = {
    name: 'DocuMaster PDF Studio',
    shortDescription: entry.subtitle,
    description: `${description}\n\n${w.section}`,
    // Il Microsoft Store accetta al massimo 7 termini di ricerca
    searchTerms: entry.keywords.split(',').map((k) => k.trim()).filter(Boolean).slice(0, 7),
  };
}
await mkdir('store-assets/microsoft', { recursive: true });
await writeFile('store-assets/microsoft/listing.json', `${JSON.stringify(out, null, 2)}\n`);
console.log(`${Object.keys(out).length} lingue`);
