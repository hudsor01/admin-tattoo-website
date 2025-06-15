import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    exclude: [
      '**/node_modules/**', 
      '**/dist/**',
      '**/src/test/e2e/**',
      '**/tests/e2e/**',
      '**/playwright/**',
      '**/*.spec.ts',
      '**/*.e2e.*'
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})