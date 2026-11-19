import { fireEvent, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { encodeCredentials, saveCredentials } from '@/shared/auth/session';
import { renderApp } from './render-app';
import { server } from './server';

let stop: (() => void) | undefined;
const queries: string[] = [];
const block = (id: string, startsAt: string) => ({
  id,
  startsAt,
  durationMinutes: 60,
  bookedSessionCount: 0,
});

beforeEach(() => {
  sessionStorage.clear();
  saveCredentials(encodeCredentials('coachA', 'secret'));
  queries.length = 0;
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
    http.get('/api/v1/availability', ({ request }) => {
      const cursor = new URL(request.url).searchParams.get('cursor');
      queries.push(cursor ?? '');
      return HttpResponse.json(
        cursor
          ? { items: [block('b2', '2030-01-08T19:00:00.000Z')], nextCursor: null }
          : { items: [block('b1', '2030-01-07T14:00:00.000Z')], nextCursor: 'c1' },
      );
    }),
    http.get('/api/v1/availability/b1', () =>
      HttpResponse.json(block('b1', '2030-01-07T14:00:00.000Z')),
    ),
  );
});
afterEach(() => {
  stop?.();
});

describe('coach availability list', () => {
  it('shows blocks in the coach zone and pages with the cursor', async () => {
    stop = renderApp('/coach/availability').stop;

    expect(await screen.findByText(/Jan 7, 2030, 9:00/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText(/Jan 8, 2030, 2:00/)).toBeTruthy();
    expect(queries).toEqual(['', 'c1']);
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(await screen.findByText(/Jan 7, 2030, 9:00/)).toBeTruthy();
  });

  it('opens a block with its breadcrumb', async () => {
    stop = renderApp('/coach/availability').stop;
    fireEvent.click(await screen.findByRole('link', { name: /Jan 7, 2030/ }));

    expect(await screen.findByText('Booked sessions')).toBeTruthy();
    const crumbs = within(await screen.findByRole('navigation', { name: 'Breadcrumb' }));
    expect(crumbs.getByText('Availability block').getAttribute('aria-current')).toBe('page');
  });
});
