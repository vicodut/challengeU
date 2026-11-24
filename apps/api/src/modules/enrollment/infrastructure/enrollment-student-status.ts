import { Inject, Injectable } from '@nestjs/common';
import type { StudentStatusLookup } from '../../identity';
import { ENROLLMENT_REPOSITORY, type EnrollmentRepository } from '../application/ports';

@Injectable()
export class EnrollmentStudentStatus implements StudentStatusLookup {
  constructor(@Inject(ENROLLMENT_REPOSITORY) private readonly enrollments: EnrollmentRepository) {}

  async statusOf(studentId: string) {
    return (await this.enrollments.findByStudentId(studentId))?.status ?? null;
  }
}
