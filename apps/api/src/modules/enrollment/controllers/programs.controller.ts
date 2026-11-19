import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Roles } from '../../identity';
import { ApiProblemResponses } from '../../../shared/errors/api-problem-response.decorator';
import { CreateProgram } from '../application/create-program';
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

@ApiTags('enrollment')
@ApiBasicAuth()
@Roles('admin')
@Controller('programs')
export class ProgramsController {
  constructor(
    private readonly listPrograms: ListPrograms,
    private readonly createProgram: CreateProgram,
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
}
