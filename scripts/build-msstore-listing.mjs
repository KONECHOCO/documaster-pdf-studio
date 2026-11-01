// Testi per il Microsoft Store (13 lingue) ricavati da store-assets/listing.json: niente telefono, File/WhatsApp
// né acquisto unico; c'è l'abbonamento con la prova di 3 giorni. Scrive store-assets/microsoft/listing.json.
// Uso: node scripts/build-msstore-listing.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const WINDOWS = {
  it: {
    fixes: [
      [/con la voce del telefono/, 'con la voce di Windows'],
      [/non lasciano mai il telefono/, 'non lasciano mai il tuo PC'],
      [/Apri i PDF direttamente da File, Mail o WhatsApp con «Apri con DocuMaster»/, 'Apri i PDF direttamente da Esplora file con «Apri con»'],
    ],
    section: 'ABBONAMENTO\nDownload gratuito con 3 giorni di prova di tutti gli strumenti, senza carta di credito. Poi 2,99 € al mese o 25 € all\'anno, senza pubblicità. Puoi disdire in qualsiasi momento dal tuo account Microsoft.',
  },
  en: {
    fixes: [
      [/with your phone's voice/, 'with your Windows voice'],
      [/never leave your phone/, 'never leave your PC'],
      [/Open PDFs straight from Files, Mail or WhatsApp with “Open in DocuMaster”/, 'Open PDFs straight from File Explorer with “Open with”'],
    ],
    section: 'SUBSCRIPTION\nFree download with a 3-day trial of every tool, no credit card needed. Then €2.99 per month or €25 per year, with no ads. Cancel any time from your Microsoft account.',
  },
  fr: {
    fixes: [
      [/avec la voix du téléphone/, 'avec la voix de Windows'],
      [/ne quittent jamais votre téléphone/, 'ne quittent jamais votre PC'],
      [/Ouvrez vos PDF depuis Fichiers, Mail ou WhatsApp avec « Ouvrir dans DocuMaster »/, 'Ouvrez vos PDF directement depuis l\'Explorateur de fichiers avec « Ouvrir avec »'],
    ],
    section: 'ABONNEMENT\nTéléchargement gratuit avec 3 jours d\'essai de tous les outils, sans carte bancaire. Ensuite 2,99 € par mois ou 25 € par an, sans publicité. Résiliez à tout moment depuis votre compte Microsoft.',
  },
  es: {
    fixes: [
      [/con la voz del teléfono/, 'con la voz de Windows'],
      [/nunca salen del móvil/, 'nunca salen de tu PC'],
      [/Abre los PDF desde Archivos, Mail o WhatsApp con «Abrir en DocuMaster»/, 'Abre los PDF directamente desde el Explorador de archivos con «Abrir con»'],
    ],
    section: 'SUSCRIPCIÓN\nDescarga gratuita con 3 días de prueba de todas las herramientas, sin tarjeta. Después, 2,99 € al mes o 25 € al año, sin anuncios. Cancela cuando quieras desde tu cuenta Microsoft.',
  },
  de: {
    fixes: [
      [/mit der Stimme des Handys/, 'mit der Windows-Stimme'],
      [/verlassen nie dein Handy/, 'verlassen nie deinen PC'],
      [/Öffne PDFs direkt aus Dateien, Mail oder WhatsApp mit „In DocuMaster öffnen“/, 'Öffne PDFs direkt aus dem Datei-Explorer mit „Öffnen mit“'],
    ],
    section: 'ABO\nKostenloser Download mit 3 Tagen Testphase für alle Werkzeuge, ohne Kreditkarte. Danach 2,99 € pro Monat oder 25 € pro Jahr, ohne Werbung. Jederzeit über dein Microsoft-Konto kündbar.',
  },
  pt: {
    fixes: [
      [/com a voz do celular/, 'com a voz do Windows'],
      [/nunca saem do celular/, 'nunca saem do seu PC'],
      [/Abra PDFs direto do app Arquivos, Mail ou WhatsApp com “Abrir no DocuMaster”/, 'Abra PDFs direto do Explorador de Arquivos com “Abrir com”'],
    ],
    section: 'ASSINATURA\nDownload grátis com 3 dias de teste de todas as ferramentas, sem cartão. Depois, 2,99 € por mês ou 25 € por ano, sem anúncios. Cancele quando quiser na sua conta Microsoft.',
  },
  ja: {
    fixes: [
      [/スマホの音声で読み上げ/, 'Windowsの音声で読み上げ'],
      [/書類がスマホの外に出ることはありません/, '書類がPCの外に出ることはありません'],
      [/「ファイル」「メール」「LINE」などから「DocuMasterで開く」で直接開けます/, 'エクスプローラーの「プログラムから開く」で直接開けます'],
    ],
    section: 'サブスクリプション\n無料でダウンロードでき、すべてのツールを3日間お試しいただけます（クレジットカード不要）。その後は月額2.99ユーロまたは年額25ユーロで、広告はありません。Microsoftアカウントからいつでも解約できます。',
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
