import { fireEvent, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { encodeCredentials, saveCredentials } from '@/shared/auth/session';
import { renderApp } from './render-app';
import { server } from './server';

let stop: (() => void) | undefined;
const bodies: unknown[] = [];

beforeEach(() => {
  sessionStorage.clear();
  saveCredentials(encodeCredentials('coachA', 'secret'));
  bodies.length = 0;
  server.use(
    http.get('/api/v1/me', () =>
      HttpResponse.json({
        userId: '2f1b6c0e-7d1e-4f6b-9a39-1a2b3c4d5e6f',
        username: 'coachA',
        displayName: 'Coach A',
        role: 'coach',
        timeZone: 'America/Toronto',
      }),
    ),
  );
});
afterEach(() => {
  stop?.();
});

async function submit(startsAt: string) {
  stop = renderApp('/coach/availability/new').stop;
  fireEvent.change(await screen.findByLabelText(/^Start/), { target: { value: startsAt } });
  fireEvent.click(screen.getByRole('button', { name: 'Publish block' }));
}

describe('new availability block', () => {
  it('shows the breadcrumb and sends the start in the coach zone as UTC', async () => {
    server.use(
      http.post('/api/v1/availability', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ id: 'x', startsAt: '', durationMinutes: 30 }, { status: 201 });
      }),
    );
    await submit('2030-01-07T09:00');

    expect(await screen.findByText('Block published.')).toBeTruthy();
    expect(bodies).toEqual([{ startsAt: '2030-01-07T14:00:00.000Z', durationMinutes: 60 }]);
    expect(screen.getByText('New availability block', { selector: '[aria-current]' })).toBeTruthy();
  });

  it('maps an error code to a message', async () => {
    server.use(
      http.post('/api/v1/availability', () =>
        HttpResponse.json(
          { status: 409, code: 'BLOCK_OVERLAP', title: '', type: '', detail: '' },
          { status: 409 },
        ),
      ),
    );
    await submit('2030-01-07T09:00');

    expect((await screen.findByRole('alert')).textContent).toBe(
      'This block overlaps one of your other blocks.',
    );
  });

  it('does not send a local time that does not exist', async () => {
    await submit('2030-03-10T02:30');

    expect((await screen.findByRole('alert')).textContent).toMatch(
      /does not exist or happens twice/,
    );
  });
});
