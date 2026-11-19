import { Module } from '@nestjs/common';
import { HealthModule } from './ops/health/health.module';
import { ClockModule } from './shared/clock/clock.module';
import { DatabaseModule } from './shared/db/database.module';

@Module({ imports: [ClockModule, DatabaseModule, HealthModule] })
export class AppModule {}
