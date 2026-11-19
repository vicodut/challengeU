import type { AvailabilityBlock } from '../domain/availability-block';

export interface BlockRepository {
  overlaps(coachId: string, startsAt: Date, endsAt: Date): Promise<boolean>;
  /** Throws `BlockOverlapError` when the database's exclusion constraint rejects the block. */
  add(block: AvailabilityBlock): Promise<void>;
}

export const BLOCK_REPOSITORY = Symbol('BlockRepository');
