import { Pool } from 'pg';

/** The one place a pg Pool is constructed. Connects lazily. */
export function createPool(connectionString: string): Pool {
  return new Pool({ connectionString });
}

/** Runs `fn` with a short-lived pool and always ends it (one-shot scripts, test helpers). */
export async function withPool<T>(
  connectionString: string,
  fn: (pool: Pool) => Promise<T>,
): Promise<T> {
  const pool = createPool(connectionString);
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}
