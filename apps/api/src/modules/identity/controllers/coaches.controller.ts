import { Controller, Get, Inject } from '@nestjs/common';
import { ApiBasicAuth, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { ApiProblemResponses } from '../../../shared/errors/api-problem-response.decorator';
import { PROFILE_DIRECTORY, type ProfileDirectory } from '../application/ports';
import { Roles } from './roles.decorator';

export class CoachResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Coach A' })
  displayName!: string;

  @ApiProperty({ example: 'America/Toronto', description: 'IANA time zone' })
  timeZone!: string;
}

export class CoachListResponse {
  @ApiProperty({ type: [CoachResponse] })
  items!: CoachResponse[];
}

// Tagged `enrollment` so the web enrollment feature's own generated client module carries it.
@ApiTags('enrollment')
@ApiBasicAuth()
@Roles('admin')
@Controller('coaches')
export class CoachesController {
  constructor(@Inject(PROFILE_DIRECTORY) private readonly profiles: ProfileDirectory) {}

  @Get()
  @ApiOperation({ operationId: 'listCoaches', summary: 'List all coaches (admin)' })
  @ApiOkResponse({ type: CoachListResponse })
  @ApiProblemResponses(401, 403)
  async list(): Promise<CoachListResponse> {
    const coaches = await this.profiles.listCoaches();
    return {
      items: coaches.map(({ id, displayName, timeZone }) => ({ id, displayName, timeZone })),
    };
  }
}
