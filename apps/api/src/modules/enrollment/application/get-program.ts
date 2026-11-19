import { Inject, Injectable } from '@nestjs/common';
import { PROFILE_DIRECTORY, type ProfileDirectory } from '../../identity';
import { ProgramNotFoundError } from '../domain/errors';
import { PROGRAM_REPOSITORY, type ProgramRepository } from './ports';

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
    @Inject(PROFILE_DIRECTORY) private readonly profiles: ProfileDirectory,
  ) {}

  async execute(id: string): Promise<ProgramDetail> {
    const program = await this.programs.findById(id);
    if (!program) throw new ProgramNotFoundError(id);
    const profiles = await this.profiles.findByIds(await this.programs.coachIds(id));
    const coaches = profiles
      .map(({ id: coachId, displayName }) => ({ id: coachId, displayName }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
    // shortcut: no student-to-program link exists until #8/#25, so students stay empty until then.
    return { ...program, coaches, students: [] };
  }
}
