import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { i18n } from '@/shared/i18n';
import { server } from './server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(async () => {
  await i18n.changeLanguage('en');
  cleanup();
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});
