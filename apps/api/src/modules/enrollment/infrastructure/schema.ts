import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';

export const programs = pgTable('programs', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull().unique(),
});

// `coach_id` is an identity user id: referenced by ID only, no foreign key across modules.
export const programCoaches = pgTable(
  'program_coaches',
  {
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id),
    coachId: uuid('coach_id').notNull(),
  },
  (table) => [primaryKey({ columns: [table.programId, table.coachId] })],
);
