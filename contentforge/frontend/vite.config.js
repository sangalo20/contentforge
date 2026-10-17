import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Pin a dedicated, stable port so the origin Google OAuth trusts never
    // drifts. strictPort makes Vite fail loudly instead of hopping to 5174+.
    port: 5193,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    // Tailwind's vite plugin isn't needed to test behavior and slows the run.
    css: false,
  },
})
