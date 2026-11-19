// Entry point behind `pnpm dev|test|build|openapi|db:up`.
// Prepares the environment and the database, then delegates to Turborepo.
import { spawnSync } from 'node:child_process';
import { ensureEnv, rootDir } from './env.mjs';

const env = await ensureEnv();

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: rootDir, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  return result;
}

function psql(sql) {
  const result = spawnSync(
    'docker',
    ['compose', 'exec', '-T', 'db', 'psql', '-U', env.DB_USER, '-d', env.DB_NAME, '-tA', '-c', sql],
    { cwd: rootDir, encoding: 'utf8' },
  );
  if (result.status !== 0) {
    console.error(result.stderr);
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

function ensureDatabase(name) {
  if (!/^\w+$/.test(name)) throw new Error(`Invalid database name: ${name}`);
  if (psql(`SELECT 1 FROM pg_database WHERE datname = '${name}'`) !== '1') {
    psql(`CREATE DATABASE ${name}`);
    console.log(`[db] created database ${name}`);
  }
}

function databaseUp() {
  // --wait blocks until the healthcheck passes.
  run('docker', ['compose', 'up', '-d', '--wait', 'db']);
  ensureDatabase(env.DB_NAME);
  ensureDatabase(env.DB_NAME_TEST);
}

const turbo = (...args) => run('pnpm', ['exec', 'turbo', 'run', ...args]);

const [command, ...rest] = process.argv.slice(2);
switch (command) {
  case 'dev':
    databaseUp();
    // Turbo chain: build → db:migrate → db:seed → gen:client → api + web dev.
    turbo('dev', ...rest);
    break;
  case 'test':
    databaseUp();
    turbo('test', ...rest);
    break;
  case 'build':
    turbo('build', ...rest);
    break;
  case 'openapi':
    turbo('openapi', ...rest);
    break;
  case 'db-up':
    databaseUp();
    break;
  default:
    console.error(`Unknown command: ${command ?? '(none)'}`);
    process.exit(1);
}
