import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      'html2canvas': path.resolve(__dirname, 'node_modules/html2canvas/dist/html2canvas.js')
    }
  },
  optimizeDeps: {
    include: ['html2canvas', 'jspdf']
  },
  test: {
    environment: 'jsdom'
  },
  build: {
    chunkSizeWarningLimit: 1000, 
  },
})
