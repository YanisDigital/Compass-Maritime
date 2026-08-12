import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * The application ships as one self-contained HTML file, so the bundle is built as a
 * single chunk with every asset inlined. `scripts/build-single-file.mjs` then folds the
 * script and the stylesheet into the document itself.
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    outDir: 'dist-single',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
