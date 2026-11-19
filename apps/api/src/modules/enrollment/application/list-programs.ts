import { Inject, Injectable } from '@nestjs/common';
import type { Program } from '../domain/program';
import { PROGRAM_REPOSITORY, type ProgramRepository } from './ports';

@Injectable()
export class ListPrograms {
  constructor(@Inject(PROGRAM_REPOSITORY) private readonly programs: ProgramRepository) {}

  execute(): Promise<Program[]> {
    return this.programs.list();
  }
}
