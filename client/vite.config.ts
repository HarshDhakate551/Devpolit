import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000, // Change this to whatever port you want (e.g., 3000, 5000, 8080)
    strictPort: true, // Optional: if true, Vite will fail instead of automatically picking the next available port if 3000 is busy
  },
})
