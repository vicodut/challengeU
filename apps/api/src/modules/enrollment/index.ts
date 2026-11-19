// Public surface of the enrollment module: the only file other modules may import.
export { EnrollmentModule } from './enrollment.module';
export { CreateProgram } from './application/create-program';
export { ProgramNameTakenError } from './domain/errors';
export { ListPrograms } from './application/list-programs';
export { AssignCoach } from './application/assign-coach';
export { RegisterStudent } from './application/register-student';
export { ENROLLMENT_REPOSITORY } from './application/ports';
