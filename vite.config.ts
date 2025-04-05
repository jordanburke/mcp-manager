import { defineConfig, UserConfig } from 'vite';

export default defineConfig({
  root: 'client',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3456',
        changeOrigin: true
      }
    }
  }
} as UserConfig);
