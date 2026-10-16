import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  assetsInclude: ['**/*.lottie'],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@lottiefiles/dotlottie-react')) {
            return 'vendor-lottie';
          }
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
})
