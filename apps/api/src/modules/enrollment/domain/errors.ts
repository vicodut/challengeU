// Same structural contract as shared/errors/domain-error.ts (the domain may not import shared/).
abstract class EnrollmentError extends Error {
  constructor(
    readonly code: string,
    readonly kind: 'conflict' | 'unprocessable',
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ProgramNameTakenError extends EnrollmentError {
  constructor(name: string) {
    super('PROGRAM_NAME_TAKEN', 'conflict', `A program named "${name}" already exists`);
  }
}

export class InvalidProgramNameError extends EnrollmentError {
  constructor() {
    super('INVALID_PROGRAM_NAME', 'unprocessable', 'A program name is 1 to 100 characters');
  }
}
