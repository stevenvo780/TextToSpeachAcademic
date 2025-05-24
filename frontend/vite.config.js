import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redireccionar todas las peticiones de API al backend Flask
      '/smart_split': 'http://localhost:5000',
      '/tts': 'http://localhost:5000',
      '/clear_cache': 'http://localhost:5000',
      '/delete_audio': 'http://localhost:5000',
      '/export_all': 'http://localhost:5000',
      '/upload_pdf': 'http://localhost:5000',
      '/audio': 'http://localhost:5000'
    }
  }
})
