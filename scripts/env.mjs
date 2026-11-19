// Per-worktree environment: the single source of defaults for ports, database names and URLs.
// `.env` is generated on first use with a compose project name and ports derived from the
// worktree path; the derived ports are probed and the offset stepped until all three are free,
// so several worktrees can run side by side. Everything else reads process.env only.
import { createHash } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(rootDir, '.env');

const OFFSET_RANGE = 1000;
const PORT_BASE = { db: 15000, api: 13000, web: 14000 };

function isPortFree(port) {
  return new Promise((resolvePort) => {
    const server = createServer();
    server.once('error', () => resolvePort(false));
    server.listen(port, () => server.close(() => resolvePort(true)));
  });
}

async function pickOffset(start) {
  for (let step = 0; step < OFFSET_RANGE; step += 1) {
    const offset = (start + step) % OFFSET_RANGE;
    const free = await Promise.all(
      Object.values(PORT_BASE).map((base) => isPortFree(base + offset)),
    );
    if (free.every(Boolean)) return offset;
  }
  throw new Error('No free DB/API/web port triple found');
}

async function defaultEnv() {
  const digest = createHash('sha1').update(rootDir).digest();
  const offset = await pickOffset(digest.readUInt16BE(0) % OFFSET_RANGE);
  const user = 'challengeu';
  const password = 'challengeu';
  const db = 'challengeu_dev';
  const testDb = 'challengeu_test';
  const dbPort = PORT_BASE.db + offset;
  const base = `postgres://${user}:${password}@localhost:${dbPort}`;
  return {
    COMPOSE_PROJECT_NAME: `challengeu-${digest.toString('hex').slice(0, 6)}`,
    DB_PORT: String(dbPort),
    DB_USER: user,
    DB_PASSWORD: password,
    DB_NAME: db,
    DB_NAME_TEST: testDb,
    API_PORT: String(PORT_BASE.api + offset),
    WEB_PORT: String(PORT_BASE.web + offset),
    DATABASE_URL: `${base}/${db}`,
    TEST_DATABASE_URL: `${base}/${testDb}`,
  };
}

/** Creates `.env` if missing, loads it into process.env (existing vars win). */
export async function ensureEnv() {
  if (!existsSync(envPath)) {
    const body = Object.entries(await defaultEnv())
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    writeFileSync(envPath, `${body}\n`);
    console.log(`[env] created ${envPath}`);
  }
  process.loadEnvFile(envPath);
  return process.env;
}
