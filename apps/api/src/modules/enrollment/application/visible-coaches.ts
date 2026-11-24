import { Inject, Injectable } from '@nestjs/common';
import {
  PROFILE_DIRECTORY,
  type AuthenticatedUser,
  type Profile,
  type ProfileDirectory,
} from '../../identity';
import { CoachNotVisibleError } from '../domain/errors';
import {
  ENROLLMENT_REPOSITORY,
  PROGRAM_REPOSITORY,
  type EnrollmentRepository,
  type ProgramRepository,
} from './ports';

/** The coaches a caller may see: everyone for an admin, only the own program's for a student. */
@Injectable()
export class VisibleCoaches {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY) private readonly enrollments: EnrollmentRepository,
    @Inject(PROGRAM_REPOSITORY) private readonly programs: ProgramRepository,
    @Inject(PROFILE_DIRECTORY) private readonly profiles: ProfileDirectory,
  ) {}

  async list(user: AuthenticatedUser): Promise<Profile[]> {
    if (user.role === 'admin') return this.profiles.listCoaches();
    const enrollment = await this.enrollments.findByStudentId(user.userId);
    const ids = enrollment ? await this.programs.coachIds(enrollment.programId) : [];
    return (await this.profiles.findByIds(ids)).sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    );
  }

  async get(user: AuthenticatedUser, id: string): Promise<Profile> {
    const coach = (await this.list(user)).find((profile) => profile.id === id);
    if (!coach) throw new CoachNotVisibleError(id);
    return coach;
  }
}
