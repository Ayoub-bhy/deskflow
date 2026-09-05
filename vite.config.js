import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// BASE_PATH: '/' for localhost / custom domains, '/deskflow/' for GitHub Pages project sites.
const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'DeskFlow — healthy desk habits',
        short_name: 'DeskFlow',
        description: 'Move, hydrate and focus reminders for laptop desk workers.',
        theme_color: '#0f766e',
        background_color: '#f6f1e8',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
        categories: ['health', 'productivity'],
        orientation: 'any',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,mp3}'],
        // Videos are optional / large: never precache them.
        globIgnores: ['**/videos/**', '**/gifs/**'],
      },
    }),
  ],
})
