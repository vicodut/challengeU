import { Inject, Injectable } from '@nestjs/common';
import { CreateAccount, DeleteAccount } from '../../identity';
import { CLOCK, type Clock } from '../../../shared/clock/clock.port';
import { enroll } from '../domain/enrollment';
import { ProgramNotFoundError } from '../domain/errors';
import {
  ENROLLMENT_REPOSITORY,
  PROGRAM_REPOSITORY,
  type EnrollmentRepository,
  type ProgramRepository,
} from './ports';

export interface RegisterStudentInput {
  username: string;
  password: string;
  displayName: string;
  timeZone: string;
  programId: string;
}

@Injectable()
export class RegisterStudent {
  constructor(
    @Inject(PROGRAM_REPOSITORY) private readonly programs: ProgramRepository,
    @Inject(ENROLLMENT_REPOSITORY) private readonly enrollments: EnrollmentRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly createAccount: CreateAccount,
    private readonly deleteAccount: DeleteAccount,
  ) {}

  /** Creates the student's account and active enrollment; returns the student id. */
  async execute({ programId, ...account }: RegisterStudentInput): Promise<string> {
    if (!(await this.programs.findById(programId))) throw new ProgramNotFoundError(programId);
    const studentId = await this.createAccount.execute({ ...account, role: 'student' });
    try {
      await this.enrollments.add(enroll(studentId, programId, this.clock.now()));
    } catch (error) {
      // Compensate: the two modules do not share a transaction, so leave no account behind.
      await this.deleteAccount.execute(studentId);
      throw error;
    }
    return studentId;
  }
}
