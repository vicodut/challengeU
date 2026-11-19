import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PublishBlock } from '../modules/booking';
import { AuthenticateUser, CreateAccount } from '../modules/identity';
import { CLOCK, type Clock } from '../shared/clock/clock.port';
import { seedBlocks } from './seed-blocks';
import { seedUsers } from './seed-users';

// Idempotent seed entry point: goes through the real use cases so events and messages exist.
async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    await seedUsers(app.get(CreateAccount));
    console.log('[db] seed: users ready');
    await seedBlocks(app.get(PublishBlock), app.get(AuthenticateUser), app.get<Clock>(CLOCK).now());
    console.log('[db] seed: availability blocks ready');
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  console.error('[db] seed failed', error);
  process.exit(1);
});
