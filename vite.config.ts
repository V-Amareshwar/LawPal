import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
  // For local development with MongoDB backend
  // Point to LOCAL backend for testing, or Render for production testing
  const localBackend = 'http://localhost:5000'  // ← CHANGED to localhost!
  
  // For Colab ngrok backend (uncomment and update when using Colab)
  const colabTarget = 'https://sainathsurya-lawpal.hf.space'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Auth endpoints (MongoDB backend)
        '/auth': {
          target: localBackend,
          changeOrigin: true,
          secure: false,
        },
        // Chat endpoints (can point to Colab or local)
        '/api': {
          target: colabTarget, // Change to colabTarget for Colab
          changeOrigin: true,
          secure: false,
          // If using Colab, rewrite to remove /api prefix
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})

