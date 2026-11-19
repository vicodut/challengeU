import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { applyApiPrefix, createOpenApiDocument } from '../app.setup';

/** Boots the Nest app without listening and returns the serialized OpenAPI spec. */
export async function buildOpenApiSpec(): Promise<string> {
  const app = await NestFactory.create(AppModule, { logger: false });
  try {
    applyApiPrefix(app);
    return `${JSON.stringify(createOpenApiDocument(app), null, 2)}\n`;
  } finally {
    await app.close();
  }
}
