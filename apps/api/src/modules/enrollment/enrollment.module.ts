import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity';
import { AssignCoach } from './application/assign-coach';
import { CreateProgram } from './application/create-program';
import { GetProgram } from './application/get-program';
import { ListPrograms } from './application/list-programs';
import { GetStudent } from './application/get-student';
import { ListStudents } from './application/list-students';
import { ENROLLMENT_REPOSITORY, PROGRAM_REPOSITORY } from './application/ports';
import { RegisterStudent } from './application/register-student';
import { UpdateStudent } from './application/update-student';
import { ProgramsController } from './controllers/programs.controller';
import { StudentsController } from './controllers/students.controller';
import { DrizzleEnrollmentRepository } from './infrastructure/drizzle-enrollment.repository';
import { DrizzleProgramRepository } from './infrastructure/drizzle-program.repository';

@Module({
  imports: [IdentityModule],
  controllers: [ProgramsController, StudentsController],
  providers: [
    AssignCoach,
    CreateProgram,
    GetProgram,
    GetStudent,
    ListPrograms,
    ListStudents,
    RegisterStudent,
    UpdateStudent,
    { provide: PROGRAM_REPOSITORY, useClass: DrizzleProgramRepository },
    { provide: ENROLLMENT_REPOSITORY, useClass: DrizzleEnrollmentRepository },
  ],
  exports: [CreateProgram, ListPrograms, AssignCoach, RegisterStudent],
})
export class EnrollmentModule {}
