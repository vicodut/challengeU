import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { Public } from '../../shared/auth/public.decorator';
import { Clock } from '../../shared/clock/clock';
import { DRIZZLE, type Database } from '../../shared/db/database.module';

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
    private readonly clock: Clock,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getHealth', summary: 'Health check (pings the database)' })
  @ApiOkResponse({ type: HealthResponse })
  @ApiServiceUnavailableResponse({ description: 'The database is unreachable' })
  async check(): Promise<HealthResponse> {
    try {
      await this.db.execute(sql`select 1`);
    } catch {
      throw new ServiceUnavailableException('Database unreachable');
    }
    return { status: 'ok', database: 'up', checkedAt: this.clock.now().toISOString() };
  }
}
