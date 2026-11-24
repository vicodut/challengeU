import { fireEvent, waitFor, screen } from '@testing-library/react';
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

describe('suspend and reactivate', () => {
  it('toggles the status from the student detail page', async () => {
    let status = 'active';
    const student = () => ({
      id: 's1',
      displayName: 'Student A',
      timeZone: 'America/Vancouver',
      programId,
      programName: 'Academic Success',
      status,
      statusChangedAt: '2030-01-01T00:00:00.000Z',
    });
    server.use(
      http.get('/api/v1/students/s1', () => HttpResponse.json(student())),
      http.patch('/api/v1/students/s1', async ({ request }) => {
        status = ((await request.json()) as { status: string }).status;
        return HttpResponse.json(student());
      }),
    );
    stop = renderApp('/admin/students/s1').stop;

    fireEvent.click(await screen.findByRole('button', { name: 'Suspend student' }));
    expect(await screen.findByRole('button', { name: 'Reactivate student' })).toBeTruthy();
    expect(screen.getByText('Suspended')).toBeTruthy();
  });
});

describe('suspended student banner', () => {
  it('shows across the student area only when suspended', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({
          userId: 'a',
          username: 's',
          displayName: 'S',
          role: 'student',
          timeZone: 'America/Toronto',
          studentStatus: 'suspended',
        }),
      ),
    );
    stop = renderApp('/student').stop;

    expect(await screen.findByText(/account is suspended/)).toBeTruthy();
  });
});
