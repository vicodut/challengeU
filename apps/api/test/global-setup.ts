import { runMigrations } from '../src/db/migrator';
import { testDatabaseUrl } from '../src/shared/config/config';

export default async function setup(): Promise<void> {
  await runMigrations(testDatabaseUrl());
}
