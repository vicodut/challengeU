import { Controller, Get, HttpStatus, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBasicAuth, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../identity';
import { ApiProblemResponses } from '../../../shared/errors/api-problem-response.decorator';
import { VisibleCoaches } from '../application/visible-coaches';

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

const toResponse = ({ id, displayName, timeZone }: CoachResponse): CoachResponse => ({
  id,
  displayName,
  timeZone,
});

const UUID_PIPE = new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY });

@ApiTags('enrollment')
@ApiBasicAuth()
@Roles('admin', 'student')
@Controller('coaches')
export class CoachesController {
  constructor(private readonly coaches: VisibleCoaches) {}

  @Get()
  @ApiOperation({
    operationId: 'listCoaches',
    summary: 'List coaches: all for an admin, the own program coaches for a student',
  })
  @ApiOkResponse({ type: CoachListResponse })
  @ApiProblemResponses(401, 403)
  async list(@CurrentUser() user: AuthenticatedUser): Promise<CoachListResponse> {
    return { items: (await this.coaches.list(user)).map(toResponse) };
  }

  @Get(':id')
  @ApiOperation({
    operationId: 'getCoach',
    summary: 'One coach; 404 for a student when the coach is outside their program',
  })
  @ApiOkResponse({ type: CoachResponse })
  @ApiProblemResponses(401, 403, 404, 422)
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', UUID_PIPE) id: string,
  ): Promise<CoachResponse> {
    return toResponse(await this.coaches.get(user, id));
  }
}
