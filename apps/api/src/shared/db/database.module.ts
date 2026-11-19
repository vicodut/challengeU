import { Global, Inject, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { databaseUrl } from '../config/config';
import { createPool } from './pool';

export const PG_POOL = Symbol('PG_POOL');
export const DRIZZLE = Symbol('DRIZZLE');

// Each module owns its tables and queries them through the query builder.
export type Database = NodePgDatabase;

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      // The pool connects lazily, so booting the app (e.g. to dump OpenAPI) needs no database.
      useFactory: (): Pool => {
        const pool = createPool(databaseUrl());
        pool.on('error', (error) => {
          new Logger('Database').error(`Idle client error: ${error.message}`);
        });
        return pool;
      },
    },
    {
      provide: DRIZZLE,
      inject: [PG_POOL],
      useFactory: (pool: Pool): Database => drizzle(pool),
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
