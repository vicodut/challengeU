import { Inject, Injectable } from '@nestjs/common';
import { PROFILE_DIRECTORY, type ProfileDirectory } from '../../identity';
import { ProgramNotFoundError } from '../domain/errors';
import {
  ENROLLMENT_REPOSITORY,
  PROGRAM_REPOSITORY,
  type EnrollmentRepository,
  type ProgramRepository,
} from './ports';

export interface ProgramMember {
  id: string;
  displayName: string;
}

export interface ProgramDetail {
  id: string;
  name: string;
  coaches: ProgramMember[];
  students: ProgramMember[];
}

@Injectable()
export class GetProgram {
  constructor(
    @Inject(PROGRAM_REPOSITORY) private readonly programs: ProgramRepository,
    @Inject(ENROLLMENT_REPOSITORY) private readonly enrollments: EnrollmentRepository,
    @Inject(PROFILE_DIRECTORY) private readonly profiles: ProfileDirectory,
  ) {}

  async execute(id: string): Promise<ProgramDetail> {
    const program = await this.programs.findById(id);
    if (!program) throw new ProgramNotFoundError(id);
    const members = async (ids: string[]) =>
      (await this.profiles.findByIds(ids))
        .map(({ id: memberId, displayName }) => ({ id: memberId, displayName }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
    const [coaches, students] = await Promise.all([
      this.programs.coachIds(id).then(members),
      this.enrollments.studentIdsOf(id).then(members),
    ]);
    return { ...program, coaches, students };
  }
}
