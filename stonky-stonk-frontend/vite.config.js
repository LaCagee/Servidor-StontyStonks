import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-staticwebapp-config',
      closeBundle() {
        // Copiar staticwebapp.config.json al directorio dist después del build
        try {
          copyFileSync('staticwebapp.config.json', 'dist/staticwebapp.config.json')
          console.log('✅ staticwebapp.config.json copiado a dist/')
        } catch (err) {
          console.error('⚠️  Error copiando staticwebapp.config.json:', err.message)
        }
      }
    }
  ],
})
