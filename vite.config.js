import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// base: '/surveyKLP/' untuk GitHub Pages, '/' untuk Vercel
export default defineConfig({
  plugins: [react(), nodePolyfills()],
  base: process.env.VITE_BASE_URL || '/',
  build: {
    chunkSizeWarningLimit: 2000,
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  },
  optimizeDeps: {
    include: ['recharts']
  },
  server: {
    allowedHosts: ['jamkesfktp.web.id'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4174,
    allowedHosts: ['jamkesfktp.web.id'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true
      }
    }
  }
})
