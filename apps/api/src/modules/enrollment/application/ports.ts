import type { Program } from '../domain/program';

export interface ProgramRepository {
  findByName(name: string): Promise<Program | null>;
  findById(id: string): Promise<Program | null>;
  list(): Promise<Program[]>;
  coachIds(programId: string): Promise<string[]>;
  /** Idempotent: assigning an already-assigned coach changes nothing. */
  addCoach(programId: string, coachId: string): Promise<void>;
  /** Throws `ProgramNameTakenError` when the name exists (the unique index is the final guard). */
  add(program: Program): Promise<void>;
}

export const PROGRAM_REPOSITORY = Symbol('ProgramRepository');
