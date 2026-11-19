import type { Program } from '../domain/program';

export interface ProgramRepository {
  findByName(name: string): Promise<Program | null>;
  list(): Promise<Program[]>;
  /** Throws `ProgramNameTakenError` when the name exists (the unique index is the final guard). */
  add(program: Program): Promise<void>;
}

export const PROGRAM_REPOSITORY = Symbol('ProgramRepository');
