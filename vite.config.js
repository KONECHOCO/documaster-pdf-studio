import { defineConfig } from 'vite';

export default defineConfig({
  // Percorsi relativi: la stessa build funziona nell'app nativa (Capacitor) e sul sito
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2500,
  },
});
