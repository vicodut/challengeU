// Same structural contract as shared/errors/domain-error.ts (the domain may not import shared/).
abstract class EnrollmentError extends Error {
  constructor(
    readonly code: string,
    readonly kind: 'conflict' | 'unprocessable' | 'not_found',
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

export class ProgramNotFoundError extends EnrollmentError {
  constructor(id: string) {
    super('PROGRAM_NOT_FOUND', 'not_found', `Program ${id} does not exist`);
  }
}

export class CoachNotFoundError extends EnrollmentError {
  constructor(id: string) {
    super('COACH_NOT_FOUND', 'unprocessable', `${id} is not a coach`);
  }
}

export class StudentAlreadyEnrolledError extends EnrollmentError {
  constructor(id: string) {
    super('STUDENT_ALREADY_ENROLLED', 'conflict', `Student ${id} is already enrolled in a program`);
  }
}

export class StudentNotFoundError extends EnrollmentError {
  constructor(id: string) {
    super('STUDENT_NOT_FOUND', 'not_found', `Student ${id} is not enrolled`);
  }
}

export class CoachNotVisibleError extends EnrollmentError {
  constructor(id: string) {
    super('COACH_NOT_VISIBLE', 'not_found', `Coach ${id} does not exist or is not in your program`);
  }
}
