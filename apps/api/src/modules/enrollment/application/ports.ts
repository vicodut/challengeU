import type { Enrollment } from '../domain/enrollment';
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

export interface EnrollmentView extends Enrollment {
  programName: string;
}

export interface EnrollmentRepository {
  /** Throws `StudentAlreadyEnrolledError` (the primary key is the final guard). */
  add(enrollment: Enrollment): Promise<void>;
  findByStudentId(studentId: string): Promise<EnrollmentView | null>;
  list(): Promise<EnrollmentView[]>;
  updateStatus(enrollment: Enrollment): Promise<void>;
  studentIdsOf(programId: string): Promise<string[]>;
}

export const ENROLLMENT_REPOSITORY = Symbol('EnrollmentRepository');
export const PROGRAM_REPOSITORY = Symbol('ProgramRepository');
