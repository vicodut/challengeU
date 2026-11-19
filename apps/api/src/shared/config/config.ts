// Environment access lives here only. Values come from the per-worktree `.env`
// (generated and loaded by scripts/env.mjs); there are no literal defaults to keep in sync.
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name} (see .env.example)`);
  return value;
}

export function databaseUrl(): string {
  return required('DATABASE_URL');
}

export function apiPort(): number {
  return Number(required('API_PORT'));
}

/** Only set when running through the test harness (`pnpm test`). */
export function testDatabaseUrl(): string {
  return required('TEST_DATABASE_URL');
}
