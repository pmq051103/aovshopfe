import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
        // Bỏ qua lỗi ECONNABORTED / ECONNREFUSED khi BE chưa sẵn sàng
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Chỉ log lỗi thật sự, không crash Vite
            if (!['ECONNABORTED', 'ECONNREFUSED', 'ECONNRESET'].includes(err.code)) {
              console.error('[proxy error]', err.message)
            }
          })
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          ui: ['framer-motion', 'swiper']
        }
      }
    }
  }
})
