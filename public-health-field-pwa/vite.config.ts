import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    port: 5176,
    host: '0.0.0.0'
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'สาธารณสุขภาคสนาม',
        short_name: 'สธ.ภาคสนาม',
        description: 'แอปสำหรับเจ้าหน้าที่สาธารณสุขภาคสนาม',
        theme_color: '#0b3765',
        background_color: '#f3f7fc',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/pwa-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: 'index.html'
      },
      devOptions: { enabled: true }
    })
  ]
})