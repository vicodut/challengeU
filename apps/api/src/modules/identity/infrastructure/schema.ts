import { pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { ROLES } from '../domain/role';

export const userRole = pgEnum('user_role', ROLES);

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  /** IANA time zone name. */
  timeZone: text('time_zone').notNull(),
  role: userRole('role').notNull(),
});

// One-to-one per-role tables keyed by the user id (later tickets add role-specific columns).
const roleTable = (name: string) =>
  pgTable(name, {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id),
  });

export const students = roleTable('students');
export const coaches = roleTable('coaches');
export const admins = roleTable('admins');
