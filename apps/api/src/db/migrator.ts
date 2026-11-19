import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { withPool } from '../shared/db/pool';

export const migrationsFolder = join(__dirname, '..', '..', 'drizzle');

/** Applies all pending migrations to the database behind `connectionString`. */
export async function runMigrations(connectionString: string): Promise<void> {
  await withPool(connectionString, (pool) => migrate(drizzle(pool), { migrationsFolder }));
}
