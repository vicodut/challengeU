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
