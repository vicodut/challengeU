import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ProgramNameTakenError } from '../domain/errors';
import { createProgram, type Program } from '../domain/program';
import { PROGRAM_REPOSITORY, type ProgramRepository } from './ports';

@Injectable()
export class CreateProgram {
  constructor(@Inject(PROGRAM_REPOSITORY) private readonly programs: ProgramRepository) {}

  async execute(name: string): Promise<Program> {
    const program = createProgram(randomUUID(), name);
    if (await this.programs.findByName(program.name)) throw new ProgramNameTakenError(program.name);
    await this.programs.add(program);
    return program;
  }
}
