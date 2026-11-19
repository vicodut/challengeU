import { defineConfig } from 'orval';

// Generates a typed react-query client from the COMMITTED OpenAPI spec.
// The output folder is git-ignored and regenerated before dev, build, test, lint and typecheck.
export default defineConfig({
  api: {
    input: '../api/openapi.json',
    output: {
      mode: 'tags-split',
      target: 'src/api/generated/endpoints',
      schemas: 'src/api/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      override: {
        mutator: { path: 'src/shared/http/mutator.ts', name: 'customFetch' },
      },
    },
  },
});
