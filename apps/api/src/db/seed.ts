import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CreateAccount } from '../modules/identity';
import { seedUsers } from './seed-users';

// Idempotent seed entry point: goes through the real use cases so events and messages exist.
async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    await seedUsers(app.get(CreateAccount));
    console.log('[db] seed: users ready');
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  console.error('[db] seed failed', error);
  process.exit(1);
});
