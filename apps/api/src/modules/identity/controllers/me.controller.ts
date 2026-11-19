import { Controller, Get } from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { ApiProblemResponses } from '../../../shared/errors/api-problem-response.decorator';
import type { AuthenticatedUser } from '../application/authenticated-user';
import { GetCurrentUser } from '../application/get-current-user';
import { ROLES, type Role } from '../domain/role';
import { CurrentUser } from './current-user.decorator';

const ENROLLMENT_STATUS_VALUES = ['active', 'suspended'];

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

  @ApiPropertyOptional({
    enum: ENROLLMENT_STATUS_VALUES,
    description: 'Enrollment status; present for students only',
  })
  studentStatus?: 'active' | 'suspended';
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
