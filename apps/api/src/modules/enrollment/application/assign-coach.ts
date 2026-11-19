import { Inject, Injectable } from '@nestjs/common';
import { PROFILE_DIRECTORY, type ProfileDirectory } from '../../identity';
import { CoachNotFoundError, ProgramNotFoundError } from '../domain/errors';
import { PROGRAM_REPOSITORY, type ProgramRepository } from './ports';

@Injectable()
export class AssignCoach {
  constructor(
    @Inject(PROGRAM_REPOSITORY) private readonly programs: ProgramRepository,
    @Inject(PROFILE_DIRECTORY) private readonly profiles: ProfileDirectory,
  ) {}

  async execute(programId: string, coachId: string): Promise<void> {
    if (!(await this.programs.findById(programId))) throw new ProgramNotFoundError(programId);
    const [profile] = await this.profiles.findByIds([coachId]);
    if (profile?.role !== 'coach') throw new CoachNotFoundError(coachId);
    await this.programs.addCoach(programId, coachId);
  }
}
