import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CreateProgram } from '../modules/enrollment';
import { CreateAccount } from '../modules/identity';
import { seedPrograms } from './seed-programs';
import { seedUsers } from './seed-users';

// Idempotent seed entry point: goes through the real use cases so events and messages exist.
async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    await seedUsers(app.get(CreateAccount));
    console.log('[db] seed: users ready');
    await seedPrograms(app.get(CreateProgram));
    console.log('[db] seed: programs ready');
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  console.error('[db] seed failed', error);
  process.exit(1);
});
