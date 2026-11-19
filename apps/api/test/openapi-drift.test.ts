import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildOpenApiSpec } from '../src/tools/openapi';

describe('OpenAPI contract', () => {
  it('matches the committed openapi.json (run `pnpm openapi` after changing the API)', async () => {
    const committed = readFileSync(join(__dirname, '..', 'openapi.json'), 'utf8');

    const generated = await buildOpenApiSpec();

    expect(generated).toBe(committed);
  });
});
