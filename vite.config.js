import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Split heavy vendors so the initial JS stays lean; three/drei already
    // load lazily with the 3D scene, framer/gsap are shared across pages.
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          animation: ['gsap', 'framer-motion', 'lenis'],
        },
      },
    },
    chunkSizeWarningLimit: 1100,
  },
})
