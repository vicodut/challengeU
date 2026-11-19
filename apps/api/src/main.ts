import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyApiPrefixAndDocs } from './app.setup';
import { apiPort } from './shared/config/config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  applyApiPrefixAndDocs(app);
  await app.listen(apiPort());
}

void bootstrap();
