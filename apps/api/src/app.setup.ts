import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

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

/** Global behaviour that shapes the API surface; applied everywhere an app is built. */
export function applyGlobalConfig(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
}

/** Used by main.ts and the test harness so both serve the same surface. */
export function configureApp(app: INestApplication): void {
  applyGlobalConfig(app);
  // Docs live outside the prefix: /docs and /docs-json.
  SwaggerModule.setup('docs', app, createOpenApiDocument(app), { jsonDocumentUrl: 'docs-json' });
}
