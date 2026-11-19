// Environment access lives here only. Values come from the per-worktree `.env`
// (loaded by the root scripts) with local defaults for direct invocations.
const DEFAULT_DATABASE_URL = 'postgres://challengeu:challengeu@localhost:5432/challengeu_dev';

export function databaseUrl(): string {
  return process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
}

export function apiPort(): number {
  return Number(process.env.API_PORT ?? 3000);
}
