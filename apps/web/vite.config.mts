/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { ensureEnv } from '../../scripts/env.mjs';

const env = ensureEnv();

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: Number(env.WEB_PORT ?? 5173),
    strictPort: true,
    // Same-origin in dev: the browser only ever talks to the web port.
    proxy: {
      '/api': `http://localhost:${env.API_PORT ?? 3000}`,
      '/docs': `http://localhost:${env.API_PORT ?? 3000}`,
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
  },
});
