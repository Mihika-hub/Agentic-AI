import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development the /api functions run on a small local server (server/dev-server.js).
// API_PORT lets the browser tests run their own API on a separate port and database.
const apiProxy = { '/api': { target: `http://localhost:${process.env.API_PORT || 3001}`, changeOrigin: false } }

export default defineConfig({
  plugins: [react()],
  // Pre-bundle every dependency at startup so the first page load never triggers a re-bundle + reload.
  optimizeDeps: {
    include: ['react', 'react-dom/client', 'react-router-dom', 'framer-motion', 'recharts', 'lucide-react', 'canvas-confetti'],
  },
  server: { port: 5173, proxy: apiProxy },
  preview: { port: 4173, proxy: apiProxy },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          charts: ['recharts'],
        },
      },
    },
  },
})
