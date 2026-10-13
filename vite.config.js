import { defineConfig } from 'vite';

export default defineConfig({
  // Percorsi assoluti: funzionano nell'app nativa (Capacitor serve da /) e nelle pagine SEO del sito (/it/merge-pdf/)
  base: '/',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2500,
  },
});
