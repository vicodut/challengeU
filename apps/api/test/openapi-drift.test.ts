import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildOpenApiSpec } from '../src/tools/openapi';
import { createTestApp } from './helpers/create-test-app';

const committed = readFileSync(join(__dirname, '..', 'openapi.json'), 'utf8');

describe('OpenAPI contract', () => {
  it('matches the committed openapi.json (run `pnpm openapi` after changing the API)', async () => {
    const generated = await buildOpenApiSpec();

    expect(generated).toBe(committed);
  });

  it('is what the running app serves at /docs-json', async () => {
    const testApp = await createTestApp();
    try {
      const served = await request(testApp.http).get('/docs-json').expect(200);

      expect(served.body).toEqual(JSON.parse(committed));
    } finally {
      await testApp.close();
    }
  });
});
