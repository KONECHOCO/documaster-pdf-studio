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
- **Sito / versione web**: https://pdf.ikonetsolutions.com (ivoiro-server, `/var/www/documaster`, HTTPS Let's Encrypt).
  - Contiene l'app web completa, 162 pagine SEO (7 lingue × 22 strumenti + home), `sitemap.xml`, privacy, supporto e `app-ads.txt`.
  - Per pubblicare: `bash deploy/deploy-web.sh`.

## ⏳ Da fare

1. **Android / Google Play**
   - Generare un keystore e caricarlo **tu** su Codemagic (Code signing identities → Android keystores) con il nome `documaster_android`. Le password non le inserisco io.
   - Poi avvio la build `android-release` (AAB).
   - Su Play Console: creare l'app `com.ikonet.documaster`, il prodotto in-app `documaster_pro` a 2,99 € e fare il primo caricamento dell'AAB a mano.
   - Testi e grafiche sono pronti in `store-assets/listing.json` (campi `playShort` e `description`) e in `store-assets/play/`.
2. **AdMob → "Aggiungi store"** sulle due app, appena App Store e Play le approvano. Fino ad allora la pubblicazione degli annunci resta limitata.
3. **Francia**: dichiarazione di cifratura ANSSI **depositata il 14/10/2026** (demarche.numerique.gouv.fr, dossier n° 34672087, documenti in `docs/anssi/`). Quando arriva l'attestation con il numero di pratica:
   - caricarla in App Store Connect;
   - rimettere la Francia nella disponibilità;
   - rivedere `ITSAppUsesNonExemptEncryption`.
4. **AdSense per il sito**:
   - richiedere l'approvazione per `pdf.ikonetsolutions.com` su adsense.google.com;
   - poi mettere `VITE_ADSENSE_CLIENT` e `VITE_ADSENSE_SLOT` in `.env.production` e ripubblicare. Gli spazi pubblicitari sono già nel codice.
5. **Google Search Console**: aggiungere il dominio e inviare `https://pdf.ikonetsolutions.com/sitemap.xml`.
6. **Prossima versione (1.0.1)**: contiene già il link "Opzioni privacy" (revoca del consenso GDPR, richiesto da Google). Va in build con il prossimo aggiornamento.
