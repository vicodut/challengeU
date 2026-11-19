import { runMigrations } from '../src/db/migrator';

export default async function setup(): Promise<void> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL is not set (run tests through `pnpm test`)');
  await runMigrations(url);
}
