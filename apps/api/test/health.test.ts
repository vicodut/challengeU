import type { Server } from 'node:http';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { applyApiPrefixAndDocs } from '../src/app.setup';
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
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PG_POOL)
      // Nothing listens on port 1: the ping fails fast with ECONNREFUSED.
      .useFactory({ factory: () => createPool('postgres://nobody:nopass@127.0.0.1:1/none') })
      .compile();
    const app = moduleRef.createNestApplication({ logger: false });
    applyApiPrefixAndDocs(app);
    await app.init();
    try {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/v1/health')
        .expect(503);

      expect(response.body).toMatchObject({ statusCode: 503 });
    } finally {
      await app.close();
    }
  });
});
