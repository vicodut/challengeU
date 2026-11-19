import { waitFor, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { encodeCredentials, saveCredentials } from '@/shared/auth/session';
import { renderApp } from './render-app';
import { server } from './server';

let stop: (() => void) | undefined;
const programId = '2f1b6c0e-7d1e-4f6b-9a39-1a2b3c4d5e6f';

beforeEach(() => {
  sessionStorage.clear();
  saveCredentials(encodeCredentials('admin', 'secret'));
  server.use(
    http.get('/api/v1/me', () =>
      HttpResponse.json({
        userId: 'a',
        username: 'admin',
        displayName: 'Admin',
        role: 'admin',
        timeZone: 'America/Toronto',
      }),
    ),
    http.get('/api/v1/programs', () =>
      HttpResponse.json({
        items: [
          { id: 'other', name: 'Career Launch' },
          { id: programId, name: 'Academic Success' },
        ],
      }),
    ),
  );
});
afterEach(() => {
  stop?.();
});

describe('register student', () => {
  it('preselects the program passed by the program page', async () => {
    stop = renderApp(`/admin/students/new?programId=${programId}`).stop;

    await screen.findByRole('option', { name: 'Academic Success' }, { timeout: 5000 });
    const select = screen.getByLabelText<HTMLSelectElement>('Program');
    await waitFor(() => {
      expect(select.selectedOptions[0]?.textContent).toBe('Academic Success');
    });
  });
});
