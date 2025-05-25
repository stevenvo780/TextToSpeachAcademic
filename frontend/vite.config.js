import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const API_URL = env.VITE_API_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy para rutas con prefijo /api/ (recomendado para futuras APIs)
        // Ejemplo: /api/users -> http://localhost:5000/users
        '/api': {
          target: API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        
        // Proxy universal para endpoints backend existentes y futuros
        // Captura automáticamente cualquier ruta que NO sea un recurso del frontend:
        // - ✅ Captura: /smart_split, /tts, /upload_pdf, /new_endpoint, etc.
        // - ❌ Ignora: /@vite, /src, /public, /node_modules, archivos (.js, .css, etc.), /assets, /favicon.ico
        // Esto significa que NUNCA tendrás que venir aquí a agregar nuevos endpoints manualmente
        '^/((?!@|src|public|node_modules|\\.|assets|favicon).)+': {
          target: API_URL,
          changeOrigin: true
        }
      }
    }
  }
})
