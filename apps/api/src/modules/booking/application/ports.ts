import type { AvailabilityBlock } from '../domain/availability-block';

export interface BlockListFilter {
  from: Date;
  to?: Date;
  limit: number;
  cursor?: { at: Date; id: string };
}

export interface BlockRepository {
  /** The coach's blocks starting in [from, to), by start then id, up to `limit` rows. */
  list(coachId: string, filter: BlockListFilter): Promise<AvailabilityBlock[]>;
  /** The block when it belongs to the coach, else null. */
  findOwned(id: string, coachId: string): Promise<AvailabilityBlock | null>;
  overlaps(coachId: string, startsAt: Date, endsAt: Date): Promise<boolean>;
  /** Plain delete of the coach's block; false when it does not exist or is not theirs. */
  remove(id: string, coachId: string): Promise<boolean>;
  /** Throws `BlockOverlapError` when the database's exclusion constraint rejects the block. */
  add(block: AvailabilityBlock): Promise<void>;
}

/** Delete the coach's block; false when it does not exist or is not theirs. */
export const BLOCK_REPOSITORY = Symbol('BlockRepository');

export interface ActiveBookingCounter {
  /** Active (not cancelled) bookings inside the block. */
  countForBlock(blockId: string): Promise<number>;
}

export const ACTIVE_BOOKING_COUNTER = Symbol('ActiveBookingCounter');
