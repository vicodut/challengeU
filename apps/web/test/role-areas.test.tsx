import { fireEvent, screen, waitFor, within } from '@testing-library/react';
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

describe('admin programs', () => {
  it('lists programs and shows the breadcrumb trail', async () => {
    signInAs('admin');
    server.use(
      http.get('/api/v1/programs', () =>
        HttpResponse.json({ items: [{ id: 'a', name: 'Academic Success' }] }),
      ),
    );
    stop = renderApp('/admin/programs').stop;

    expect(await screen.findByText('Academic Success')).toBeTruthy();
    const crumbs = within(await screen.findByRole('navigation', { name: 'Breadcrumb' }));
    expect(crumbs.getByRole('link', { name: 'Admin' }).getAttribute('href')).toBe('/admin');
    expect(crumbs.getByText('Programs').getAttribute('aria-current')).toBe('page');
  });

  it('creates a program from /admin/programs/new and returns to the list', async () => {
    signInAs('admin');
    const items = [{ id: 'a', name: 'Academic Success' }];
    server.use(
      http.get('/api/v1/programs', () => HttpResponse.json({ items })),
      http.post('/api/v1/programs', async ({ request }) => {
        const { name } = (await request.json()) as { name: string };
        items.push({ id: 'b', name });
        return HttpResponse.json({ id: 'b', name }, { status: 201 });
      }),
    );
    const app = renderApp('/admin/programs/new');
    stop = app.stop;

    const crumbs = within(await screen.findByRole('navigation', { name: 'Breadcrumb' }));
    expect(crumbs.getByRole('link', { name: 'Programs' }).getAttribute('href')).toBe(
      '/admin/programs',
    );
    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: 'Leadership' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create program' }));

    expect(await screen.findByText('Leadership')).toBeTruthy();
    expect(app.router.state.location.pathname).toBe('/admin/programs');
  });
});
