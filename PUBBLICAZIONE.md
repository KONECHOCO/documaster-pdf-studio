# DocuMaster PDF Studio — stato della pubblicazione

Aggiornato al 14/10/2026.

## ✅ Fatto

- **App iOS** inviata in revisione il 14/10/2026: App Store Connect id `6822578601`, bundle `com.ikonet.documaster`, versione 1.0.0 (build 1), con l'acquisto **DocuMaster Pro** (`documaster_pro`, non consumabile, 2,99 €, id `6822584073`) nello stesso invio.
- **Metadati in 13 localizzazioni** ottimizzate per la ricerca (`store-assets/listing.json`): it, en-US, en-GB, en-AU, en-CA, fr-FR, fr-CA, es-ES, es-MX, de-DE, pt-BR, pt-PT, ja. Le parole chiave non ripetono le parole di nome e sottotitolo. en-GB è indicizzata anche in IT, FR, DE ed ES; es-MX anche negli USA.
- **156 screenshot** (iPhone 6,9" e iPad 13", per ogni localizzazione). Si rigenerano con `scripts/capture-store-screenshots.mjs`.
- **App Privacy** pubblicata. Dati dovuti ad AdMob: identificatore del dispositivo, posizione approssimativa, interazioni, dati pubblicitari, diagnostica. Acquisti per la funzionalità.
- **Disponibilità**: 174 paesi, **Francia esclusa** (vedi sotto).
- **Cifratura**: algoritmi standard (AES-256 di QPDF) senza Francia, quindi Apple la considera esente. `ITSAppUsesNonExemptEncryption=false` è nell'Info.plist.
- **AdMob**:
  - app "DocuMaster iOS" (`~2367380632`) e "DocuMaster Android" (`~9100309947`);
  - unità banner, interstitial e apertura app in `.env.production`;
  - messaggio GDPR pubblicato (7 lingue, "Nega il consenso" attivo).
- **Codemagic**: app `6ace8be37cdadaa492a14300`. Il workflow `ios-app-store` funziona; profilo iOS in `ios/profiles/`.
- **Sito / versione web**: https://offlinepdfstudio.com (dal 16/10/2026; pdf.ikonetsolutions.com rimanda qui ma serve ancora app-ads.txt, privacy e supporto) (ivoiro-server, `/var/www/documaster`, HTTPS Let's Encrypt).
  - Contiene l'app web completa, 162 pagine SEO (7 lingue × 22 strumenti + home), `sitemap.xml`, privacy, supporto e `app-ads.txt`.
  - Per pubblicare: `bash deploy/deploy-web.sh`.
- **Statistiche del sito su Telegram** (dal 16/10/2026): bot @DocuMasterStats_bot, report ogni mattina e comandi /oggi /ieri /settimana.
  - Lo script è `deploy/stats/documaster_stats.py` (sul server in `/opt/documaster-stats`, cron in `/etc/cron.d/documaster-stats`) e legge `/var/log/nginx/documaster.log`.
  - Report PDF (`deploy/stats/documaster_report.py`): ogni lunedì (7 giorni) e il 1° del mese (30 giorni), oppure con /pdf e /pdfmese. Paesi da DB-IP Country Lite (CC BY 4.0, aggiornato ogni mese); i riepiloghi giornalieri restano in `/var/lib/documaster-stats/history.json`.
  - Guadagni pubblicitari nel report: da collegare dopo l'approvazione AdSense/AdMob (autorizzazione Google una tantum); il report legge `/var/lib/documaster-stats/ads.json`.
  - Per cambiare il codice del bot: `powershell -ExecutionPolicy Bypass -File deploy\stats\collega-telegram.ps1`.

## ⏳ Da fare

1. **Android / Google Play** — app creata su Play Console il 17/10/2026 (id `4976308306820947948`, account personale: serve un **test chiuso con 12 tester per 14 giorni** prima della produzione). Scheda en-US salvata in bozza (testi, icona, grafica, 7 screenshot `*-android-1080x1920.png`).
   - Chiave di caricamento creata il 17/10/2026: `C:\Users\rebic\Desktop\master\DOCUMASTER_ANDROID_SIGNING\documaster-upload.jks` (alias `documaster`, password in `keystore-info.txt` nella stessa cartella). **Non perderla.**
   - AAB 1.0.0 (versionCode 1) costruito in locale: `DOCUMASTER_ANDROID_SIGNING\documaster-1.0.0-1.aab`. Build: `npm run build`, `cap sync android` (Node 22), poi `gradlew bundleRelease` con `JAVA_HOME` = jbr di Android Studio e le variabili `CM_KEYSTORE_PATH`, `CM_KEYSTORE_PASSWORD`, `CM_KEY_ALIAS`, `CM_KEY_PASSWORD`, `BUILD_NUMBER`.
   - Poi avvio la build `android-release` (AAB).
   - Su Play Console: creare l'app `com.ikonet.documaster`, il prodotto in-app `documaster_pro` a 2,99 € e fare il primo caricamento dell'AAB a mano.
   - Fatto il 17/10/2026: scheda en-US, categoria Produttività, contatti, privacy, annunci, accesso, ID pubblicità, governo/finanza/salute, pubblico 18+, sicurezza dei dati; prodotto `documaster_pro` attivo (2,45 € + IVA = 2,99 € in Italia).
   - Test chiusi: «Alpha» (gruppo `testers-community@googlegroups.com`) e «Test chiuso tester4» (elenco tester4), 178 paesi senza Francia, release 1 (1.0.0) in bozza in entrambi.
   - IARC fatto, release approvate: **entrambi i test chiusi sono attivi dal 17/10/2026 21:49** (1.0.0 disponibile per i tester). Dopo 14 giorni con almeno 12 tester attivi (dal 31/10/2026) si può chiedere l'accesso alla produzione. Mancano le traduzioni della scheda Play.
   - Testi e grafiche sono pronti in `store-assets/listing.json` (campi `playShort` e `description`) e in `store-assets/play/`.
2. **AdMob → "Aggiungi store"** sulle due app, appena App Store e Play le approvano. Fino ad allora la pubblicazione degli annunci resta limitata.
3. **Francia**: dichiarazione di cifratura ANSSI **depositata il 14/10/2026** (demarche.numerique.gouv.fr, dossier n° 34672087, documenti in `docs/anssi/`). Quando arriva l'attestation con il numero di pratica:
   - caricarla in App Store Connect;
   - rimettere la Francia nella disponibilità;
   - rivedere `ITSAppUsesNonExemptEncryption`.
4. **AdSense per il sito**: `offlinepdfstudio.com` verificato e **revisione richiesta il 16/10/2026** (codice `ca-pub-1151868778464777` già su tutte le pagine, `ads.txt` presente).
   - Dopo l'approvazione: creare un'unità Display, mettere `VITE_ADSENSE_SLOT` in `.env.production` e ripubblicare; attivare il messaggio GDPR in "Privacy e messaggi".
   - AdSense chiede anche di verificare l'indirizzo (PIN per posta) per sbloccare i pagamenti.
5. **Google Search Console**: proprietà `https://offlinepdfstudio.com/` verificata (file `public/google6797cf6280bde93d.html`, da non cancellare) e sitemap inviata il 16/10/2026.
6. **Prossima versione** (dopo l'esito di Apple sulla 1.0.0). Contiene già:
   - il link "Opzioni privacy" (revoca del consenso GDPR, richiesto da Google);
   - **Lettore PDF** e **Leggi PDF ad alta voce** (voce del sistema tramite `@capacitor-community/text-to-speech`, OCR per le pagine scansionate). I PDF aperti da altre app ora si aprono nel lettore.
   - Da fare all'invio: aggiornare descrizioni e parole chiave in `store-assets/listing.json` (lettore PDF, leggere ad alta voce) e rifare gli screenshot con il lettore.
