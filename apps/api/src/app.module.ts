import { Module } from '@nestjs/common';
import { EnrollmentModule } from './modules/enrollment';
import { IdentityModule } from './modules/identity';
import { HealthModule } from './ops/health/health.module';
import { ClockModule } from './shared/clock/clock.module';
import { DatabaseModule } from './shared/db/database.module';
import { ProblemDetailsModule } from './shared/errors/problem-details.module';

@Module({
  imports: [
    ClockModule,
    DatabaseModule,
    ProblemDetailsModule,
    IdentityModule,
    EnrollmentModule,
    HealthModule,
  ],
})
export class AppModule {}
