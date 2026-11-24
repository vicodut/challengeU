import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { encodeCredentials, saveCredentials } from '@/shared/auth/session';
import { renderApp } from './render-app';
import { server } from './server';

let stop: (() => void) | undefined;

beforeEach(() => {
  sessionStorage.clear();
  saveCredentials(encodeCredentials('studentB', 'secret'));
  server.use(
    http.get('/api/v1/me', () =>
      HttpResponse.json({
        userId: 'b',
        username: 'studentB',
        displayName: 'Student B',
        role: 'student',
        timeZone: 'America/Toronto',
      }),
    ),
    http.get('/api/v1/coaches', () =>
      HttpResponse.json({
        items: [{ id: 'coach-b', displayName: 'Coach B', timeZone: 'Europe/Paris' }],
      }),
    ),
  );
});
afterEach(() => {
  stop?.();
});

describe('student coaches', () => {
  it('lists the program coaches with a link to their week', async () => {
    stop = renderApp('/student/coaches').stop;

    const link = await screen.findByRole('link', { name: "See Coach B's week" });
    expect(link.getAttribute('href')).toBe('/student/coaches/coach-b/week');
  });
});
