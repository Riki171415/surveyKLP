import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: '/surveyKLP/' untuk GitHub Pages, '/' untuk Vercel
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_URL || '/',
  build: {
    chunkSizeWarningLimit: 2000,
  }
})
