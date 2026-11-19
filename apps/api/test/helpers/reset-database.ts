import { databaseUrl } from '../../src/shared/config/config';
import { withPool } from '../../src/shared/db/pool';

/**
 * Empties every application table (migration bookkeeping lives in the separate `drizzle`
 * schema and is untouched). Call it in `beforeAll` of each test file: files share one test
 * database and run sequentially (`fileParallelism: false`). A no-op while there are no tables.
 */
export async function resetDatabase(): Promise<void> {
  await withPool(databaseUrl(), async (pool) => {
    const { rows } = await pool.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    );
    if (rows.length === 0) return;
    const tables = rows.map(({ tablename }) => `"${tablename}"`).join(', ');
    await pool.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
  });
}
