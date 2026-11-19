import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../shared/clock/clock.port';
import { createBlock, type AvailabilityBlock } from '../domain/availability-block';
import { BlockOverlapError } from '../domain/errors';
import { BLOCK_REPOSITORY, type BlockRepository } from './ports';

@Injectable()
export class PublishBlock {
  constructor(
    @Inject(BLOCK_REPOSITORY) private readonly blocks: BlockRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(
    coachId: string,
    input: { startsAt: Date; durationMinutes: number },
  ): Promise<AvailabilityBlock> {
    const block = createBlock({ id: randomUUID(), coachId, ...input }, this.clock.now());
    if (await this.blocks.overlaps(coachId, block.startsAt, block.endsAt)) {
      throw new BlockOverlapError();
    }
    // Racing publishes pass the check above; the exclusion constraint decides in `add`.
    await this.blocks.add(block);
    return block;
  }
}
