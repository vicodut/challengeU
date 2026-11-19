import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { encodeCredentials, saveCredentials } from '@/shared/auth/session';
import { renderApp } from './render-app';
import { server } from './server';

const user = (role: string) => ({
  userId: '2f1b6c0e-7d1e-4f6b-9a39-1a2b3c4d5e6f',
  username: 'someone',
  displayName: 'Some One',
  role,
  timeZone: 'America/Toronto',
});

let stop: (() => void) | undefined;
beforeEach(() => {
  sessionStorage.clear();
  saveCredentials(encodeCredentials('someone', 'secret'));
});
afterEach(() => {
  stop?.();
});

function signInAs(role: string) {
  server.use(http.get('/api/v1/me', () => HttpResponse.json(user(role))));
}

describe('role areas', () => {
  it('sends a coach from /home to the coach section', async () => {
    signInAs('coach');
    const app = renderApp('/home');
    stop = app.stop;

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeTruthy();
    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/coach');
    });
  });

  it('sends a student who opens the admin section back to their own section', async () => {
    signInAs('student');
    const app = renderApp('/admin/users');
    stop = app.stop;

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/student');
    });
    expect(await screen.findByRole('navigation', { name: 'Main navigation' })).toBeTruthy();
  });

  it('shows a breadcrumb trail from the role section root to a nested page', async () => {
    signInAs('student');
    stop = renderApp('/student/sessions').stop;

    const crumbs = within(await screen.findByRole('navigation', { name: 'Breadcrumb' }));
    expect(crumbs.getByRole('link', { name: 'Student' }).getAttribute('href')).toBe('/student');
    expect(crumbs.getByText('Sessions').getAttribute('aria-current')).toBe('page');
  });
});
