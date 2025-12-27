import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages deployment
  // Change this to '/' if deploying to username.github.io (root)
  // Or '/repo-name/' for username.github.io/repo-name
  base: '/charachorder-training/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
