import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import type { Profile, ProfileDirectory } from '../application/ports';
import { DRIZZLE, type Database } from '../../../shared/db/database.module';
import { users } from './schema';

const columns = {
  id: users.id,
  displayName: users.displayName,
  timeZone: users.timeZone,
  role: users.role,
};

@Injectable()
export class DrizzleProfileDirectory implements ProfileDirectory {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findByIds(ids: string[]): Promise<Profile[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.db.select(columns).from(users).where(inArray(users.id, ids));
  }

  listCoaches(): Promise<Profile[]> {
    return this.db
      .select(columns)
      .from(users)
      .where(eq(users.role, 'coach'))
      .orderBy(users.displayName);
  }
}
