# DocuMaster PDF Studio Pro 📄⚡

> **La suite PDF professionale tutto-in-uno: modifica, converti, unisci, comprimi, compila moduli, scansiona da fotocamera e analizza documenti con grafici interattivi.**  
> *100% Client-Side Privacy Engine • Zero dati inviati al server • By IkonetSolutions 2026*

---

## 🌟 Caratteristiche Principali

- **📸 Scanner Documenti Intelligente (Fotocamera Live & Upload)**
  - Acquisizione in tempo reale tramite webcam o fotocamera smartphone con griglia guida.
  - Filtri professionali: *Documento B&W (Nitido per binarizzazione e rimozione ombre)*, *Scala di Grigi*, *Colore Esaltato*, *Originale*.
  - Scansione multipagina, rotazione e conversione istantanea in PDF impaginato A4/Letter.

- **📝 Compila Moduli PDF (Fill & Sign)**
  - Rilevamento automatico e compilazione di moduli interattivi nativi (**AcroForms**).
  - Modalità **Fill & Sign** per moduli cartacei o scansionati: inserisci Testo (Aa), Spunte (✓), Crocette (✗), Data odierna automatica e Firme rapide in qualsiasi riga o casella.

- **📊 Grafici & Document Inspector Professionale**
  - Dashboard analitica basata su **Chart.js**.
  - **Grafico a Ciambella**: densità testo vs elementi grafici vs spazio bianco.
  - **Grafico a Barre**: simulazione comparativa del risparmio di compressione (KB e %).
  - **Grafico Polare**: distribuzione geometrica orientamento pagine (Verticale vs Orizzontale).
  - Diagnostica di conformità e suggerimenti di ottimizzazione dello spazio.

- **✍️ Firma Elettronica (eSign)**
  - Disegno a mano libera con curve bezier fluide e selezione inchiostro (Blu Reale, Nero, Rosso).
  - Firma calligrafica automatica da testo digitato.
  - Caricamento immagine firma con rimozione sfondo trasparente.
  - Posizionamento e ridimensionamento su qualsiasi pagina del PDF.

- **✏️ Editor Visivo PDF**
  - Aggiunta di testi personalizzati, penna a mano libera, evidenziatore semitrasparente, forme geometriche (rettangoli, cerchi) e timbri ufficiali (*APPROVATO, CONFIDENZIALE, BOZZA, PAGATO, URGENTE*).

- **🔄 Suite Completa Strumenti PDF (TinyWow & iLovePDF Style)**
  - **Unisci PDF**: combina più file nell'ordine desiderato con anteprima.
  - **Dividi PDF**: estrai singole pagine o intervalli personalizzati.
  - **Comprimi PDF**: compressione leggera, consigliata ed estrema.
  - **Organizza Pagine**: griglia visuale drag & drop per riordinare, ruotare o eliminare pagine.
  - **Ruota PDF**: rotazione rapida a 90°, 180° o 270°.
  - **PDF in Immagini**: esporta ogni pagina in JPG/PNG ad alta risoluzione o pacchetto ZIP.
  - **Immagini in PDF**: unisci foto in un PDF con margini e orientamento.
  - **Aggiungi Filigrana**: testo trasparente ruotabile su tutte le pagine.
  - **Numerazione Pagine**: numerazione personalizzata (es. *Pagina X di Y*).
  - **Estrai Testo & OCR**: estrazione del testo e statistiche di lettura.
  - **Proteggi & Sblocca PDF**: crittografia e sicurezza.
  - **Appiattisci PDF (Flatten)**: fusione di moduli e annotazioni in livelli non alterabili.

- **🌍 Supporto Multi-Lingua (i18n)**
  - 🇮🇹 Italiano
  - 🇬🇧 English
  - 🇪🇸 Español
  - 🇫🇷 Français
  - 🇩🇪 Deutsch
  - 🇵🇹 Português

- **🔒 100% Privacy Locale (Client-Side)**
  - Nessun file viene mai caricato su server esterni. Tutta l'elaborazione avviene localmente nella memoria del browser tramite WebAssembly e canvas.

---

## 🚀 Installazione e Avvio Locale

### Prerequisiti
- **Node.js** v18+ 
- **npm** o **pnpm** / **yarn**

### Comandi

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev

# Compila per produzione
npm run build
```

---

## 🛠️ Stack Tecnologico

- **Framework & Bundler**: Vite (ESNext)
- **PDF Engine**: `pdf-lib`, Mozilla `pdfjs-dist`
- **Archiviazione ZIP**: `jszip`
- **Grafici**: `Chart.js`
- **Icone & UI**: Icone SVG vettoriali moderne, CSS Vanilla con Glassmorphism & Dark/Light mode
- **Animazioni**: `canvas-confetti`

---

## 📄 Licenza

Distribuito con licenza MIT.  
**By IkonetSolutions 2026**
