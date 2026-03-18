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
      // Catch any request starting with /api
      '/api': {
        target: 'http://localhost:3000', // Your Express server's address
        changeOrigin: true,
        secure: false, // Set to false if you are not using https locally
      }
    }
  }
})
