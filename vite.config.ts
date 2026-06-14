import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'EduShare — Free Notes for Students',
        short_name: 'EduShare',
        description: 'Free educational notes, textbooks and question papers for AP & TS government school students',
        theme_color: '#4f46e5',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        categories: ['education', 'books'],
      },
      workbox: {
        // Cache pages and assets for offline use
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache Supabase API responses (notes list)
            urlPattern: /^https:\/\/auamyuvvlmgllljdmedk\.supabase\.co\/rest\/v1\/notes/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-notes-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }, // 24 hours
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Cache Supabase Storage files (PDFs)
            urlPattern: /^https:\/\/auamyuvvlmgllljdmedk\.supabase\.co\/storage\/v1\/object\/public/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdf-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 days
            },
          },
        ],
      },
    }),
  ],
})
