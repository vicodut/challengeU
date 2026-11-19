import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FieldError } from './validation-failed.error';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

export class FieldErrorDto implements FieldError {
  @ApiProperty({ example: 'displayName' })
  field!: string;

  @ApiProperty({ type: [String] })
  messages!: string[];
}

/** RFC 9457 Problem Details, plus the stable `code` and, for validation errors, `errors`. */
export class ProblemDetails {
  @ApiProperty({ example: 'urn:challengeu:problem:invalid-credentials' })
  type!: string;

  @ApiProperty({ example: 'Unauthorized' })
  title!: string;

  @ApiProperty({ example: 401 })
  status!: number;

  @ApiProperty({ description: 'Stable machine-readable code', example: 'INVALID_CREDENTIALS' })
  code!: string;

  @ApiProperty({ example: 'Missing or invalid credentials' })
  detail!: string;

  @ApiPropertyOptional({ type: [FieldErrorDto], description: 'Present on validation errors' })
  errors?: FieldErrorDto[];
}
