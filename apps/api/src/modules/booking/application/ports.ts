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
  /** Throws `BlockOverlapError` when the database's exclusion constraint rejects the block. */
  add(block: AvailabilityBlock): Promise<void>;
}

export const BLOCK_REPOSITORY = Symbol('BlockRepository');
