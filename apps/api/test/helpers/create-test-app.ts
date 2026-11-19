import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { applyApiPrefixAndDocs } from '../../src/app.setup';
import { CLOCK } from '../../src/shared/clock/clock.port';
import { seedUsers } from '../../src/db/seed-users';
import { CreateAccount } from '../../src/modules/identity';
import { FakeClock } from './fake-clock';
import { resetDatabase } from './reset-database';
import { TestRoutesController } from './test-routes.controller';

export interface CreateTestAppOptions {
  /** Adjust the module before it compiles, e.g. `(builder) => builder.overrideProvider(X).useValue(y)`. */
  configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
}

export interface TestApp {
  app: INestApplication;
  /** The in-process HTTP server, ready for supertest. */
  http: Server;
  clock: FakeClock;
  /** Seeds the five users (admin, coachA/B, studentA/B) through the real use case. */
  seed: () => Promise<void>;
  close: () => Promise<void>;
}

/**
 * Resets the test database, then boots the real application in-process against the test database
 * (DATABASE_URL is pointed at it by vitest.config.mts), with a controllable Clock.
 */
export async function createTestApp(options: CreateTestAppOptions = {}): Promise<TestApp> {
  const clock = new FakeClock();
  await resetDatabase();
  const builder = Test.createTestingModule({
    imports: [AppModule],
    controllers: [TestRoutesController],
  })
    .overrideProvider(CLOCK)
    .useValue(clock);
  const moduleRef = await (options.configure?.(builder) ?? builder).compile();
  const app = moduleRef.createNestApplication();
  applyApiPrefixAndDocs(app);
  await app.init();
  return {
    app,
    http: app.getHttpServer() as Server,
    clock,
    seed: () => seedUsers(app.get(CreateAccount)),
    close: () => app.close(),
  };
}
