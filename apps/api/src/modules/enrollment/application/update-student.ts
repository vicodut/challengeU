import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../shared/clock/clock.port';
import { change, type EnrollmentChange } from '../domain/enrollment';
import { ProgramNotFoundError, StudentNotFoundError } from '../domain/errors';
import { GetStudent, type StudentView } from './get-student';
import {
  ENROLLMENT_REPOSITORY,
  PROGRAM_REPOSITORY,
  type EnrollmentRepository,
  type ProgramRepository,
} from './ports';

@Injectable()
export class UpdateStudent {
  constructor(
    @Inject(PROGRAM_REPOSITORY) private readonly programs: ProgramRepository,
    @Inject(ENROLLMENT_REPOSITORY) private readonly enrollments: EnrollmentRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly getStudent: GetStudent,
  ) {}

  /** Existing sessions are untouched: only the enrollment row changes. */
  async execute(studentId: string, update: EnrollmentChange): Promise<StudentView> {
    const current = await this.enrollments.findByStudentId(studentId);
    if (!current) throw new StudentNotFoundError(studentId);
    const next = change(current, update, this.clock.now());
    if (update.programId && !(await this.programs.findById(update.programId))) {
      throw new ProgramNotFoundError(update.programId);
    }
    await this.enrollments.update(next);
    return this.getStudent.execute(studentId);
  }
}
