import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildOpenApiSpec } from './openapi';

const openApiPath = join(__dirname, '..', '..', 'openapi.json');

buildOpenApiSpec()
  .then((spec) => {
    writeFileSync(openApiPath, spec);
    console.log(`[openapi] wrote ${openApiPath}`);
  })
  .catch((error: unknown) => {
    console.error('[openapi] generation failed', error);
    process.exit(1);
  });
