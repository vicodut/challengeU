import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { Public } from '../../shared/auth/public.decorator';
import { CLOCK, type Clock } from '../../shared/clock/clock.port';
import { DRIZZLE, type Database } from '../../shared/db/database.module';
import { ApiProblemResponses } from '../../shared/errors/api-problem-response.decorator';
import { DatabaseUnavailableError } from './database-unavailable.error';

export class HealthResponse {
  @ApiProperty({ enum: ['ok'] })
  status!: 'ok';

  @ApiProperty({ enum: ['up'] })
  database!: 'up';

  @ApiProperty({ format: 'date-time', description: 'Server time (from the Clock port)' })
  checkedAt!: string;
}

@ApiTags('ops')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getHealth', summary: 'Health check (pings the database)' })
  @ApiOkResponse({ type: HealthResponse })
  @ApiProblemResponses(503)
  async check(): Promise<HealthResponse> {
    try {
      await this.db.execute(sql`select 1`);
    } catch {
      throw new DatabaseUnavailableError();
    }
    return { status: 'ok', database: 'up', checkedAt: this.clock.now().toISOString() };
  }
}
