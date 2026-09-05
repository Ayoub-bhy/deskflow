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
      includeAssets: ['icon.svg'],
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
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,mp3}'],
        // Videos are optional / large: never precache them.
        globIgnores: ['**/videos/**'],
      },
    }),
  ],
})
