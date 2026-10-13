// Multi-language translation dictionary for DocuMaster PDF Studio
export const translations = {
  it: {
    // Header & Meta
    appTitle: "DocuMaster PDF Studio",
    tagline: "La suite PDF professionale tutto-in-uno: modifica, converti, scansiona e analizza.",
    badgePrivacy: "100% Privacy Locale • Nessun file caricato su server",
    searchPlaceholder: "Cerca tra oltre 15 strumenti PDF...",
    themeDark: "Modalità Scura",
    themeLight: "Modalità Chiara",
    language: "Lingua",

    // Categories
    catAll: "Tutti gli Strumenti",
    catPopular: "Popolari",
    catScan: "Scanner & Foto",
    catEdit: "Modifica & Firma",
    catOrganize: "Organizza & Pagine",
    catConvert: "Converti",
    catSecurity: "Sicurezza",
    catAnalytics: "Grafici & Analisi",

    // Tools
    tools: {
      scanner: {
        title: "Scanner Documenti",
        desc: "Scansiona da fotocamera o carica foto, applica filtri professionali B&W e crea PDF multipagina.",
        badge: "Fotocamera / AI"
      },
      analytics: {
        title: "Grafici & Document Inspector",
        desc: "Grafici professionali: densità contenuti, analisi risparmio compressione, orientamento e audit.",
        badge: "Grafici Pro"
      },
      merge: {
        title: "Unisci PDF",
        desc: "Combina più file PDF in un unico documento nell'ordine desiderato con anteprima.",
        badge: "Più Usato"
      },
      split: {
        title: "Dividi ed Estrai PDF",
        desc: "Estrai pagine specifiche o separa il PDF in singoli documenti con selezione visiva.",
        badge: "Popolare"
      },
      compress: {
        title: "Comprimi PDF",
        desc: "Riduci le dimensioni del file ottimizzando immagini e vettori con grafico del risparmio.",
        badge: "Risparmio Spazio"
      },
      edit: {
        title: "Modifica & Annota PDF",
        desc: "Aggiungi testi, disegni a mano libera, evidenziatore, forme geometriche e timbri approvati.",
        badge: "Interattivo"
      },
      fillForm: {
        title: "Compila Moduli PDF",
        desc: "Compila moduli interattivi (AcroForms) o inserisci testi, spunte (✓), crocette (✗), date e firme su qualsiasi documento.",
        badge: "Compilazione Moduli"
      },
      sign: {
        title: "Firma Elettronica (eSign)",
        desc: "Disegna la tua firma, digitalizza da testo calligrafico o carica timbro e posizionalo sul PDF.",
        badge: "Firma Digitale"
      },
      organize: {
        title: "Organizza & Riordina Pagine",
        desc: "Griglia visiva drag & drop: riordina, ruota, duplica ed elimina pagine in tempo reale.",
        badge: "Visivo"
      },
      rotate: {
        title: "Ruota PDF",
        desc: "Ruota le pagine di 90°, 180° o 270° in senso orario o antiorario con un clic.",
        badge: "Rapido"
      },
      pdfToImg: {
        title: "PDF in Immagini (JPG / PNG)",
        desc: "Converti ogni pagina in immagini ad altissima risoluzione con download singolo o archivio ZIP.",
        badge: "Alta Risoluzione"
      },
      imgToPdf: {
        title: "Immagini in PDF",
        desc: "Unisci foto JPG, PNG e WebP in un PDF con margini e orientamento personalizzabili.",
        badge: "Multi-Immagine"
      },
      watermark: {
        title: "Aggiungi Filigrana",
        desc: "Inserisci un testo o logo personalizzato con trasparenza, rotazione e anteprima istantanea.",
        badge: "Copyright"
      },
      pageNumbers: {
        title: "Numera Pagine",
        desc: "Aggiungi numeri di pagina personalizzati scegliendo formato, posizione, font e margini.",
        badge: "Layout"
      },
      protect: {
        title: "Proteggi & Password",
        desc: "Aggiungi cifratura e password di sicurezza per impedire accessi non autorizzati.",
        badge: "Sicurezza"
      },
      unlock: {
        title: "Sblocca PDF",
        desc: "Rimuovi restrizioni e protezioni da file protetti di cui possiedi la password.",
        badge: "Accesso"
      },
      pdfToText: {
        title: "Estrai Testo & OCR",
        desc: "Estrai tutto il testo selezionabile o trascritto con statistiche di parole e lettura.",
        badge: "Export TXT"
      },
      flatten: {
        title: "Appiattisci PDF (Flatten)",
        desc: "Blocca moduli e annotazioni trasformandoli in elementi non modificabili permanenti.",
        badge: "Certifica"
      }
    },

    // Scanner UI
    fillFormModal: {
      title: "Compila Modulo PDF (Fill and Sign)",
      subtitle: "Compila campi modulo interattivi o clicca in qualsiasi punto del documento per inserire testi, spunte, date e firme.",
      toolText: "Testo (Aa)",
      toolCheck: "Spunta (✓)",
      toolCross: "Crocetta (✗)",
      toolDate: "Data Odierna",
      toolSign: "Firma Rapida",
      acroFound: "Campi modulo interattivi rilevati nel PDF. Puoi compilarli direttamente o aggiungere testo.",
      acroNotFound: "Modulo standard: seleziona uno strumento sopra e clicca in qualunque riga per scrivere.",
      downloadFilled: "Salva e Scarica PDF Compilato",
      deleteElement: "Elimina",
      clearAll: "Cancella Modifiche",
      fontSize: "Dimensione:"
    },
    scannerModal: {
      title: "Scanner Documenti Avanzato",
      subtitle: "Scatta con la fotocamera o carica scansioni, applica filtri nitidi e genera PDF.",
      tabCamera: "Fotocamera Live",
      tabUpload: "Carica Immagini",
      startCamera: "Attiva Fotocamera",
      stopCamera: "Ferma Fotocamera",
      switchCamera: "Cambia Fotocamera",
      capturePage: "Scatta Pagina",
      filterTitle: "Filtro Documento:",
      filterOriginal: "Originale",
      filterBw: "Documento B&W (Nitido)",
      filterGray: "Scala di Grigi",
      filterVivid: "Colore Esaltato",
      rotateLeft: "Ruota -90°",
      rotateRight: "Ruota +90°",
      pagesScanned: "Pagine Acquisite:",
      noPagesYet: "Nessuna pagina ancora acquisita. Scatta una foto o carica un'immagine.",
      addAnother: "Aggiungi un'altra pagina",
      clearAll: "Svuota Tutto",
      generatePdf: "Crea PDF Documento",
      extractOcr: "Riconosci Testo (OCR)",
      pageSize: "Formato Pagina:",
      pageA4: "A4 (Standard)",
      pageLetter: "US Letter",
      pageFit: "Adatta a Immagine",
      cameraError: "Impossibile accedere alla fotocamera. Verifica i permessi del browser.",
      cameraPermission: "Consenti l'accesso alla fotocamera quando richiesto dal browser."
    },

    // Analytics & Charts UI
    analyticsModal: {
      title: "Document Inspector & Grafici Professionali",
      subtitle: "Analisi approfondita della struttura, densità, spazio e ottimizzazione del documento.",
      chart1Title: "Composizione del Documento",
      chart2Title: "Simulazione Risparmio di Compressione (KB)",
      chart3Title: "Distribuzione Orientamento Pagine",
      statPages: "Pagine Totali",
      statSize: "Dimensione File",
      statDpi: "DPI Stimati",
      statSecurity: "Stato Sicurezza",
      statEncrypted: "Protetto",
      statOpen: "Non Protetto",
      statEfficiency: "Efficienza Spazio",
      insightsTitle: "Diagnostica & Suggerimenti:",
      tipCompress: "Il documento contiene immagini pesanti: una compressione bilanciata può ridurre il peso di oltre il 50%.",
      tipOptimize: "La struttura del PDF è pulita e pronta per l'archiviazione a norma.",
      downloadReport: "Esporta Report Analisi"
    },

    // Common Modal UI
    common: {
      uploadPrompt: "Trascina qui il tuo file PDF oppure",
      uploadPromptMulti: "Trascina qui i tuoi file PDF oppure",
      uploadPromptImages: "Trascina qui le tue immagini (JPG, PNG, WebP) oppure",
      browseFiles: "Sfoglia File",
      supportedFormats: "Supporta file PDF fino a 100MB",
      cancel: "Annulla",
      apply: "Applica & Elabora",
      download: "Scarica Risultato",
      processing: "Elaborazione in corso...",
      success: "Operazione completata con successo!",
      error: "Si è verificato un errore durante l'operazione.",
      page: "Pagina",
      of: "di",
      pages: "pagine",
      files: "file selezionati",
      remove: "Rimuovi",
      preview: "Anteprima",
      dragToReorder: "Trascina le schede per riordinare",
      backToTools: "Torna agli strumenti",
      saveChanges: "Salva Modifiche",
      close: "Chiudi"
    },

    // Specific Tools details
    toolDetails: {
      mergeTitle: "Unisci File PDF",
      mergeDesc: "Ordina i file nell'ordine desiderato prima di unirli.",
      addMorePdfs: "Aggiungi altri PDF",
      mergeAction: "Unisci File Ora",

      splitTitle: "Dividi ed Estrai Pagine",
      splitDesc: "Clicca sulle pagine per selezionarle oppure inserisci gli intervalli.",
      splitModeAll: "Separa ogni pagina in un file",
      splitModeRange: "Intervalli personalizzati (es: 1-3, 5, 8-10)",
      splitAction: "Estrai Pagine Selezionate",

      compressTitle: "Comprimi Documento PDF",
      compressDesc: "Seleziona il livello di compressione ideale per il tuo documento.",
      compressExtreme: "Compressione Massima (Bassa risoluzione, massimo risparmio)",
      compressRecommended: "Consigliata (Ottimo compromesso qualità / dimensione)",
      compressLow: "Bassa Compressione (Massima nitidezza visiva)",
      originalSize: "Dimensione attuale:",
      estimatedSize: "Dimensione stimata:",
      savings: "Risparmio stimato:",
      compressAction: "Comprimi PDF Ora",

      editorTitle: "Editor Visivo PDF",
      editorDesc: "Aggiungi testi, disegni a mano, evidenziatore, forme e timbri.",
      toolText: "Testo",
      toolDraw: "Disegna",
      toolHighlight: "Evidenzia",
      toolShape: "Forme",
      toolStamp: "Timbro",
      toolSign: "Firma",
      color: "Colore:",
      strokeSize: "Spessore:",
      fontSize: "Dimensione:",
      stamps: ["APPROVATO", "CONFIDENZIALE", "BOZZA", "PAGATO", "URGENTE"],
      applyEditor: "Salva & Scarica PDF Modificato",

      signTitle: "Aggiungi Firma Elettronica",
      signDesc: "Crea la tua firma e posizionala con precisione su qualsiasi pagina.",
      signTabDraw: "Disegna a Mano",
      signTabType: "Digita Nome",
      signTabUpload: "Carica Immagine",
      clearSignature: "Cancella Tratto",
      typePlaceholder: "Scrivi qui il tuo nome completo...",
      placeSignature: "Posiziona Firma su PDF",

      watermarkTitle: "Aggiungi Filigrana",
      watermarkText: "Testo Filigrana:",
      watermarkOpacity: "Opacità:",
      watermarkRotation: "Angolo Rotazione:",
      watermarkAction: "Applica Filigrana",

      pageNumbersTitle: "Aggiungi Numeri di Pagina",
      pnPosition: "Posizione:",
      pnFormat: "Formato:",
      pnAction: "Inserisci Numeri",

      pdfToImgTitle: "Converti PDF in Immagini",
      formatJpg: "Formato JPG",
      formatPng: "Formato PNG",
      downloadAllZip: "Scarica Tutte come ZIP",
      downloadSingle: "Scarica Pagina",

      protectTitle: "Proteggi Documento con Password",
      enterPassword: "Crea una password sicura:",
      confirmPassword: "Conferma password:",
      protectAction: "Cifra e Proteggi PDF",

      unlockTitle: "Sblocca PDF Protetto",
      currentPassword: "Inserisci la password del file:",
      unlockAction: "Rimuovi Password"
    },

    // Suggestions & Benefits
    featuresSection: {
      title: "Perché scegliere la nostra Suite PDF?",
      f1Title: "100% Sicurezza & Privacy Locale",
      f1Desc: "Tutti i file vengono elaborati direttamente nel tuo browser. Nessun dato lascia il tuo dispositivo.",
      f2Title: "Scanner da Fotocamera Integrato",
      f2Desc: "Acquisisci scontrini, contratti e appunti direttamente con la fotocamera del tuo computer o smartphone.",
      f3Title: "Grafici & Ispezione Professionale",
      f3Desc: "Controlla la composizione, densità DPI e stima di risparmio con grafici vettoriali interattivi.",
      f4Title: "Nessun Limite, Nessun Abbonamento",
      f4Desc: "Tutti gli strumenti sono gratuiti e senza vincoli di utilizzo o limiti di pagine."
    }
  },

  en: {
    appTitle: "DocuMaster PDF Studio",
    tagline: "The all-in-one professional PDF suite: edit, convert, scan and inspect.",
    badgePrivacy: "100% Local Privacy • Zero files sent to servers",
    searchPlaceholder: "Search across 15+ PDF tools...",
    themeDark: "Dark Mode",
    themeLight: "Light Mode",
    language: "Language",

    catAll: "All Tools",
    catPopular: "Popular",
    catScan: "Scanner & Photos",
    catEdit: "Edit & Sign",
    catOrganize: "Organize & Pages",
    catConvert: "Convert",
    catSecurity: "Security",
    catAnalytics: "Charts & Analytics",

    tools: {
      scanner: {
        title: "Document Scanner",
        desc: "Scan via webcam/camera or upload scans, apply clean B&W document filters and build multi-page PDFs.",
        badge: "Camera / AI"
      },
      analytics: {
        title: "Charts & Document Inspector",
        desc: "Professional analytics: content density, compression savings simulation, orientation and audit.",
        badge: "Pro Charts"
      },
      merge: {
        title: "Merge PDF",
        desc: "Combine multiple PDF files into one single document in any custom order with live preview.",
        badge: "Most Used"
      },
      split: {
        title: "Split & Extract PDF",
        desc: "Extract specific pages or break a PDF into individual files with interactive visual selection.",
        badge: "Popular"
      },
      compress: {
        title: "Compress PDF",
        desc: "Shrink file size optimizing images and streams with an interactive savings chart.",
        badge: "Save Space"
      },
      edit: {
        title: "Edit & Annotate PDF",
        desc: "Add text boxes, freehand pen, highlighter, geometric shapes, and official stamps.",
        badge: "Interactive"
      },
      fillForm: {
        title: "Fill PDF Forms",
        desc: "Fill interactive PDF forms (AcroForms) or insert text, checkmarks (✓), crossmarks (✗), date, and signature onto any document.",
        badge: "Form Filler"
      },
      sign: {
        title: "eSign PDF",
        desc: "Draw your signature, generate cursive calligraphy, or upload a stamp to place on the PDF.",
        badge: "Digital Signature"
      },
      organize: {
        title: "Organize & Reorder Pages",
        desc: "Visual drag & drop grid: reorder, rotate, duplicate, and delete pages in real time.",
        badge: "Visual"
      },
      rotate: {
        title: "Rotate PDF",
        desc: "Rotate pages 90°, 180°, or 270° clockwise or counter-clockwise in one click.",
        badge: "Quick"
      },
      pdfToImg: {
        title: "PDF to Images (JPG / PNG)",
        desc: "Convert every page into high-resolution images with single download or complete ZIP bundle.",
        badge: "High Res"
      },
      imgToPdf: {
        title: "Images to PDF",
        desc: "Merge JPG, PNG, and WebP images into a clean PDF with custom margins and orientations.",
        badge: "Multi-Image"
      },
      watermark: {
        title: "Add Watermark",
        desc: "Insert customized text or image stamps with opacity, rotation, and live preview.",
        badge: "Copyright"
      },
      pageNumbers: {
        title: "Page Numbers",
        desc: "Insert custom page numbers selecting format, position, fonts, and margins.",
        badge: "Layout"
      },
      protect: {
        title: "Protect & Password",
        desc: "Add strong encryption and passwords to prevent unauthorized access.",
        badge: "Security"
      },
      unlock: {
        title: "Unlock PDF",
        desc: "Remove restrictions and passwords from secured files you have permission for.",
        badge: "Access"
      },
      pdfToText: {
        title: "Extract Text & OCR",
        desc: "Extract all selectable and transcribed text with word counts and reading metrics.",
        badge: "Export TXT"
      },
      flatten: {
        title: "Flatten PDF",
        desc: "Lock forms and annotations into permanent, unalterable background graphics.",
        badge: "Certify"
      }
    },
    fillFormModal: {
      title: "Fill PDF Form (Fill and Sign)",
      subtitle: "Fill interactive PDF fields or click anywhere on the page to insert custom text, checkmarks, date, and signatures.",
      toolText: "Text (Aa)",
      toolCheck: "Checkmark (✓)",
      toolCross: "Crossmark (✗)",
      toolDate: "Today's Date",
      toolSign: "Quick Signature",
      acroFound: "Interactive form fields detected in this PDF. Fill them directly or add visual text.",
      acroNotFound: "Standard document: select a tool above and click anywhere on lines or boxes to write.",
      downloadFilled: "Save and Download Filled PDF",
      deleteElement: "Delete",
      clearAll: "Clear Changes",
      fontSize: "Size:"
    },

    scannerModal: {
      title: "Advanced Document Scanner",
      subtitle: "Snap documents with your camera or upload photos, apply crisp filters and generate PDFs.",
      tabCamera: "Live Camera",
      tabUpload: "Upload Photos",
      startCamera: "Start Camera",
      stopCamera: "Stop Camera",
      switchCamera: "Switch Camera",
      capturePage: "Capture Page",
      filterTitle: "Document Filter:",
      filterOriginal: "Original Color",
      filterBw: "B&W Document (Clean)",
      filterGray: "Grayscale",
      filterVivid: "Vivid Enhanced",
      rotateLeft: "Rotate -90°",
      rotateRight: "Rotate +90°",
      pagesScanned: "Scanned Pages:",
      noPagesYet: "No pages captured yet. Snap a picture or upload images.",
      addAnother: "Add another page",
      clearAll: "Clear All",
      generatePdf: "Create PDF Document",
      extractOcr: "Extract Text (OCR)",
      pageSize: "Page Size:",
      pageA4: "A4 (Standard)",
      pageLetter: "US Letter",
      pageFit: "Fit to Image",
      cameraError: "Unable to access camera. Please check browser permissions.",
      cameraPermission: "Please allow camera access when prompted by your browser."
    },

    analyticsModal: {
      title: "Document Inspector & Professional Charts",
      subtitle: "In-depth visual analysis of document structure, density, space efficiency and security.",
      chart1Title: "Document Composition",
      chart2Title: "Compression Savings Simulation (KB)",
      chart3Title: "Page Orientation Distribution",
      statPages: "Total Pages",
      statSize: "File Size",
      statDpi: "Estimated DPI",
      statSecurity: "Security Status",
      statEncrypted: "Protected",
      statOpen: "Unrestricted",
      statEfficiency: "Space Efficiency",
      insightsTitle: "Diagnostic Insights:",
      tipCompress: "The document contains high-res graphics: balanced compression can reduce file size by >50%.",
      tipOptimize: "PDF structure is clean and ready for legal archival.",
      downloadReport: "Export Analysis Report"
    },

    common: {
      uploadPrompt: "Drag and drop your PDF here or",
      uploadPromptMulti: "Drag and drop your PDF files here or",
      uploadPromptImages: "Drag and drop images (JPG, PNG, WebP) here or",
      browseFiles: "Browse Files",
      supportedFormats: "Supports PDF files up to 100MB",
      cancel: "Cancel",
      apply: "Apply & Process",
      download: "Download Result",
      processing: "Processing...",
      success: "Operation completed successfully!",
      error: "An error occurred during the operation.",
      page: "Page",
      of: "of",
      pages: "pages",
      files: "selected files",
      remove: "Remove",
      preview: "Preview",
      dragToReorder: "Drag cards to reorder",
      backToTools: "Back to Tools",
      saveChanges: "Save Changes",
      close: "Close"
    },

    toolDetails: {
      mergeTitle: "Merge PDF Files",
      mergeDesc: "Reorder files in your preferred sequence before combining.",
      addMorePdfs: "Add More PDFs",
      mergeAction: "Merge Files Now",

      splitTitle: "Split & Extract Pages",
      splitDesc: "Click pages to select them or type custom ranges.",
      splitModeAll: "Split every page into a separate file",
      splitModeRange: "Custom ranges (e.g. 1-3, 5, 8-10)",
      splitAction: "Extract Selected Pages",

      compressTitle: "Compress PDF Document",
      compressDesc: "Choose the optimal compression balance for your document.",
      compressExtreme: "Extreme Compression (Smallest size, lower DPI)",
      compressRecommended: "Recommended (Smart balance of quality & size)",
      compressLow: "Low Compression (Highest visual clarity)",
      originalSize: "Current size:",
      estimatedSize: "Estimated size:",
      savings: "Estimated savings:",
      compressAction: "Compress PDF Now",

      editorTitle: "Interactive PDF Editor",
      editorDesc: "Add text, draw, highlight, place shapes and approved stamps.",
      toolText: "Text",
      toolDraw: "Draw",
      toolHighlight: "Highlight",
      toolShape: "Shapes",
      toolStamp: "Stamps",
      toolSign: "Signature",
      color: "Color:",
      strokeSize: "Stroke:",
      fontSize: "Font Size:",
      stamps: ["APPROVED", "CONFIDENTIAL", "DRAFT", "PAID", "URGENT"],
      applyEditor: "Save & Download Edited PDF",

      signTitle: "Add Electronic Signature",
      signDesc: "Create your signature and place it anywhere with pixel precision.",
      signTabDraw: "Draw Freehand",
      signTabType: "Type Name",
      signTabUpload: "Upload Image",
      clearSignature: "Clear Signature",
      typePlaceholder: "Type your full name here...",
      placeSignature: "Place Signature on PDF",

      watermarkTitle: "Add Watermark",
      watermarkText: "Watermark Text:",
      watermarkOpacity: "Opacity:",
      watermarkRotation: "Rotation Angle:",
      watermarkAction: "Apply Watermark",

      pageNumbersTitle: "Add Page Numbers",
      pnPosition: "Position:",
      pnFormat: "Format:",
      pnAction: "Insert Page Numbers",

      pdfToImgTitle: "Convert PDF to Images",
      formatJpg: "JPG Format",
      formatPng: "PNG Format",
      downloadAllZip: "Download All as ZIP",
      downloadSingle: "Download Page",

      protectTitle: "Protect Document with Password",
      enterPassword: "Create a strong password:",
      confirmPassword: "Confirm password:",
      protectAction: "Encrypt & Protect PDF",

      unlockTitle: "Unlock Protected PDF",
      currentPassword: "Enter existing file password:",
      unlockAction: "Remove Password"
    },

    featuresSection: {
      title: "Why Choose Our PDF Suite?",
      f1Title: "100% Privacy & Local Security",
      f1Desc: "All files are processed directly inside your browser. No data ever leaves your device.",
      f2Title: "Integrated Live Camera Scanner",
      f2Desc: "Capture receipts, contracts, and notes directly using your camera or phone.",
      f3Title: "Professional Graphics & Inspection",
      f3Desc: "Examine content density, DPI, and simulate space savings with interactive vector charts.",
      f4Title: "No Limits, No Subscriptions",
      f4Desc: "All tools are completely free with zero page limits or subscriptions required."
    }
  },

  es: {
    appTitle: "DocuMaster PDF Studio",
    tagline: "La suite PDF profesional todo en uno: edita, convierte, escanea y analiza.",
    badgePrivacy: "100% Privacidad Local • Ningún archivo enviado al servidor",
    searchPlaceholder: "Buscar entre más de 15 herramientas PDF...",
    themeDark: "Modo Oscuro",
    themeLight: "Modo Claro",
    language: "Idioma",

    catAll: "Todas las Herramientas",
    catPopular: "Populares",
    catScan: "Escáner y Fotos",
    catEdit: "Editar y Firmar",
    catOrganize: "Organizar y Páginas",
    catConvert: "Convertir",
    catSecurity: "Seguridad",
    catAnalytics: "Gráficos y Análisis",

    tools: {
      scanner: {
        title: "Escáner de Documentos",
        desc: "Escanea desde cámara o fotos, aplica filtros B&W limpios y crea PDFs de varias páginas.",
        badge: "Cámara / IA"
      },
      analytics: {
        title: "Gráficos e Inspector",
        desc: "Gráficos profesionales: densidad de contenido, ahorro de compresión y auditoría.",
        badge: "Gráficos Pro"
      },
      merge: {
        title: "Unir PDF",
        desc: "Combina múltiples PDFs en un solo documento en el orden deseado con vista previa.",
        badge: "Más Usado"
      },
      split: {
        title: "Dividir PDF",
        desc: "Extrae páginas específicas o divide el documento en archivos individuales.",
        badge: "Popular"
      },
      compress: {
        title: "Comprimir PDF",
        desc: "Reduce el tamaño optimizando imágenes y fuentes con gráfico de ahorro interactivo.",
        badge: "Ahorro"
      },
      edit: {
        title: "Editar PDF",
        desc: "Añade texto, dibujo libre, resaltador, figuras geométricas y sellos oficiales.",
        badge: "Interactivo"
      },
      fillForm: {
        title: "Rellenar Formularios PDF",
        desc: "Rellena formularios interactivos (AcroForms) o inserta texto, marcas (✓), cruces (✗), fechas y firmas en cualquier documento.",
        badge: "Rellenar Formulario"
      },
      sign: {
        title: "Firmar PDF (eSign)",
        desc: "Dibuja tu firma, escribe con caligrafía elegante o sube una imagen y colócala en el PDF.",
        badge: "Firma Digital"
      },
      organize: {
        title: "Organizar Páginas",
        desc: "Reordena, rota, duplica y elimina páginas fácilmente en una cuadrícula visual.",
        badge: "Visual"
      },
      rotate: {
        title: "Rotar PDF",
        desc: "Gira las páginas 90°, 180° o 270° con un solo clic.",
        badge: "Rápido"
      },
      pdfToImg: {
        title: "PDF a Imágenes",
        desc: "Convierte cada página en JPG o PNG en alta resolución y descarga en ZIP.",
        badge: "Alta Calidad"
      },
      imgToPdf: {
        title: "Imágenes a PDF",
        desc: "Convierte fotos JPG, PNG y WebP en un archivo PDF con márgenes personalizados.",
        badge: "Multi-Imagen"
      },
      watermark: {
        title: "Marca de Agua",
        desc: "Inserta texto o logotipo con transparencia, ángulo y vista previa en vivo.",
        badge: "Copyright"
      },
      pageNumbers: {
        title: "Número de Página",
        desc: "Añade números de página eligiendo formato, posición y márgenes.",
        badge: "Diseño"
      },
      protect: {
        title: "Proteger con Contraseña",
        desc: "Añade encriptación segura para proteger contra aperturas no autorizadas.",
        badge: "Seguridad"
      },
      unlock: {
        title: "Desbloquear PDF",
        desc: "Elimina contraseñas y restricciones de archivos autorizados.",
        badge: "Acceso"
      },
      pdfToText: {
        title: "Extraer Texto y OCR",
        desc: "Extrae todo el texto del documento con recuento de palabras y lectura.",
        badge: "Exportar TXT"
      },
      flatten: {
        title: "Aplanar PDF (Flatten)",
        desc: "Bloquea formularios y anotaciones convirtiéndolos en capas estáticas.",
        badge: "Certificar"
      }
    },
    fillFormModal: {
      title: "Rellenar Formulario PDF (Fill and Sign)",
      subtitle: "Rellena campos interactivos o haz clic en cualquier parte para escribir texto, marcas y firmas.",
      toolText: "Texto (Aa)",
      toolCheck: "Marca (✓)",
      toolCross: "Cruz (✗)",
      toolDate: "Fecha de Hoy",
      toolSign: "Firma Rápida",
      acroFound: "Campos interactivos detectados. Puedes rellenarlos directamente o añadir texto libre.",
      acroNotFound: "Documento estándar: selecciona una herramienta arriba y haz clic para escribir.",
      downloadFilled: "Guardar y Descargar PDF Rellenado",
      deleteElement: "Eliminar",
      clearAll: "Borrar Cambios",
      fontSize: "Tamaño:"
    },

    scannerModal: {
      title: "Escáner de Documentos Inteligente",
      subtitle: "Captura con la cámara o sube imágenes, aplica filtros y genera PDFs.",
      tabCamera: "Cámara en Vivo",
      tabUpload: "Subir Fotos",
      startCamera: "Activar Cámara",
      stopCamera: "Detener Cámara",
      switchCamera: "Cambiar Cámara",
      capturePage: "Capturar Página",
      filterTitle: "Filtro de Documento:",
      filterOriginal: "Color Original",
      filterBw: "Documento B&W (Nítido)",
      filterGray: "Escala de Grises",
      filterVivid: "Color Mejorado",
      rotateLeft: "Rotar -90°",
      rotateRight: "Rotar +90°",
      pagesScanned: "Páginas Capturadas:",
      noPagesYet: "Aún no hay páginas. Toma una foto o sube imágenes.",
      addAnother: "Añadir otra página",
      clearAll: "Borrar Todo",
      generatePdf: "Crear Documento PDF",
      extractOcr: "Extraer Texto (OCR)",
      pageSize: "Tamaño de Página:",
      pageA4: "A4 (Estándar)",
      pageLetter: "US Letter",
      pageFit: "Ajustar a Imagen",
      cameraError: "No se puede acceder a la cámara. Revisa los permisos.",
      cameraPermission: "Por favor permite el acceso a la cámara."
    },

    analyticsModal: {
      title: "Inspector de Documentos y Gráficos Pro",
      subtitle: "Análisis visual completo de estructura, compresión y distribución.",
      chart1Title: "Composición del Documento",
      chart2Title: "Simulación de Ahorro de Compresión (KB)",
      chart3Title: "Orientación de Páginas",
      statPages: "Páginas Totales",
      statSize: "Tamaño",
      statDpi: "DPI Estimado",
      statSecurity: "Seguridad",
      statEncrypted: "Protegido",
      statOpen: "Sin Restricciones",
      statEfficiency: "Eficiencia",
      insightsTitle: "Diagnóstico:",
      tipCompress: "El archivo contiene imágenes grandes: una compresión puede ahorrar más del 50%.",
      tipOptimize: "La estructura del PDF es óptima para archivo digital.",
      downloadReport: "Descargar Reporte"
    },

    common: {
      uploadPrompt: "Arrastra y suelta tu archivo PDF aquí o",
      uploadPromptMulti: "Arrastra y suelta tus archivos PDF aquí o",
      uploadPromptImages: "Arrastra tus imágenes (JPG, PNG) aquí o",
      browseFiles: "Seleccionar Archivos",
      supportedFormats: "Soporta PDFs hasta 100MB",
      cancel: "Cancelar",
      apply: "Aplicar y Procesar",
      download: "Descargar Resultado",
      processing: "Procesando...",
      success: "¡Operación completada con éxito!",
      error: "Ocurrió un error.",
      page: "Página",
      of: "de",
      pages: "páginas",
      files: "archivos seleccionados",
      remove: "Eliminar",
      preview: "Vista Previa",
      dragToReorder: "Arrastra para reordenar",
      backToTools: "Volver a Herramientas",
      saveChanges: "Guardar Cambios",
      close: "Cerrar"
    },

    toolDetails: {
      mergeTitle: "Unir Archivos PDF",
      mergeDesc: "Reordena los archivos antes de combinarlos.",
      addMorePdfs: "Añadir más PDFs",
      mergeAction: "Unir Ahora",

      splitTitle: "Dividir Páginas",
      splitDesc: "Selecciona las páginas a extraer o escribe los rangos.",
      splitModeAll: "Separar cada página",
      splitModeRange: "Rangos (ej: 1-3, 5, 8-10)",
      splitAction: "Extraer Páginas",

      compressTitle: "Comprimir PDF",
      compressDesc: "Elige el nivel de compresión ideal.",
      compressExtreme: "Compresión Máxima",
      compressRecommended: "Recomendada (Equilibrada)",
      compressLow: "Baja Compresión",
      originalSize: "Tamaño original:",
      estimatedSize: "Tamaño estimado:",
      savings: "Ahorro estimado:",
      compressAction: "Comprimir Ahora",

      editorTitle: "Editor Visual PDF",
      editorDesc: "Añade texto, dibujo, formas y sellos.",
      toolText: "Texto",
      toolDraw: "Dibujar",
      toolHighlight: "Resaltar",
      toolShape: "Formas",
      toolStamp: "Sellos",
      toolSign: "Firma",
      color: "Color:",
      strokeSize: "Grosor:",
      fontSize: "Tamaño:",
      stamps: ["APROBADO", "CONFIDENCIAL", "BORRADOR", "PAGADO", "URGENTE"],
      applyEditor: "Guardar y Descargar PDF",

      signTitle: "Firmar Documento",
      signDesc: "Crea tu firma y colócala en cualquier página.",
      signTabDraw: "Dibujar a Mano",
      signTabType: "Escribir Nombre",
      signTabUpload: "Subir Imagen",
      clearSignature: "Borrar Firma",
      typePlaceholder: "Escribe tu nombre completo...",
      placeSignature: "Colocar Firma en PDF",

      watermarkTitle: "Marca de Agua",
      watermarkText: "Texto de la Marca:",
      watermarkOpacity: "Opacidad:",
      watermarkRotation: "Ángulo:",
      watermarkAction: "Aplicar Marca",

      pageNumbersTitle: "Números de Página",
      pnPosition: "Posición:",
      pnFormat: "Formato:",
      pnAction: "Insertar Números",

      pdfToImgTitle: "Convertir PDF a Imágenes",
      formatJpg: "Formato JPG",
      formatPng: "Formato PNG",
      downloadAllZip: "Descargar Todo en ZIP",
      downloadSingle: "Descargar Página",

      protectTitle: "Proteger con Contraseña",
      enterPassword: "Crea una contraseña:",
      confirmPassword: "Confirma la contraseña:",
      protectAction: "Proteger PDF",

      unlockTitle: "Desbloquear PDF",
      currentPassword: "Contraseña actual:",
      unlockAction: "Quitar Contraseña"
    },

    featuresSection: {
      title: "¿Por qué usar nuestra suite?",
      f1Title: "100% Privacidad Local",
      f1Desc: "Tus archivos nunca salen de tu navegador ni van a servidores externos.",
      f2Title: "Escáner con Cámara",
      f2Desc: "Captura documentos físicos directamente desde la cámara web o móvil.",
      f3Title: "Gráficos Profesionales",
      f3Desc: "Inspecciona la estructura y ahorro de espacio con gráficos interactivos.",
      f4Title: "Gratuito y Sin Límites",
      f4Desc: "Sin suscripciones ni límites de páginas."
    }
  },

  fr: {
    appTitle: "DocuMaster PDF Studio",
    tagline: "La suite PDF professionnelle tout-en-un : modifiez, convertissez, numérisez et analysez.",
    badgePrivacy: "100% Confidentialité Locale • Aucun fichier envoyé au serveur",
    searchPlaceholder: "Rechercher parmi plus de 15 outils PDF...",
    themeDark: "Mode Sombre",
    themeLight: "Mode Clair",
    language: "Langue",

    catAll: "Tous les Outils",
    catPopular: "Populaires",
    catScan: "Scanner & Photos",
    catEdit: "Modifier & Signer",
    catOrganize: "Organiser & Pages",
    catConvert: "Convertir",
    catSecurity: "Sécurité",
    catAnalytics: "Graphiques & Analyse",

    tools: {
      scanner: {
        title: "Scanner de Documents",
        desc: "Numérisez via caméra ou photos, appliquez des filtres B&W nets et créez des PDF multipages.",
        badge: "Caméra / IA"
      },
      analytics: {
        title: "Graphiques & Inspecteur",
        desc: "Graphiques professionnels : densité de contenu, simulation de compression et audit.",
        badge: "Graphiques Pro"
      },
      merge: {
        title: "Fusionner PDF",
        desc: "Combinez plusieurs fichiers PDF en un seul document dans l'ordre souhaité.",
        badge: "Le Plus Utilisé"
      },
      split: {
        title: "Diviser PDF",
        desc: "Extrayez des pages spécifiques ou séparez en fichiers individuels avec sélection visuelle.",
        badge: "Populaire"
      },
      compress: {
        title: "Compresser PDF",
        desc: "Réduisez la taille du fichier tout en conservant une excellente qualité avec graphique d'économie.",
        badge: "Gain de Place"
      },
      edit: {
        title: "Modifier & Annoter PDF",
        desc: "Ajoutez du texte, dessin à main levée, surlignage, formes et tampons officiels.",
        badge: "Interactif"
      },
      fillForm: {
        title: "Remplir des Formulaires PDF",
        desc: "Remplissez des formulaires interactifs (AcroForms) ou ajoutez texte, coches (✓), croix (✗), date et signature sur tout PDF.",
        badge: "Remplir Formulaire"
      },
      sign: {
        title: "Signer PDF (eSign)",
        desc: "Dessinez votre signature, tapez en écriture élégante ou importez une image sur le document.",
        badge: "Signature Digitale"
      },
      organize: {
        title: "Organiser les Pages",
        desc: "Glisser-déposer visuel : réorganisez, pivotez, dupliquez et supprimez des pages en direct.",
        badge: "Visuel"
      },
      rotate: {
        title: "Faire Pivoter PDF",
        desc: "Faites pivoter vos pages de 90°, 180° ou 270° en un clic.",
        badge: "Rapide"
      },
      pdfToImg: {
        title: "PDF en Images (JPG / PNG)",
        desc: "Convertissez chaque page en image haute résolution et téléchargez le tout en ZIP.",
        badge: "Haute Définition"
      },
      imgToPdf: {
        title: "Images en PDF",
        desc: "Assemblez des images JPG, PNG et WebP en un document PDF personnalisé.",
        badge: "Multi-Image"
      },
      watermark: {
        title: "Ajouter Filigrane",
        desc: "Insérez un filigrane texte ou logo avec opacité, angle et aperçu direct.",
        badge: "Copyright"
      },
      pageNumbers: {
        title: "Numéroter les Pages",
        desc: "Insérez des numéros de page selon le format et l'alignement choisis.",
        badge: "Mise en Page"
      },
      protect: {
        title: "Protéger par Mot de Passe",
        desc: "Chiffrez vos documents PDF pour restreindre l'accès non autorisé.",
        badge: "Sécurité"
      },
      unlock: {
        title: "Déverrouiller PDF",
        desc: "Supprimez les mots de passe et restrictions de fichiers autorisés.",
        badge: "Accès"
      },
      pdfToText: {
        title: "Extraire le Texte & OCR",
        desc: "Récupérez tout le texte sélectionnable avec statistiques de mots et lecture.",
        badge: "Export TXT"
      },
      flatten: {
        title: "Aplatir PDF (Flatten)",
        desc: "Figez formulaires et annotations en couches fixes non modifiables.",
        badge: "Certification"
      }
    },
    fillFormModal: {
      title: "Remplir Formulaire PDF (Fill and Sign)",
      subtitle: "Remplissez les champs interactifs ou cliquez n'importe où pour insérer du texte, coches et signatures.",
      toolText: "Texte (Aa)",
      toolCheck: "Coche (✓)",
      toolCross: "Croix (✗)",
      toolDate: "Date du Jour",
      toolSign: "Signature Rapide",
      acroFound: "Champs interactifs détectés dans ce document. Remplissez-les directement.",
      acroNotFound: "Document standard : sélectionnez un outil ci-dessus et cliquez où vous voulez écrire.",
      downloadFilled: "Enregistrer et Télécharger PDF Rempli",
      deleteElement: "Supprimer",
      clearAll: "Effacer",
      fontSize: "Taille :"
    },

    scannerModal: {
      title: "Scanner de Documents Avancé",
      subtitle: "Capturez avec la caméra ou chargez des photos, appliquez des filtres nets et générez un PDF.",
      tabCamera: "Caméra en Direct",
      tabUpload: "Importer Photos",
      startCamera: "Activer Caméra",
      stopCamera: "Arrêter Caméra",
      switchCamera: "Changer Caméra",
      capturePage: "Capturer Page",
      filterTitle: "Filtre Document :",
      filterOriginal: "Couleur d'origine",
      filterBw: "Document N&B (Net)",
      filterGray: "Niveaux de Gris",
      filterVivid: "Couleurs Éclatantes",
      rotateLeft: "Pivoter -90°",
      rotateRight: "Pivoter +90°",
      pagesScanned: "Pages Numérisées :",
      noPagesYet: "Aucune page capturée pour le moment.",
      addAnother: "Ajouter une autre page",
      clearAll: "Tout Effacer",
      generatePdf: "Créer le Document PDF",
      extractOcr: "Extraire le Texte (OCR)",
      pageSize: "Format de Page :",
      pageA4: "A4 (Standard)",
      pageLetter: "US Letter",
      pageFit: "Ajuster à l'image",
      cameraError: "Impossible d'accéder à la caméra. Vérifiez les autorisations.",
      cameraPermission: "Veuillez autoriser l'accès à la caméra."
    },

    analyticsModal: {
      title: "Inspecteur de Documents & Graphiques",
      subtitle: "Analyse visuelle approfondie de la composition, compression et disposition.",
      chart1Title: "Composition du Document",
      chart2Title: "Simulation d'Économie de Compression (Ko)",
      chart3Title: "Distribution de l'Orientation",
      statPages: "Pages Totales",
      statSize: "Taille",
      statDpi: "DPI Estimé",
      statSecurity: "Sécurité",
      statEncrypted: "Protégé",
      statOpen: "Non Restreint",
      statEfficiency: "Efficacité",
      insightsTitle: "Recommandations :",
      tipCompress: "Le fichier contient des images volumineuses : une compression peut réduire le poids de >50%.",
      tipOptimize: "La structure du PDF est optimisée pour l'archivage.",
      downloadReport: "Télécharger le Rapport"
    },

    common: {
      uploadPrompt: "Glissez et déposez votre fichier PDF ici ou",
      uploadPromptMulti: "Glissez et déposez vos fichiers PDF ici ou",
      uploadPromptImages: "Glissez et déposez vos images ici ou",
      browseFiles: "Parcourir les Fichiers",
      supportedFormats: "Supporte les fichiers PDF jusqu'à 100 Mo",
      cancel: "Annuler",
      apply: "Appliquer & Traiter",
      download: "Télécharger le Résultat",
      processing: "Traitement en cours...",
      success: "Opération terminée avec succès !",
      error: "Une erreur est survenue.",
      page: "Page",
      of: "sur",
      pages: "pages",
      files: "fichiers sélectionnés",
      remove: "Supprimer",
      preview: "Aperçu",
      dragToReorder: "Glissez pour réorganiser",
      backToTools: "Retour aux Outils",
      saveChanges: "Enregistrer",
      close: "Fermer"
    },

    toolDetails: {
      mergeTitle: "Fusionner des Fichiers PDF",
      mergeDesc: "Réorganisez vos fichiers dans l'ordre souhaité avant de fusionner.",
      addMorePdfs: "Ajouter d'autres PDF",
      mergeAction: "Fusionner Maintenant",

      splitTitle: "Diviser et Extraire des Pages",
      splitDesc: "Cliquez sur les pages ou indiquez des plages personnalisées.",
      splitModeAll: "Séparer chaque page",
      splitModeRange: "Plages personnalisées (ex. 1-3, 5, 8-10)",
      splitAction: "Extraire les Pages",

      compressTitle: "Compresser le Document PDF",
      compressDesc: "Choisissez le niveau d'optimisation adapté.",
      compressExtreme: "Compression Maximale",
      compressRecommended: "Recommandée (Équilibrée)",
      compressLow: "Faible Compression",
      originalSize: "Taille actuelle :",
      estimatedSize: "Taille estimée :",
      savings: "Économie estimée :",
      compressAction: "Compresser Maintenant",

      editorTitle: "Éditeur Visuel PDF",
      editorDesc: "Ajoutez du texte, dessin, surlignage, formes et tampons.",
      toolText: "Texte",
      toolDraw: "Dessin",
      toolHighlight: "Surligner",
      toolShape: "Formes",
      toolStamp: "Tampons",
      toolSign: "Signature",
      color: "Couleur :",
      strokeSize: "Épaisseur :",
      fontSize: "Taille :",
      stamps: ["APPROUVÉ", "CONFIDENTIEL", "BROUILLON", "PAYÉ", "URGENT"],
      applyEditor: "Enregistrer & Télécharger PDF",

      signTitle: "Signer le Document",
      signDesc: "Créez votre signature et placez-la sur n'importe quelle page.",
      signTabDraw: "Dessiner à la Main",
      signTabType: "Taper le Nom",
      signTabUpload: "Importer Image",
      clearSignature: "Effacer",
      typePlaceholder: "Tapez votre nom complet...",
      placeSignature: "Placer la Signature sur le PDF",

      watermarkTitle: "Ajouter un Filigrane",
      watermarkText: "Texte du Filigrane :",
      watermarkOpacity: "Opacité :",
      watermarkRotation: "Angle :",
      watermarkAction: "Appliquer le Filigrane",

      pageNumbersTitle: "Numéros de Page",
      pnPosition: "Position :",
      pnFormat: "Format :",
      pnAction: "Insérer les Numéros",

      pdfToImgTitle: "Convertir PDF en Images",
      formatJpg: "Format JPG",
      formatPng: "Format PNG",
      downloadAllZip: "Tout Télécharger en ZIP",
      downloadSingle: "Télécharger la Page",

      protectTitle: "Protéger par Mot de Passe",
      enterPassword: "Créer un mot de passe :",
      confirmPassword: "Confirmer le mot de passe :",
      protectAction: "Chiffrer le PDF",

      unlockTitle: "Déverrouiller le PDF",
      currentPassword: "Mot de passe actuel :",
      unlockAction: "Supprimer le Mot de Passe"
    },

    featuresSection: {
      title: "Pourquoi choisir notre suite PDF ?",
      f1Title: "100% Confidentialité Locale",
      f1Desc: "Tous vos fichiers restent sur votre machine. Aucun envoi sur un serveur distant.",
      f2Title: "Scanner Caméra Intégré",
      f2Desc: "Numérisez vos reçus et documents directement depuis votre webcam ou smartphone.",
      f3Title: "Graphiques Professionnels",
      f3Desc: "Visualisez la structure et simulez les gains d'espace avec des graphiques vectoriels.",
      f4Title: "Gratuit et Illimité",
      f4Desc: "Aucun abonnement ni restriction de page."
    }
  },

  de: {
    appTitle: "DocuMaster PDF Studio",
    tagline: "Die professionelle All-in-One PDF-Suite: bearbeiten, konvertieren, scannen und analysieren.",
    badgePrivacy: "100% Lokale Privatsphäre • Keine Dateien an Server übertragen",
    searchPlaceholder: "Über 15 PDF-Tools durchsuchen...",
    themeDark: "Dunkelmodus",
    themeLight: "Hellmodus",
    language: "Sprache",

    catAll: "Alle Werkzeuge",
    catPopular: "Beliebt",
    catScan: "Scanner & Fotos",
    catEdit: "Bearbeiten & Signieren",
    catOrganize: "Organisieren & Seiten",
    catConvert: "Konvertieren",
    catSecurity: "Sicherheit",
    catAnalytics: "Diagramme & Analyse",

    tools: {
      scanner: {
        title: "Dokumenten-Scanner",
        desc: "Mit Kamera scannen oder Fotos hochladen, scharfe B&W Filter anwenden und PDF erstellen.",
        badge: "Kamera / KI"
      },
      analytics: {
        title: "Diagramme & Dokument-Inspektor",
        desc: "Professionelle Grafiken: Inhaltsdichte, Komprimierungsersparnis und Sicherheitsprüfung.",
        badge: "Pro Diagramme"
      },
      merge: {
        title: "PDF Zusammenfügen",
        desc: "Mehrere PDF-Dateien in gewünschter Reihenfolge zu einem einzigen Dokument verbinden.",
        badge: "Meistgenutzt"
      },
      split: {
        title: "PDF Teilen & Extrahieren",
        desc: "Bestimmte Seiten auswählen oder jede Seite einzeln mit visueller Auswahl trennen.",
        badge: "Beliebt"
      },
      compress: {
        title: "PDF Komprimieren",
        desc: "Dateigröße optimieren mit interaktivem Diagramm zur Speicherersparnis.",
        badge: "Platz sparen"
      },
      edit: {
        title: "PDF Bearbeiten & Anmerken",
        desc: "Textfelder, Freihandzeichnung, Textmarker, geometrische Formen und Stempel einfügen.",
        badge: "Interaktiv"
      },
      fillForm: {
        title: "PDF-Formulare Ausfüllen",
        desc: "Interaktive PDF-Formulare (AcroForms) ausfüllen oder Text, Häkchen (✓), Kreuze (✗), Datum und Unterschriften einfügen.",
        badge: "Formulare Ausfüllen"
      },
      sign: {
        title: "PDF Signieren (eSign)",
        desc: "Unterschrift zeichnen, kalligrafischen Namen eingeben oder Stempelbild platzieren.",
        badge: "Digitale Signatur"
      },
      organize: {
        title: "Seiten Organisieren",
        desc: "Visuelles Drag & Drop: Seiten neu anordnen, drehen, duplizieren und löschen.",
        badge: "Visuell"
      },
      rotate: {
        title: "PDF Drehen",
        desc: "Seiten um 90°, 180° oder 270° im Uhrzeigersinn drehen.",
        badge: "Schnell"
      },
      pdfToImg: {
        title: "PDF zu Bildern (JPG / PNG)",
        desc: "Jede Seite in hochauflösende Bilder umwandeln und als ZIP herunterladen.",
        badge: "Hohe Auflösung"
      },
      imgToPdf: {
        title: "Bilder zu PDF",
        desc: "JPG-, PNG- und WebP-Bilder zu einem sauberen PDF zusammenfügen.",
        badge: "Multi-Bild"
      },
      watermark: {
        title: "Wasserzeichen hinzufügen",
        desc: "Text- oder Bild-Wasserzeichen mit Deckkraft, Winkel und Live-Vorschau einfügen.",
        badge: "Copyright"
      },
      pageNumbers: {
        title: "Seitenzahlen",
        desc: "Seitenzahlen mit individuellem Format, Position und Rändern einfügen.",
        badge: "Layout"
      },
      protect: {
        title: "Mit Passwort schützen",
        desc: "Starke Verschlüsselung hinzufügen, um unbefugten Zugriff zu verhindern.",
        badge: "Sicherheit"
      },
      unlock: {
        title: "PDF Entsperren",
        desc: "Passwörter und Einschränkungen von autorisierten Dateien entfernen.",
        badge: "Zugriff"
      },
      pdfToText: {
        title: "Text & OCR Extrahieren",
        desc: "Gesamten Text mit Wort- und Lesezeitstatistik exportieren.",
        badge: "TXT Export"
      },
      flatten: {
        title: "PDF Abflachen (Flatten)",
        desc: "Formulare und Notizen in unveränderliche statische Ebenen umwandeln.",
        badge: "Zertifizieren"
      }
    },
    fillFormModal: {
      title: "PDF-Formular Ausfüllen (Fill and Sign)",
      subtitle: "Interaktive Formularfelder ausfüllen oder an beliebiger Stelle Text, Häkchen und Datum einfügen.",
      toolText: "Text (Aa)",
      toolCheck: "Häkchen (✓)",
      toolCross: "Kreuz (✗)",
      toolDate: "Heutiges Datum",
      toolSign: "Schnelle Signatur",
      acroFound: "Interaktive Formularfelder erkannt. Füllen Sie diese direkt aus.",
      acroNotFound: "Standard-Dokument: Wählen Sie oben ein Werkzeug und klicken Sie an eine beliebige Stelle.",
      downloadFilled: "Ausgefülltes PDF Herunterladen",
      deleteElement: "Löschen",
      clearAll: "Zurücksetzen",
      fontSize: "Größe:"
    },

    scannerModal: {
      title: "Erweiterter Dokumenten-Scanner",
      subtitle: "Mit Kamera aufnehmen oder Fotos hochladen, Kontrast anpassen und PDF erstellen.",
      tabCamera: "Live-Kamera",
      tabUpload: "Fotos Hochladen",
      startCamera: "Kamera Starten",
      stopCamera: "Kamera Stoppen",
      switchCamera: "Kamera Wechseln",
      capturePage: "Seite Erfassen",
      filterTitle: "Dokumentenfilter:",
      filterOriginal: "Originalfarbe",
      filterBw: "B&W Dokument (Scharf)",
      filterGray: "Graustufen",
      filterVivid: "Kräftige Farben",
      rotateLeft: "Drehen -90°",
      rotateRight: "Drehen +90°",
      pagesScanned: "Gescannte Seiten:",
      noPagesYet: "Noch keine Seiten erfasst.",
      addAnother: "Weitere Seite hinzufügen",
      clearAll: "Alles Löschen",
      generatePdf: "PDF-Dokument Erstellen",
      extractOcr: "Text Erkennen (OCR)",
      pageSize: "Seitengröße:",
      pageA4: "A4 (Standard)",
      pageLetter: "US Letter",
      pageFit: "An Bild anpassen",
      cameraError: "Kamerazugriff nicht möglich. Bitte Berechtigungen prüfen.",
      cameraPermission: "Bitte erlauben Sie den Zugriff auf die Kamera."
    },

    analyticsModal: {
      title: "Dokument-Inspektor & Diagramme",
      subtitle: "Detaillierte visuelle Analyse von Struktur, Komprimierung und Orientierung.",
      chart1Title: "Dokumenten-Zusammensetzung",
      chart2Title: "Simulation Speicherersparnis (KB)",
      chart3Title: "Seiten-Orientierung",
      statPages: "Gesamtseiten",
      statSize: "Dateigröße",
      statDpi: "Geschätzte DPI",
      statSecurity: "Sicherheitsstatus",
      statEncrypted: "Geschützt",
      statOpen: "Ungeschützt",
      statEfficiency: "Effizienz",
      insightsTitle: "Erkenntnisse:",
      tipCompress: "Das Dokument enthält große Bilder: eine Komprimierung spart über 50%.",
      tipOptimize: "Die PDF-Struktur ist optimal für die Langzeitarchivierung.",
      downloadReport: "Bericht Herunterladen"
    },

    common: {
      uploadPrompt: "PDF-Datei hierher ziehen oder",
      uploadPromptMulti: "PDF-Dateien hierher ziehen oder",
      uploadPromptImages: "Bilder (JPG, PNG) hierher ziehen oder",
      browseFiles: "Dateien Auswählen",
      supportedFormats: "Unterstützt PDF bis 100MB",
      cancel: "Abbrechen",
      apply: "Anwenden & Verarbeiten",
      download: "Ergebnis Herunterladen",
      processing: "Wird verarbeitet...",
      success: "Vorgang erfolgreich abgeschlossen!",
      error: "Ein Fehler ist aufgetreten.",
      page: "Seite",
      of: "von",
      pages: "Seiten",
      files: "ausgewählte Dateien",
      remove: "Entfernen",
      preview: "Vorschau",
      dragToReorder: "Zum Sortieren ziehen",
      backToTools: "Zurück zu Werkzeugen",
      saveChanges: "Änderungen Speichern",
      close: "Schließen"
    },

    toolDetails: {
      mergeTitle: "PDF-Dateien Zusammenfügen",
      mergeDesc: "Ordnen Sie die Dateien vor dem Verbinden an.",
      addMorePdfs: "Weitere PDFs hinzufügen",
      mergeAction: "Jetzt Zusammenfügen",

      splitTitle: "Seiten Teilen & Extrahieren",
      splitDesc: "Seiten anklicken oder Seitenbereiche eingeben.",
      splitModeAll: "Jede Seite einzeln trennen",
      splitModeRange: "Bereiche (z.B. 1-3, 5, 8-10)",
      splitAction: "Seiten Extrahieren",

      compressTitle: "PDF Komprimieren",
      compressDesc: "Wählen Sie das passende Komprimierungsniveau.",
      compressExtreme: "Maximale Komprimierung",
      compressRecommended: "Empfohlen (Ausgewogen)",
      compressLow: "Geringe Komprimierung",
      originalSize: "Aktuelle Größe:",
      estimatedSize: "Geschätzte Größe:",
      savings: "Geschätzte Ersparnis:",
      compressAction: "Jetzt Komprimieren",

      editorTitle: "Visueller PDF-Editor",
      editorDesc: "Text, Zeichnungen, Textmarker, Formen und Stempel hinzufügen.",
      toolText: "Text",
      toolDraw: "Zeichnen",
      toolHighlight: "Hervorheben",
      toolShape: "Formen",
      toolStamp: "Stempel",
      toolSign: "Signatur",
      color: "Farbe:",
      strokeSize: "Strichstärke:",
      fontSize: "Schriftgröße:",
      stamps: ["GENEHMIGT", "VERTRAULICH", "ENTWURF", "BEZAHLT", "DRINGEND"],
      applyEditor: "Speichern & Herunterladen",

      signTitle: "Signatur Hinzufügen",
      signDesc: "Erstellen Sie Ihre Signatur und platzieren Sie diese auf der Seite.",
      signTabDraw: "Freihand Zeichnen",
      signTabType: "Name Tippen",
      signTabUpload: "Bild Hochladen",
      clearSignature: "Löschen",
      typePlaceholder: "Vollständigen Namen eingeben...",
      placeSignature: "Signatur Platzieren",

      watermarkTitle: "Wasserzeichen",
      watermarkText: "Wasserzeichentext:",
      watermarkOpacity: "Deckkraft:",
      watermarkRotation: "Winkel:",
      watermarkAction: "Wasserzeichen Anwenden",

      pageNumbersTitle: "Seitenzahlen",
      pnPosition: "Position:",
      pnFormat: "Format:",
      pnAction: "Seitenzahlen Einfügen",

      pdfToImgTitle: "PDF zu Bildern",
      formatJpg: "JPG Format",
      formatPng: "PNG Format",
      downloadAllZip: "Alle als ZIP herunterladen",
      downloadSingle: "Seite Herunterladen",

      protectTitle: "Mit Passwort Schützen",
      enterPassword: "Passwort erstellen:",
      confirmPassword: "Passwort bestätigen:",
      protectAction: "PDF Verschlüsseln",

      unlockTitle: "PDF Entsperren",
      currentPassword: "Datei-Passwort:",
      unlockAction: "Passwort Entfernen"
    },

    featuresSection: {
      title: "Warum unsere PDF-Suite wählen?",
      f1Title: "100% Lokale Sicherheit",
      f1Desc: "Dateien werden ausschließlich in Ihrem Browser verarbeitet. Keine Cloud-Übertragung.",
      f2Title: "Integrierter Kamera-Scanner",
      f2Desc: "Dokumente und Belege direkt mit der Kamera erfassen und bereinigen.",
      f3Title: "Professionelle Diagramme",
      f3Desc: "Detaillierte Analyse von Speicherplatz und Seitendichte mit interaktiven Grafiken.",
      f4Title: "Kostenlos ohne Limits",
      f4Desc: "Keine Begrenzung der Seitenanzahl und keine Abonnements."
    }
  },

  pt: {
    appTitle: "DocuMaster PDF Studio",
    tagline: "A suíte profissional de PDF tudo-em-um: edite, converta, digitalize e analise.",
    badgePrivacy: "100% Privacidade Local • Nenhum arquivo enviado para servidores",
    searchPlaceholder: "Pesquise entre mais de 15 ferramentas de PDF...",
    themeDark: "Modo Escuro",
    themeLight: "Modo Claro",
    language: "Idioma",

    catAll: "Todas as Ferramentas",
    catPopular: "Populares",
    catScan: "Scanner e Fotos",
    catEdit: "Editar e Assinar",
    catOrganize: "Organizar e Páginas",
    catConvert: "Converter",
    catSecurity: "Segurança",
    catAnalytics: "Gráficos e Análise",

    tools: {
      scanner: {
        title: "Scanner de Documentos",
        desc: "Digitalize pela câmera ou carregue fotos, aplique filtros B&W e crie PDFs de várias páginas.",
        badge: "Câmera / IA"
      },
      analytics: {
        title: "Gráficos e Inspetor",
        desc: "Gráficos profissionais: densidade de conteúdo, economia de compressão e auditoria.",
        badge: "Gráficos Pro"
      },
      merge: {
        title: "Juntar PDF",
        desc: "Combine múltiplos PDFs num único documento na ordem desejada com pré-visualização.",
        badge: "Mais Usado"
      },
      split: {
        title: "Dividir PDF",
        desc: "Extraia páginas específicas ou separe em arquivos individuais com seleção visual.",
        badge: "Popular"
      },
      compress: {
        title: "Comprimir PDF",
        desc: "Reduza o tamanho do arquivo otimizando imagens com gráfico de economia interativo.",
        badge: "Poupar Espaço"
      },
      edit: {
        title: "Editar PDF",
        desc: "Adicione caixas de texto, desenho livre, marcador, formas e carimbos aprovados.",
        badge: "Interativo"
      },
      fillForm: {
        title: "Preencher Formulários PDF",
        desc: "Preencha formulários interativos (AcroForms) ou insira texto, vistos (✓), cruzes (✗), data e assinatura em qualquer documento.",
        badge: "Preencher Formulário"
      },
      sign: {
        title: "Assinar PDF (eSign)",
        desc: "Desenhe a sua assinatura, digite com caligrafia ou carregue imagem e posicione no PDF.",
        badge: "Assinatura Digital"
      },
      organize: {
        title: "Organizar Páginas",
        desc: "Grelha visual arrastar e soltar: reordene, gire, duplique e elimine páginas em tempo real.",
        badge: "Visual"
      },
      rotate: {
        title: "Girar PDF",
        desc: "Gire as páginas em 90°, 180° ou 270° com um só clique.",
        badge: "Rápido"
      },
      pdfToImg: {
        title: "PDF para Imagens",
        desc: "Converta cada página em JPG ou PNG de alta resolução e descarregue em ZIP.",
        badge: "Alta Resolução"
      },
      imgToPdf: {
        title: "Imagens para PDF",
        desc: "Junte fotos JPG, PNG e WebP num documento PDF limpo com margens personalizadas.",
        badge: "Multi-Imagem"
      },
      watermark: {
        title: "Marca d'Água",
        desc: "Insira texto ou logótipo com transparência, rotação e visualização em tempo real.",
        badge: "Copyright"
      },
      pageNumbers: {
        title: "Numeração de Páginas",
        desc: "Adicione números de página escolhendo o formato, posição e margens.",
        badge: "Layout"
      },
      protect: {
        title: "Proteger com Senha",
        desc: "Adicione encriptação forte para impedir acessos não autorizados.",
        badge: "Segurança"
      },
      unlock: {
        title: "Desbloquear PDF",
        desc: "Remova senhas e restrições de arquivos autorizados.",
        badge: "Acesso"
      },
      pdfToText: {
        title: "Extrair Texto e OCR",
        desc: "Extraia todo o texto com contagem de palavras e estatísticas de leitura.",
        badge: "Exportar TXT"
      },
      flatten: {
        title: "Achatar PDF (Flatten)",
        desc: "Fixe formulários e anotações tornando-os elementos não editáveis.",
        badge: "Certificar"
      }
    },
    fillFormModal: {
      title: "Preencher Formulário PDF (Fill and Sign)",
      subtitle: "Preencha campos interativos ou clique em qualquer parte para inserir texto, vistos, datas e assinaturas.",
      toolText: "Texto (Aa)",
      toolCheck: "Visto (✓)",
      toolCross: "Cruz (✗)",
      toolDate: "Data de Hoje",
      toolSign: "Assinatura Rápida",
      acroFound: "Campos interativos detetados no documento. Preencha-os diretamente.",
      acroNotFound: "Documento padrão: selecione uma ferramenta acima e clique onde deseja escrever.",
      downloadFilled: "Guardar e Descarregar PDF Preenchido",
      deleteElement: "Eliminar",
      clearAll: "Limpar",
      fontSize: "Tamanho:"
    },

    scannerModal: {
      title: "Scanner de Documentos Avançado",
      subtitle: "Capture com a câmera ou carregue fotos, aplique filtros nítidos e gere PDFs.",
      tabCamera: "Câmera ao Vivo",
      tabUpload: "Carregar Fotos",
      startCamera: "Iniciar Câmera",
      stopCamera: "Parar Câmera",
      switchCamera: "Mudar Câmera",
      capturePage: "Capturar Página",
      filterTitle: "Filtro de Documento:",
      filterOriginal: "Cor Original",
      filterBw: "Documento B&W (Nítido)",
      filterGray: "Tons de Cinza",
      filterVivid: "Cor Viva",
      rotateLeft: "Girar -90°",
      rotateRight: "Girar +90°",
      pagesScanned: "Páginas Digitalizadas:",
      noPagesYet: "Nenhuma página capturada até ao momento.",
      addAnother: "Adicionar outra página",
      clearAll: "Limpar Tudo",
      generatePdf: "Criar Documento PDF",
      extractOcr: "Reconhecer Texto (OCR)",
      pageSize: "Tamanho da Página:",
      pageA4: "A4 (Padrão)",
      pageLetter: "US Letter",
      pageFit: "Ajustar à Imagem",
      cameraError: "Não foi possível aceder à câmera.",
      cameraPermission: "Por favor autorize o acesso à câmera."
    },

    analyticsModal: {
      title: "Inspetor de Documentos e Gráficos Pro",
      subtitle: "Análise visual profunda da estrutura, compressão e distribuição de páginas.",
      chart1Title: "Composição do Documento",
      chart2Title: "Simulação de Poupança de Espaço (KB)",
      chart3Title: "Orientação de Páginas",
      statPages: "Total de Páginas",
      statSize: "Tamanho",
      statDpi: "DPI Estimado",
      statSecurity: "Segurança",
      statEncrypted: "Protegido",
      statOpen: "Livre",
      statEfficiency: "Eficiência",
      insightsTitle: "Diagnóstico:",
      tipCompress: "O arquivo contém imagens pesadas: uma compressão pode poupar mais de 50%.",
      tipOptimize: "A estrutura do PDF está excelente para arquivamento legal.",
      downloadReport: "Descarregar Relatório"
    },

    common: {
      uploadPrompt: "Arraste e solte o seu PDF aqui ou",
      uploadPromptMulti: "Arraste e solte os seus arquivos PDF aqui ou",
      uploadPromptImages: "Arraste as suas imagens (JPG, PNG) aqui ou",
      browseFiles: "Explorar Arquivos",
      supportedFormats: "Suporta arquivos PDF até 100MB",
      cancel: "Cancelar",
      apply: "Aplicar e Processar",
      download: "Descarregar Resultado",
      processing: "A processar...",
      success: "Operação concluída com sucesso!",
      error: "Ocorreu um erro.",
      page: "Página",
      of: "de",
      pages: "páginas",
      files: "arquivos selecionados",
      remove: "Remover",
      preview: "Pré-visualização",
      dragToReorder: "Arraste para reordenar",
      backToTools: "Voltar às Ferramentas",
      saveChanges: "Guardar Alterações",
      close: "Fechar"
    },

    toolDetails: {
      mergeTitle: "Juntar Arquivos PDF",
      mergeDesc: "Ordene os arquivos na sequência preferida antes de juntar.",
      addMorePdfs: "Adicionar mais PDFs",
      mergeAction: "Juntar Agora",

      splitTitle: "Dividir e Extrair Páginas",
      splitDesc: "Clique nas páginas ou introduza intervalos personalizados.",
      splitModeAll: "Separar cada página",
      splitModeRange: "Intervalos (ex.: 1-3, 5, 8-10)",
      splitAction: "Extrair Páginas",

      compressTitle: "Comprimir PDF",
      compressDesc: "Escolha o nível de compressão ideal.",
      compressExtreme: "Compressão Máxima",
      compressRecommended: "Recomendada (Equilibrada)",
      compressLow: "Baixa Compressão",
      originalSize: "Tamanho original:",
      estimatedSize: "Tamanho estimado:",
      savings: "Poupança estimada:",
      compressAction: "Comprimir Agora",

      editorTitle: "Editor Visual de PDF",
      editorDesc: "Adicione texto, desenho, formas e carimbos.",
      toolText: "Texto",
      toolDraw: "Desenho",
      toolHighlight: "Realce",
      toolShape: "Formas",
      toolStamp: "Carimbos",
      toolSign: "Assinatura",
      color: "Cor:",
      strokeSize: "Espessura:",
      fontSize: "Tamanho:",
      stamps: ["APROVADO", "CONFIDENCIAL", "RASCUNHO", "PAGO", "URGENTE"],
      applyEditor: "Guardar e Descarregar PDF",

      signTitle: "Assinar Documento",
      signDesc: "Crie a sua assinatura e posicione-a no documento.",
      signTabDraw: "Desenhar à Mão",
      signTabType: "Digitar Nome",
      signTabUpload: "Carregar Imagem",
      clearSignature: "Limpar",
      typePlaceholder: "Escreva o seu nome completo...",
      placeSignature: "Posicionar Assinatura",

      watermarkTitle: "Marca d'Água",
      watermarkText: "Texto da Marca:",
      watermarkOpacity: "Opacidade:",
      watermarkRotation: "Ângulo:",
      watermarkAction: "Aplicar Marca",

      pageNumbersTitle: "Números de Página",
      pnPosition: "Posição:",
      pnFormat: "Formato:",
      pnAction: "Inserir Números",

      pdfToImgTitle: "Converter PDF em Imagens",
      formatJpg: "Formato JPG",
      formatPng: "Formato PNG",
      downloadAllZip: "Descarregar Tudo em ZIP",
      downloadSingle: "Descarregar Página",

      protectTitle: "Proteger com Senha",
      enterPassword: "Crie uma senha:",
      confirmPassword: "Confirme a senha:",
      protectAction: "Proteger PDF",

      unlockTitle: "Desbloquear PDF",
      currentPassword: "Senha atual:",
      unlockAction: "Remover Senha"
    },

    featuresSection: {
      title: "Porquê escolher o nosso estúdio?",
      f1Title: "100% Privacidade Local",
      f1Desc: "Os arquivos são processados diretamente no seu navegador. Nenhum envio para servidores.",
      f2Title: "Scanner de Câmera Integrado",
      f2Desc: "Capture recibos e documentos diretamente com a câmera do computador ou telemóvel.",
      f3Title: "Gráficos Profissionais",
      f3Desc: "Inspecione a densidade e simule a poupança de espaço com gráficos interativos.",
      f4Title: "Sem Limites, Sem Assinaturas",
      f4Desc: "Todas as ferramentas são 100% gratuitas e sem limites de páginas."
    }
  }
};

let currentLanguage = localStorage.getItem('documaster_lang') || 'it';

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('documaster_lang', lang);
    return true;
  }
  return false;
}

export function t(path, lang = currentLanguage) {
  const keys = path.split('.');
  let current = translations[lang] || translations['it'];
  for (const key of keys) {
    if (current && current[key] !== undefined) {
      current = current[key];
    } else {
      // Fallback to Italian or path
      let fallback = translations['it'];
      for (const fKey of keys) {
        if (fallback && fallback[fKey] !== undefined) {
          fallback = fallback[fKey];
        } else {
          return path;
        }
      }
      return fallback;
    }
  }
  return current;
}
