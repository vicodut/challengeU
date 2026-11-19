import { pgEnum, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { ENROLLMENT_STATUSES } from '../domain/enrollment';

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

export const enrollmentStatus = pgEnum('enrollment_status', ENROLLMENT_STATUSES);

// `student_id` is an identity user id: referenced by ID only, no foreign key across modules.
// One enrollment per student, so the unique index is the final guard for "one program only".
export const enrollments = pgTable('enrollments', {
  studentId: uuid('student_id').primaryKey(),
  programId: uuid('program_id')
    .notNull()
    .references(() => programs.id),
  status: enrollmentStatus('status').notNull(),
  statusChangedAt: timestamp('status_changed_at', { withTimezone: true }).notNull(),
});
