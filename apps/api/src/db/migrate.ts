import { databaseUrl } from '../shared/config/config';
import { runMigrations } from './migrator';

runMigrations(databaseUrl())
  .then(() => {
    console.log('[db] migrations applied');
  })
  .catch((error: unknown) => {
    console.error('[db] migration failed', error);
    process.exit(1);
  });
