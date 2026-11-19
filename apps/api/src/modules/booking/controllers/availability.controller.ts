import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsISO8601, IsInt, IsOptional, Matches } from 'class-validator';
import { ApiProblemResponses } from '../../../shared/errors/api-problem-response.decorator';
import { ApiPageResponse, PageQuery } from '../../../shared/pagination/cursor-page';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../identity';
import { PublishBlock } from '../application/publish-block';
import { GetBlock, ListBlocks } from '../application/read-blocks';
import { BLOCK_DURATIONS, type AvailabilityBlock } from '../domain/availability-block';

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

export class ListedBlockResponse extends BlockResponse {
  @ApiProperty({ minimum: 0, description: 'Sessions booked in this block' })
  bookedSessionCount!: number;
}

export class ListBlocksQuery extends PageQuery {
  @ApiPropertyOptional({ format: 'date-time', description: 'Defaults to now' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ format: 'date-time', description: 'Exclusive; no upper bound if unset' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

// Bookings arrive with the booking tickets; until then no block has a session.
const toListed = (block: AvailabilityBlock): ListedBlockResponse => ({
  id: block.id,
  startsAt: block.startsAt.toISOString(),
  durationMinutes: (block.endsAt.getTime() - block.startsAt.getTime()) / 60_000,
  bookedSessionCount: 0,
});

@ApiTags('booking')
@ApiBasicAuth()
@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly publishBlock: PublishBlock,
    private readonly listBlocks: ListBlocks,
    private readonly getBlock: GetBlock,
  ) {}

  @Get()
  @Roles('coach')
  @ApiOperation({ operationId: 'listBlocks', summary: "List the caller's availability blocks" })
  @ApiPageResponse(ListedBlockResponse)
  @ApiProblemResponses(401, 403, 422)
  async list(@CurrentUser() caller: AuthenticatedUser, @Query() query: ListBlocksQuery) {
    const page = await this.listBlocks.execute(caller.userId, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      limit: query.limit,
      cursor: query.cursor,
    });
    return { items: page.items.map(toListed), nextCursor: page.nextCursor };
  }

  @Get(':id')
  @Roles('coach')
  @ApiOperation({ operationId: 'getBlock', summary: "Open one of the caller's blocks" })
  @ApiOkResponse({ type: ListedBlockResponse })
  @ApiProblemResponses(401, 403, 404)
  async get(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND })) id: string,
  ): Promise<ListedBlockResponse> {
    return toListed(await this.getBlock.execute(caller.userId, id));
  }

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
