import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import { ensureEnv } from '../../scripts/env.mjs';

const env = ensureEnv();

export default defineConfig({
  // SWC emits decorator metadata, which Nest's DI needs (esbuild does not).
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // The app under test always talks to the test database.
    env: { DATABASE_URL: env.TEST_DATABASE_URL },
    testTimeout: 20_000,
  },
});
