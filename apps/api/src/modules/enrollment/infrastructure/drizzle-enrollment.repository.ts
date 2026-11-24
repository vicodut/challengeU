import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { EnrollmentRepository, EnrollmentView } from '../application/ports';
import type { Enrollment } from '../domain/enrollment';
import { StudentAlreadyEnrolledError } from '../domain/errors';
import { DRIZZLE, type Database } from '../../../shared/db/database.module';
import { isUniqueViolation } from '../../../shared/db/pg-errors';
import { enrollments, programs } from './schema';

const view = {
  studentId: enrollments.studentId,
  programId: enrollments.programId,
  programName: programs.name,
  status: enrollments.status,
  statusChangedAt: enrollments.statusChangedAt,
};

@Injectable()
export class DrizzleEnrollmentRepository implements EnrollmentRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async add(enrollment: Enrollment): Promise<void> {
    try {
      await this.db.insert(enrollments).values(enrollment);
    } catch (error) {
      if (isUniqueViolation(error)) throw new StudentAlreadyEnrolledError(enrollment.studentId);
      throw error;
    }
  }

  async findByStudentId(studentId: string): Promise<EnrollmentView | null> {
    const [row] = await this.db
      .select(view)
      .from(enrollments)
      .innerJoin(programs, eq(programs.id, enrollments.programId))
      .where(eq(enrollments.studentId, studentId));
    return row ?? null;
  }

  async updateStatus({ studentId, status, statusChangedAt }: Enrollment): Promise<void> {
    await this.db
      .update(enrollments)
      .set({ status, statusChangedAt })
      .where(eq(enrollments.studentId, studentId));
  }

  list(): Promise<EnrollmentView[]> {
    return this.db
      .select(view)
      .from(enrollments)
      .innerJoin(programs, eq(programs.id, enrollments.programId));
  }

  async studentIdsOf(programId: string): Promise<string[]> {
    const rows = await this.db
      .select({ studentId: enrollments.studentId })
      .from(enrollments)
      .where(eq(enrollments.programId, programId));
    return rows.map((row) => row.studentId);
  }
}
