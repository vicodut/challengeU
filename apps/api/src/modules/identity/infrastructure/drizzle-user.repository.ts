import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import type { UserRepository } from '../application/ports';
import { UsernameTakenError } from '../domain/errors';
import type { Role } from '../domain/role';
import type { User } from '../domain/user';
import { DRIZZLE, type Database } from '../../../shared/db/database.module';
import { isUniqueViolation } from '../../../shared/db/pg-errors';
import { admins, coaches, students, users } from './schema';

const ROLE_TABLES = { student: students, coach: coaches, admin: admins } satisfies Record<
  Role,
  PgTable
>;

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id));
    return row ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.username, username));
    return row ?? null;
  }

  async add(user: User): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(users).values(user);
        await tx.insert(ROLE_TABLES[user.role]).values({ userId: user.id });
      });
    } catch (error) {
      // The unique index is the final guard when two creations race past the pre-check.
      if (isUniqueViolation(error)) throw new UsernameTakenError(user.username);
      throw error;
    }
  }
}
