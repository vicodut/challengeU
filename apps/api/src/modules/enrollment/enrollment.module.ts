import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity';
import { AssignCoach } from './application/assign-coach';
import { CreateProgram } from './application/create-program';
import { GetProgram } from './application/get-program';
import { ListPrograms } from './application/list-programs';
import { PROGRAM_REPOSITORY } from './application/ports';
import { ProgramsController } from './controllers/programs.controller';
import { DrizzleProgramRepository } from './infrastructure/drizzle-program.repository';

@Module({
  imports: [IdentityModule],
  controllers: [ProgramsController],
  providers: [
    AssignCoach,
    CreateProgram,
    GetProgram,
    ListPrograms,
    { provide: PROGRAM_REPOSITORY, useClass: DrizzleProgramRepository },
  ],
  exports: [CreateProgram, ListPrograms, AssignCoach],
})
export class EnrollmentModule {}
