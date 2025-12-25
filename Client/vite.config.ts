import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  root: path.resolve(__dirname),
  base: './',
  plugins: [react()],
  optimizeDeps: {
    include: ['chart.js', 'chart.js/auto'],
    exclude: ['primereact/chart'],
  },
  resolve: {
    alias: {
      '@fobos/database': path.resolve(__dirname, '../Database')
    }
  },
  build: {
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: true
  },
  server: { port: 5173 }
})
