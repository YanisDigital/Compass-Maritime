import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Two shapes of the same application.
 *
 * The default build is the installable progressive web app. With `VITE_SINGLE_FILE=true`
 * it becomes one self-contained HTML file that opens straight from disk: no service
 * worker, every asset inlined, one chunk. See `scripts/build-single-file.mjs`.
 */
const singleFile = process.env.VITE_SINGLE_FILE === 'true';

export default defineConfig({
  // Relative, so the bundle also works from a file path and inside the Tauri and
  // Capacitor shells, not only from a web server root.
  base: './',
  plugins: [
    react(),
    ...(singleFile
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
            workbox: {
              // The whole application is precached: there is no network at sea.
              globPatterns: ['**/*.{js,css,html,svg,woff2}'],
            },
            manifest: {
              name: 'Compass Error Calculator',
              short_name: 'Compass Error',
              description:
                'Gyro and magnetic compass error from a celestial observation, for the bridge Compass Error Book.',
              theme_color: '#0b1220',
              background_color: '#0b1220',
              display: 'standalone',
              orientation: 'portrait',
              start_url: './',
              scope: './',
              icons: [
                { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
                {
                  src: 'icon-512-maskable.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
          }),
        ]),
  ],
  resolve: {
    alias: singleFile
      ? { 'virtual:pwa-register': fileURLToPath(new URL('./src/pwa-stub.ts', import.meta.url)) }
      : {},
  },
  build: {
    target: 'es2020',
    outDir: singleFile ? 'dist-single' : 'dist',
    cssCodeSplit: !singleFile,
    assetsInlineLimit: singleFile ? 100_000_000 : 4096,
    rollupOptions: singleFile ? { output: { inlineDynamicImports: true } } : {},
  },
});
