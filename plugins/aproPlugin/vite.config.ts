import path from 'node:path'
import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'

export default defineConfig({
  test: {
    testTimeout: 300000,
    env: dotenv.config().parsed,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
})
