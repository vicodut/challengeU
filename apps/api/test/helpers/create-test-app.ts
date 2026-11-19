import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { CLOCK } from '../../src/shared/clock/clock.port';
import { FakeClock } from './fake-clock';
import { resetDatabase } from './reset-database';

export interface TestApp {
  app: INestApplication;
  /** The in-process HTTP server, ready for supertest. */
  http: Server;
  clock: FakeClock;
  close: () => Promise<void>;
}

/**
 * Resets the test database, then boots the real application in-process against the test database
 * (DATABASE_URL is pointed at it by vitest.config.mts), with a controllable Clock.
 */
export async function createTestApp(clock: FakeClock = new FakeClock()): Promise<TestApp> {
  await resetDatabase();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(CLOCK)
    .useValue(clock)
    .compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return { app, http: app.getHttpServer() as Server, clock, close: () => app.close() };
}
