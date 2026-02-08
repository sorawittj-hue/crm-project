import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 7777,
    strictPort: false, // ถ้า port ซ้ำจะหา port ถัดไปอัตโนมัติ
  },
})