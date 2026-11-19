import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { getHealth } from '@/api/generated/endpoints/ops/ops';
import { server } from './server';

describe('generated API client', () => {
  it('calls the health endpoint through the custom fetch mutator and returns typed data', async () => {
    server.use(
      http.get('http://localhost/api/v1/health', () =>
        HttpResponse.json({ status: 'ok', database: 'up', checkedAt: '2030-01-01T00:00:00.000Z' }),
      ),
    );

    const response = await getHealth();

    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      status: 'ok',
      database: 'up',
      checkedAt: '2030-01-01T00:00:00.000Z',
    });
  });
});
