import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { Clock } from '../../src/shared/clock/clock';
import { FakeClock } from './fake-clock';

export interface TestApp {
  app: INestApplication;
  /** The in-process HTTP server, ready for supertest. */
  http: Server;
  clock: FakeClock;
  close: () => Promise<void>;
}

/**
 * Boots the real application in-process against the test database
 * (DATABASE_URL is pointed at it by vitest.config.mts), with a controllable Clock.
 */
export async function createTestApp(clock: FakeClock = new FakeClock()): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Clock)
    .useValue(clock)
    .compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return { app, http: app.getHttpServer() as Server, clock, close: () => app.close() };
}
