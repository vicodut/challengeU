import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../shared/clock/clock.port';
import { decodeCursor, toPage, type Page } from '../../../shared/pagination/cursor-page';
import type { AvailabilityBlock } from '../domain/availability-block';
import { BlockNotFoundError } from '../domain/errors';
import { BLOCK_REPOSITORY, type BlockRepository } from './ports';

@Injectable()
export class ListBlocks {
  constructor(
    @Inject(BLOCK_REPOSITORY) private readonly blocks: BlockRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(
    coachId: string,
    query: { from?: Date; to?: Date; limit: number; cursor?: string },
  ): Promise<Page<AvailabilityBlock>> {
    const rows = await this.blocks.list(coachId, {
      from: query.from ?? this.clock.now(),
      to: query.to,
      limit: query.limit,
      cursor: query.cursor ? decodeCursor(query.cursor) : undefined,
    });
    return toPage(rows, query.limit, (block) => ({ at: block.startsAt, id: block.id }));
  }
}

@Injectable()
export class GetBlock {
  constructor(@Inject(BLOCK_REPOSITORY) private readonly blocks: BlockRepository) {}

  /** Another coach's block is indistinguishable from a missing one. */
  async execute(coachId: string, id: string): Promise<AvailabilityBlock> {
    const block = await this.blocks.findOwned(id, coachId);
    if (!block) throw new BlockNotFoundError();
    return block;
  }
}
