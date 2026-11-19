import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { API_PREFIX, createOpenApiDocument } from '../app.setup';

/** Boots the Nest app without listening and returns the serialized OpenAPI spec. */
export async function buildOpenApiSpec(): Promise<string> {
  const app = await NestFactory.create(AppModule, { logger: false });
  try {
    app.setGlobalPrefix(API_PREFIX);
    return `${JSON.stringify(createOpenApiDocument(app), null, 2)}\n`;
  } finally {
    await app.close();
  }
}
