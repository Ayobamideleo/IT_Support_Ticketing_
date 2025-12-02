import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Expose dev server on LAN by default and use a stable port
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
})
