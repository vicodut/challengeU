import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const programs = pgTable('programs', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull().unique(),
});
