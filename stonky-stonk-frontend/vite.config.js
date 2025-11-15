import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-staticwebapp-config',
      closeBundle() {
        try {
          copyFileSync('staticwebapp.config.json', 'dist/staticwebapp.config.json')
          console.log('✅ staticwebapp.config.json copiado a dist/')
        } catch (err) {
          console.error('⚠️ Error copiando staticwebapp.config.json:', err.message)
        }
      }
    }
  ],
  build: {
    outDir: "dist"   // <-- ESTA LÍNEA ES IMPORTANTE
  }
})
