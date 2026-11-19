import { Inject, Injectable } from '@nestjs/common';
import { bookingEligibility, type BookingEligibility } from '../domain/enrollment';
import {
  ENROLLMENT_REPOSITORY,
  PROGRAM_REPOSITORY,
  type EnrollmentRepository,
  type ProgramRepository,
} from './ports';

/** The port the booking module uses: may student X book coach Y? */
@Injectable()
export class CheckBookingEligibility {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY) private readonly enrollments: EnrollmentRepository,
    @Inject(PROGRAM_REPOSITORY) private readonly programs: ProgramRepository,
  ) {}

  async execute(studentId: string, coachId: string): Promise<BookingEligibility> {
    const enrollment = await this.enrollments.findByStudentId(studentId);
    const coachIds = enrollment ? await this.programs.coachIds(enrollment.programId) : [];
    return bookingEligibility(enrollment, coachIds, coachId);
  }
}
