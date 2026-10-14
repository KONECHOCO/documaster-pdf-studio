# Dichiarazione ANSSI — risposte per il modulo

Il modulo si compila su demarche.numerique.gouv.fr, alla voce « Déclaration relative à un moyen de cryptologie ».

**Pagina iniziale:** scegli « Pour vous ».

## 1. Bénéficiaire

- **Nature du bénéficiaire:** Le bénéficiaire est un particulier

### Personne physique

| Campo | Risposta |
|---|---|
| Civilité | M. |
| Nom | KONE |
| Prénoms | INZA |
| Nationalité | Italienne |
| Adresse | Via Mignone 20, 29121 Piacenza (PC), Italie |
| Numéro de téléphone | +39 329 618 5600 |
| Adresse électronique | konechocoproduction@gmail.com |

## 2. Moyen de cryptologie

### Informations générales

| Campo | Risposta |
|---|---|
| Marque de distribution | Ikonet Solutions |
| Dénomination du moyen | DocuMaster PDF Studio |
| Version | 1.0.0 |
| Référence commerciale | com.ikonet.documaster |
| Date de mise sur le marché | 14/10/2026 (date di invio ad Apple) |
| Le bénéficiaire est-il le fabricant ? | Oui |

### Description fonctionnelle

- **Catégorie:** Logiciel
- **Description générale:**
  > Application grand public de gestion de documents PDF pour smartphones et tablettes (iOS/iPadOS, Android) et navigateur web : numérisation de documents par l'appareil photo, reconnaissance de texte (OCR), fusion, division, compression, annotation, signature manuscrite, remplissage de formulaires et conversion de fichiers. Tous les traitements sont réalisés localement sur l'appareil de l'utilisateur ; aucun document n'est envoyé à un serveur. Distribution gratuite sur l'App Store, Google Play et le site pdf.ikonetsolutions.com.
- **Fonction principale:** Envoi, stockage, réception d'informations (terminal de communication, logiciel de gestion, etc.)

### Description technique des services de cryptologie

- **Description des fonctionnalités cryptographiques:**
  > Chiffrement des données stockées : l'utilisateur peut protéger un fichier PDF qui lui appartient par un mot de passe (fonction « Protéger par mot de passe ») selon la norme publique ISO 32000-2 (PDF 2.0, Standard Security Handler, révision 6, AES-256), et retirer cette protection ou ouvrir un PDF protégé en fournissant le mot de passe. La cryptographie est réalisée par les bibliothèques libres QPDF 12.2.0 et PDF.js intégrées à l'application. Aucun algorithme propriétaire ; le mot de passe n'est ni stocké ni transmis ; aucune communication chiffrée n'est fournie par l'application.
- **Catégories:** Confidentialité
- **Protocoles sécurisés:** SSL/TLS
- **Autres protocoles:**
  > HTTPS fourni par le système d'exploitation (iOS/Android) ou le navigateur, uniquement pour le téléchargement public des modèles OCR, la publicité et les achats intégrés ; non implémenté par l'application.

### Algorithmes

Usa « Ajouter un élément » per ogni riga.

| Algorithme | Mode | Taille de clé | Fonction |
|---|---|---|---|
| AES | CBC | 256 | Chiffrement et déchiffrement des fichiers PDF protégés par l'utilisateur (PDF 2.0, révision 6) |
| SHA-256 / SHA-384 / SHA-512 | Hachage itératif (ISO 32000-2, algorithme 2.B) | NA | Dérivation et vérification de la clé à partir du mot de passe |
| AES | CBC | 128 | Déchiffrement uniquement d'anciens PDF protégés (révision 4) |
| RC4 | Flux | 40 à 128 | Déchiffrement uniquement d'anciens PDF protégés (révisions 2 et 3) |
| MD5 | Hachage | NA | Dérivation de clé des anciens PDF et identifiant de fichier |

## 3. Pièces à joindre

| Pezzo | File |
|---|---|
| Brochure commerciale | `docs/anssi/brochure-commerciale.pdf` |
| Brochure technique (Datasheet) | `docs/anssi/brochure-technique.pdf` |
| Attestation | Modello scaricabile dal modulo stesso, alla sezione « Pièces à joindre ». **Va compilato e firmato da te**, poi caricato. |
| Kbis / présentation de la société | **Non** richiesti: sei una persona fisica |

## Dopo l'invio

1. Arrivano due email: l'avviso di ricevimento e poi l'attestation ANSSI con il numero di pratica.
2. Con l'attestation:
   - in App Store Connect, alla build/versione, rispondi « Sì » alla Francia e carica il documento;
   - rimetto la Francia nella disponibilità;
   - aggiorno `ITSAppUsesNonExemptEncryption` nell'Info.plist.
