import { Inject, Injectable } from '@nestjs/common';
import { assertBlockEmpty } from '../domain/availability-block';
import { BlockNotFoundError } from '../domain/errors';
import {
  ACTIVE_BOOKING_COUNTER,
  BLOCK_REPOSITORY,
  type ActiveBookingCounter,
  type BlockRepository,
} from './ports';

@Injectable()
export class DeleteBlock {
  constructor(
    @Inject(BLOCK_REPOSITORY) private readonly blocks: BlockRepository,
    @Inject(ACTIVE_BOOKING_COUNTER) private readonly bookings: ActiveBookingCounter,
  ) {}

  /** Another coach's block is indistinguishable from a missing one. */
  async execute(coachId: string, id: string): Promise<{ cancelledSessionCount: number }> {
    if (!(await this.blocks.findOwned(id, coachId))) throw new BlockNotFoundError();
    assertBlockEmpty(await this.bookings.countForBlock(id));
    if (!(await this.blocks.remove(id, coachId))) throw new BlockNotFoundError();
    return { cancelledSessionCount: 0 };
  }
}
