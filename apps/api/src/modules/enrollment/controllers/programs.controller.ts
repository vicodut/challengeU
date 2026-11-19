import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsUUID, IsString, MaxLength, MinLength } from 'class-validator';
import { Roles } from '../../identity';
import { ApiProblemResponses } from '../../../shared/errors/api-problem-response.decorator';
import { AssignCoach } from '../application/assign-coach';
import { CreateProgram } from '../application/create-program';
import { GetProgram } from '../application/get-program';
import { ListPrograms } from '../application/list-programs';
import { MAX_PROGRAM_NAME_LENGTH } from '../domain/program';

export class ProgramResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Academic Success' })
  name!: string;
}

export class ProgramListResponse {
  @ApiProperty({ type: [ProgramResponse] })
  items!: ProgramResponse[];
}

export class CreateProgramRequest {
  @ApiProperty({ example: 'Academic Success', maxLength: MAX_PROGRAM_NAME_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_PROGRAM_NAME_LENGTH)
  name!: string;
}

export class ProgramMemberResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Coach A' })
  displayName!: string;
}

export class ProgramDetailResponse extends ProgramResponse {
  @ApiProperty({ type: [ProgramMemberResponse] })
  coaches!: ProgramMemberResponse[];

  @ApiProperty({ type: [ProgramMemberResponse] })
  students!: ProgramMemberResponse[];
}

export class AssignCoachRequest {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  coachId!: string;
}

const UUID_PIPE = new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY });

@ApiTags('enrollment')
@ApiBasicAuth()
@Roles('admin')
@Controller('programs')
export class ProgramsController {
  constructor(
    private readonly listPrograms: ListPrograms,
    private readonly createProgram: CreateProgram,
    private readonly getProgram: GetProgram,
    private readonly assignCoach: AssignCoach,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'listPrograms', summary: 'List programs (admin)' })
  @ApiOkResponse({ type: ProgramListResponse })
  @ApiProblemResponses(401, 403)
  async list(): Promise<ProgramListResponse> {
    return { items: await this.listPrograms.execute() };
  }

  @Post()
  @ApiOperation({ operationId: 'createProgram', summary: 'Create a program (admin)' })
  @ApiCreatedResponse({ type: ProgramResponse })
  @ApiProblemResponses(401, 403, 409, 422)
  create(@Body() body: CreateProgramRequest): Promise<ProgramResponse> {
    return this.createProgram.execute(body.name);
  }

  @Get(':id')
  @ApiOperation({
    operationId: 'getProgram',
    summary: 'A program with its coaches and students (admin)',
  })
  @ApiOkResponse({ type: ProgramDetailResponse })
  @ApiProblemResponses(401, 403, 404, 422)
  get(@Param('id', UUID_PIPE) id: string): Promise<ProgramDetailResponse> {
    return this.getProgram.execute(id);
  }

  @Post(':id/coaches')
  @HttpCode(204)
  @ApiOperation({
    operationId: 'assignCoach',
    summary: 'Assign a coach to a program (admin, idempotent)',
  })
  @ApiNoContentResponse({ description: 'The coach is assigned' })
  @ApiProblemResponses(401, 403, 404, 422)
  async assign(
    @Param('id', UUID_PIPE) id: string,
    @Body() body: AssignCoachRequest,
  ): Promise<void> {
    await this.assignCoach.execute(id, body.coachId);
  }
}
