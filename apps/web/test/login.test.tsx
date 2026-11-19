import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { encodeCredentials, getCredentials, saveCredentials } from '@/shared/auth/session';
import { LOGIN_PATH } from '@/shared/routes/paths';
import { renderApp } from './render-app';
import { server } from './server';

const me = {
  userId: '2f1b6c0e-7d1e-4f6b-9a39-1a2b3c4d5e6f',
  username: 'studentA',
  displayName: 'Student A',
  role: 'student',
  timeZone: 'America/Toronto',
};
const problem = {
  type: 'about:blank',
  title: 'Unauthorized',
  status: 401,
  code: 'UNAUTHENTICATED',
};

let stop: (() => void) | undefined;
beforeEach(() => {
  sessionStorage.clear();
});
afterEach(() => {
  stop?.();
});

describe('login and logout', () => {
  it('logs in with valid credentials, keeps them in sessionStorage and sends the Basic header', async () => {
    const seen: (string | null)[] = [];
    server.use(
      http.get('/api/v1/me', ({ request }) => {
        seen.push(request.headers.get('authorization'));
        return HttpResponse.json(me);
      }),
    );
    const app = renderApp('/login');
    stop = app.stop;

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'studentA' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Signed in as Student A')).toBeTruthy();
    expect(app.router.state.location.pathname).toBe('/student');
    const expected = encodeCredentials('studentA', 'secret');
    expect(getCredentials()).toBe(expected);
    expect(seen).toContain(`Basic ${expected}`);
    expect(app.router.state.location.search).toBe('');
  });

  it('shows a wrong password message and stores nothing', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json(problem, { status: 401 })));
    const app = renderApp('/login');
    stop = app.stop;

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'studentA' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Wrong username or password.');
    expect(app.router.state.location.pathname).toBe('/login');
    expect(getCredentials()).toBeNull();
  });

  function attemptLogin(password: string) {
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'studentA' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
  }

  it('keeps already stored credentials when a login attempt is rejected', async () => {
    const stored = encodeCredentials('studentA', 'secret');
    saveCredentials(stored);
    server.use(http.get('/api/v1/me', () => HttpResponse.json(problem, { status: 401 })));
    const app = renderApp(LOGIN_PATH);
    stop = app.stop;

    attemptLogin('nope');

    expect((await screen.findByRole('alert')).textContent).toBe('Wrong username or password.');
    expect(getCredentials()).toBe(stored);
  });

  it.each([
    ['a 500 JSON problem', () => HttpResponse.json({ ...problem, status: 500 }, { status: 500 })],
    [
      'a 503 with an HTML body',
      () =>
        new HttpResponse('<html>Bad gateway</html>', {
          status: 503,
          headers: { 'content-type': 'text/html' },
        }),
    ],
  ])('shows a server error, not a wrong password, on %s', async (_name, respond) => {
    server.use(http.get('/api/v1/me', respond));
    const app = renderApp(LOGIN_PATH);
    stop = app.stop;

    attemptLogin('secret');

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Something went wrong on the server. Please try again.',
    );
    expect(getCredentials()).toBeNull();
  });

  it('shows a network error message when the server cannot be reached', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.error()));
    const app = renderApp(LOGIN_PATH);
    stop = app.stop;

    attemptLogin('secret');

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Could not reach the server. Please try again.',
    );
    expect(getCredentials()).toBeNull();
  });

  it('stays logged in after a refresh while credentials are stored', async () => {
    saveCredentials(encodeCredentials('studentA', 'secret'));
    server.use(http.get('/api/v1/me', () => HttpResponse.json(me)));
    stop = renderApp('/home').stop;

    expect(await screen.findByText('Signed in as Student A')).toBeTruthy();
  });

  it('redirects a protected page to /login when there are no credentials', async () => {
    const app = renderApp('/home');
    stop = app.stop;

    expect(await screen.findByRole('button', { name: 'Log in' })).toBeTruthy();
    expect(app.router.state.location.pathname).toBe('/login');
  });

  it('clears the credentials and redirects to /login on any 401', async () => {
    saveCredentials(encodeCredentials('studentA', 'changed'));
    server.use(http.get('/api/v1/me', () => HttpResponse.json(problem, { status: 401 })));
    const app = renderApp('/home');
    stop = app.stop;

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/login');
    });
    expect(await screen.findByRole('button', { name: 'Log in' })).toBeTruthy();
    expect(getCredentials()).toBeNull();
  });

  it('logs out: clears the credentials and returns to /login', async () => {
    saveCredentials(encodeCredentials('studentA', 'secret'));
    server.use(http.get('/api/v1/me', () => HttpResponse.json(me)));
    const app = renderApp('/home');
    stop = app.stop;

    fireEvent.click(await screen.findByRole('button', { name: 'Log out' }));

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/login');
    });
    expect(getCredentials()).toBeNull();
  });
});
