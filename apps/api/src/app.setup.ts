import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { DOCS_JSON_PATH, DOCS_PATH } from './shared/auth/public.decorator';

export const API_PREFIX = 'api/v1';

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('ChallengeU API')
    .setDescription('Coaching session booking')
    .setVersion('1.0')
    .addBasicAuth()
    .build();
  return SwaggerModule.createDocument(app, config);
}

/** Prefix only: enough to build the OpenAPI document; applied everywhere an app is built. */
export function applyApiPrefix(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
}

/** Prefix plus Swagger docs (public, see PUBLIC_PATHS); used by main.ts and the test harness. */
export function applyApiPrefixAndDocs(app: INestApplication): void {
  applyApiPrefix(app);
  // Docs live outside the prefix: /docs and /docs-json.
  SwaggerModule.setup(DOCS_PATH, app, createOpenApiDocument(app), {
    jsonDocumentUrl: DOCS_JSON_PATH,
  });
}
