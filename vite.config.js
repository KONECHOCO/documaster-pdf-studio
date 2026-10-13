import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['pdf-lib', 'pdfjs-dist', 'jszip', 'lucide', 'chart.js', 'canvas-confetti'],
  },
  build: {
    target: 'esnext'
  }
});
