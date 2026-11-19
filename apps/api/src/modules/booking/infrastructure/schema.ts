import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

// The non-overlap exclusion constraint (btree_gist) is in the hand-written migration 0002;
// drizzle-kit cannot express it. `coach_id` has no foreign key: it belongs to identity.
export const availabilityBlocks = pgTable('availability_blocks', {
  id: uuid('id').primaryKey(),
  coachId: uuid('coach_id').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
});
