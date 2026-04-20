import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    // Split vendor chunks so React core stays cached across app deploys.
    // When App.jsx changes, only the small app chunk re-downloads.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
        },
      },
    },
    // Enable CSS code splitting per entry
    cssCodeSplit: true,
    // Target modern browsers (ES2020+) for smaller bundles.
    target: 'es2020',
  },
})
