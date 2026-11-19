import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { HealthStatus } from '@/features/ops';
import { server } from './server';

function renderHealthStatus() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <HealthStatus />
    </QueryClientProvider>,
  );
}

describe('HealthStatus', () => {
  it('shows the API and database as healthy when the health endpoint answers 200', async () => {
    server.use(
      http.get('/api/v1/health', () =>
        HttpResponse.json({ status: 'ok', database: 'up', checkedAt: '2030-01-01T00:00:00.000Z' }),
      ),
    );

    renderHealthStatus();

    expect(await screen.findByText('API ok · database up')).toBeTruthy();
    expect(screen.getByText(/2030-01-01T00:00:00.000Z/)).toBeTruthy();
  });

  it('shows the API as unavailable when the health endpoint answers 503', async () => {
    server.use(http.get('/api/v1/health', () => new HttpResponse(null, { status: 503 })));

    renderHealthStatus();

    expect(await screen.findByText('API unavailable')).toBeTruthy();
  });
});
