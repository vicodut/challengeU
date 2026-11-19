// Per-worktree environment. Creates `.env` on first use with defaults and a
// deterministic offset derived from the worktree path, so two worktrees get
// different compose projects and ports and can run side by side.
import { createHash } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(rootDir, '.env');

function defaultEnv() {
  const digest = createHash('sha1').update(rootDir).digest();
  const offset = digest.readUInt16BE(0) % 100;
  const slug = digest.toString('hex').slice(0, 6);
  const dbPort = 5500 + offset;
  const user = 'challengeu';
  const password = 'challengeu';
  const db = 'challengeu_dev';
  const testDb = 'challengeu_test';
  const base = `postgres://${user}:${password}@localhost:${dbPort}`;
  return {
    COMPOSE_PROJECT_NAME: `challengeu-${slug}`,
    DB_PORT: String(dbPort),
    DB_USER: user,
    DB_PASSWORD: password,
    DB_NAME: db,
    DB_NAME_TEST: testDb,
    API_PORT: String(3100 + offset),
    WEB_PORT: String(5200 + offset),
    DATABASE_URL: `${base}/${db}`,
    TEST_DATABASE_URL: `${base}/${testDb}`,
  };
}

/** Creates `.env` if missing, loads it into process.env (existing vars win). */
export function ensureEnv() {
  if (!existsSync(envPath)) {
    const body = Object.entries(defaultEnv())
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    writeFileSync(envPath, `${body}\n`);
    console.log(`[env] created ${envPath}`);
  }
  process.loadEnvFile(envPath);
  return process.env;
}
