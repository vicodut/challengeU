import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AssignCoach, CreateProgram, ListPrograms } from '../modules/enrollment';
import { CreateAccount, PROFILE_DIRECTORY, type ProfileDirectory } from '../modules/identity';
import { seedProgramCoaches } from './seed-program-coaches';
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
    await seedProgramCoaches(
      app.get(ListPrograms),
      app.get(AssignCoach),
      app.get<ProfileDirectory>(PROFILE_DIRECTORY),
    );
    console.log('[db] seed: program coaches ready');
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  console.error('[db] seed failed', error);
  process.exit(1);
});
