import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // Thêm dòng này

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Thêm phần resolve.alias vào đây
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})