import { Pool } from 'pg';

/**
 * Empties every application table (migration bookkeeping lives in the separate `drizzle`
 * schema and is untouched). Call it in `beforeAll` of each test file: files share one test
 * database and run sequentially (`fileParallelism: false`). A no-op while there are no tables.
 */
export async function resetDatabase(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rows } = await pool.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    );
    if (rows.length === 0) return;
    const tables = rows.map(({ tablename }) => `"${tablename}"`).join(', ');
    await pool.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
  } finally {
    await pool.end();
  }
}
