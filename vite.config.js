import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/gas': {
        target: 'https://script.google.com/macros/s/AKfycbz4ZJnDoHTYPIG1Hy4TQz6lbkC71qhbJOPPIRuJVHNNyCCjXSwaZEy7nBK2E_RLB2xC/exec',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gas/, ''),
      },
    },
  },
})
