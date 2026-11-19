import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../shared/clock/clock.port';
import { changeStatus, type EnrollmentStatus } from '../domain/enrollment';
import { StudentNotFoundError } from '../domain/errors';
import { ENROLLMENT_REPOSITORY, type EnrollmentRepository } from './ports';

@Injectable()
export class ChangeStudentStatus {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY) private readonly enrollments: EnrollmentRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(studentId: string, status: EnrollmentStatus): Promise<void> {
    const current = await this.enrollments.findByStudentId(studentId);
    if (!current) throw new StudentNotFoundError(studentId);
    const next = changeStatus(current, status, this.clock.now());
    if (next !== current) await this.enrollments.updateStatus(next);
  }
}
