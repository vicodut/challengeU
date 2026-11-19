import { Controller, Get } from '@nestjs/common';
import { ApiBasicAuth, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { ApiProblemResponses } from '../../../shared/errors/api-problem-response.decorator';
import type { AuthenticatedUser } from '../application/authenticated-user';
import { GetCurrentUser } from '../application/get-current-user';
import { ROLES, type Role } from '../domain/role';
import { CurrentUser } from './current-user.decorator';

export class MeResponse {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ enum: ROLES })
  role!: Role;

  @ApiProperty({ example: 'America/Toronto', description: 'IANA time zone' })
  timeZone!: string;
}

@ApiTags('identity')
@ApiBasicAuth()
@Controller('me')
export class MeController {
  constructor(private readonly getCurrentUser: GetCurrentUser) {}

  @Get()
  @ApiOperation({ operationId: 'getMe', summary: "The authenticated caller's own profile" })
  @ApiOkResponse({ type: MeResponse })
  @ApiProblemResponses(401)
  me(@CurrentUser() caller: AuthenticatedUser): Promise<MeResponse> {
    return this.getCurrentUser.execute(caller.userId);
  }
}
