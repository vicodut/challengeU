import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsInt, Matches } from 'class-validator';
import { ApiProblemResponses } from '../../../shared/errors/api-problem-response.decorator';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../identity';
import { PublishBlock } from '../application/publish-block';
import { BLOCK_DURATIONS } from '../domain/availability-block';

// An ISO 8601 instant in UTC (trailing Z); anything else is a validation error.
const UTC_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?Z$/;

export class PublishBlockRequest {
  @ApiProperty({ example: '2030-01-07T14:00:00.000Z', description: 'UTC instant, on :00 or :30' })
  @Matches(UTC_INSTANT, { message: 'startsAt must be an ISO 8601 instant in UTC (ending in Z)' })
  startsAt!: string;

  @ApiProperty({ enum: BLOCK_DURATIONS, description: 'Block length in minutes' })
  @IsInt()
  durationMinutes!: number;
}

export class BlockResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'date-time' })
  startsAt!: string;

  @ApiProperty({ enum: BLOCK_DURATIONS })
  durationMinutes!: number;
}

@ApiTags('booking')
@ApiBasicAuth()
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly publishBlock: PublishBlock) {}

  @Post()
  @Roles('coach')
  @ApiOperation({ operationId: 'publishBlock', summary: 'A coach publishes an availability block' })
  @ApiCreatedResponse({ type: BlockResponse })
  @ApiProblemResponses(401, 403, 409, 422)
  async publish(
    @CurrentUser() caller: AuthenticatedUser,
    @Body() body: PublishBlockRequest,
  ): Promise<BlockResponse> {
    const block = await this.publishBlock.execute(caller.userId, {
      startsAt: new Date(body.startsAt),
      durationMinutes: body.durationMinutes,
    });
    return {
      id: block.id,
      startsAt: block.startsAt.toISOString(),
      durationMinutes: body.durationMinutes,
    };
  }
}
