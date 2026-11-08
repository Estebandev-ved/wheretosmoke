import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend al que Vite reenvía /api y /ws en desarrollo (cámbialo con VITE_PROXY_TARGET).
const target = process.env.VITE_PROXY_TARGET || 'http://localhost:8081'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target, changeOrigin: false },
      '/ws': { target, ws: true, changeOrigin: false },
    },
  },
})
