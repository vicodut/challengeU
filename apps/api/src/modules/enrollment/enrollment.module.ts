import { Module } from '@nestjs/common';
import { CreateProgram } from './application/create-program';
import { ListPrograms } from './application/list-programs';
import { PROGRAM_REPOSITORY } from './application/ports';
import { ProgramsController } from './controllers/programs.controller';
import { DrizzleProgramRepository } from './infrastructure/drizzle-program.repository';

@Module({
  controllers: [ProgramsController],
  providers: [
    CreateProgram,
    ListPrograms,
    { provide: PROGRAM_REPOSITORY, useClass: DrizzleProgramRepository },
  ],
  exports: [CreateProgram],
})
export class EnrollmentModule {}
