import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Roles } from '../../identity';
import { ApiProblemResponses } from '../../../shared/errors/api-problem-response.decorator';
import { GetStudent, type StudentView } from '../application/get-student';
import { ListStudents } from '../application/list-students';
import { RegisterStudent } from '../application/register-student';
import { UpdateStudent } from '../application/update-student';
import { ENROLLMENT_STATUSES, type EnrollmentStatus } from '../domain/enrollment';

export class RegisterStudentRequest {
  @ApiProperty({ example: 'studentC' })
  @IsString()
  @MinLength(1)
  username!: string;

  @ApiProperty({ example: 'studentC$123' })
  @IsString()
  @MinLength(1)
  password!: string;

  @ApiProperty({ example: 'Student C' })
  @IsString()
  @MinLength(1)
  displayName!: string;

  @ApiProperty({ example: 'America/Toronto', description: 'IANA time zone' })
  @IsString()
  timeZone!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  programId!: string;
}

export class UpdateStudentRequest {
  @ApiPropertyOptional({ format: 'uuid', description: 'Move the student to this program' })
  @IsOptional()
  @IsUUID()
  programId?: string;

  @ApiPropertyOptional({ enum: ENROLLMENT_STATUSES })
  @IsOptional()
  @IsIn(ENROLLMENT_STATUSES)
  status?: EnrollmentStatus;
}

export class RegisteredStudentResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

export class StudentResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Student A' })
  displayName!: string;

  @ApiProperty({ example: 'America/Vancouver', description: 'IANA time zone' })
  timeZone!: string;

  @ApiProperty({ format: 'uuid' })
  programId!: string;

  @ApiProperty({ example: 'Academic Success' })
  programName!: string;

  @ApiProperty({ enum: ENROLLMENT_STATUSES })
  status!: EnrollmentStatus;

  @ApiProperty({ format: 'date-time' })
  statusChangedAt!: string;
}

export class StudentListResponse {
  @ApiProperty({ type: [StudentResponse] })
  items!: StudentResponse[];
}

const toResponse = ({ studentId, statusChangedAt, ...rest }: StudentView): StudentResponse => ({
  ...rest,
  id: studentId,
  statusChangedAt: statusChangedAt.toISOString(),
});

const UUID_PIPE = new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY });

@ApiTags('enrollment')
@ApiBasicAuth()
@Roles('admin')
@Controller('students')
export class StudentsController {
  constructor(
    private readonly registerStudent: RegisterStudent,
    private readonly listStudents: ListStudents,
    private readonly getStudent: GetStudent,
    private readonly updateStudent: UpdateStudent,
  ) {}

  @Post()
  @ApiOperation({
    operationId: 'registerStudent',
    summary: 'Register a student account and enroll it in a program (admin)',
  })
  @ApiCreatedResponse({ type: RegisteredStudentResponse })
  @ApiProblemResponses(401, 403, 404, 409, 422)
  async register(@Body() body: RegisterStudentRequest): Promise<RegisteredStudentResponse> {
    return { id: await this.registerStudent.execute(body) };
  }

  @Get()
  @ApiOperation({ operationId: 'listStudents', summary: 'List enrolled students (admin)' })
  @ApiOkResponse({ type: StudentListResponse })
  @ApiProblemResponses(401, 403)
  async list(): Promise<StudentListResponse> {
    return { items: (await this.listStudents.execute()).map(toResponse) };
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getStudent', summary: 'One enrolled student (admin)' })
  @ApiOkResponse({ type: StudentResponse })
  @ApiProblemResponses(401, 403, 404, 422)
  async get(@Param('id', UUID_PIPE) id: string): Promise<StudentResponse> {
    return toResponse(await this.getStudent.execute(id));
  }

  @Patch(':id')
  @ApiOperation({
    operationId: 'updateStudent',
    summary: "Move a student to another program and/or change the student's status (admin)",
  })
  @ApiOkResponse({ type: StudentResponse })
  @ApiProblemResponses(401, 403, 404, 422)
  async update(
    @Param('id', UUID_PIPE) id: string,
    @Body() body: UpdateStudentRequest,
  ): Promise<StudentResponse> {
    return toResponse(await this.updateStudent.execute(id, body));
  }
}
