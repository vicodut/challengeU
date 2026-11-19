import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PG_POOL } from '../src/shared/db/database.module';
import { createPool } from '../src/shared/db/pool';
import { createTestApp, type TestApp } from './helpers/create-test-app';

describe('health and docs', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('reports the database as up under /api/v1/health', async () => {
    const response = await request(testApp.http).get('/api/v1/health').expect(200);

    expect(response.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('stamps the health check with the injected Clock, not the system time', async () => {
    testApp.clock.set('2031-06-15T12:30:00.000Z');

    const response = await request(testApp.http).get('/api/v1/health').expect(200);

    expect((response.body as { checkedAt: string }).checkedAt).toBe('2031-06-15T12:30:00.000Z');
  });

  it('does not serve health outside the /api/v1 prefix', async () => {
    await request(testApp.http).get('/health').expect(404);
  });

  it('serves Swagger UI at /docs and the raw spec at /docs-json, outside the prefix', async () => {
    await request(testApp.http).get('/docs').expect(200);
    const spec = await request(testApp.http).get('/docs-json').expect(200);

    expect(Object.keys((spec.body as { paths: object }).paths)).toContain('/api/v1/health');
  });
});

describe('health when the database is unreachable', () => {
  it('answers 503 instead of crashing', async () => {
    const testApp = await createTestApp({
      // Nothing listens on port 1: the ping fails fast with ECONNREFUSED.
      configure: (builder) =>
        builder
          .overrideProvider(PG_POOL)
          .useFactory({ factory: () => createPool('postgres://nobody:nopass@127.0.0.1:1/none') }),
    });
    try {
      const response = await request(testApp.http).get('/api/v1/health').expect(503);

      expect(response.body).toMatchObject({
        status: 503,
        code: 'DATABASE_UNAVAILABLE',
        title: 'Service Unavailable',
        type: expect.any(String) as string,
        detail: expect.any(String) as string,
      });
      expect(response.headers['content-type']).toContain('application/problem+json');
    } finally {
      await testApp.close();
    }
  });
});
