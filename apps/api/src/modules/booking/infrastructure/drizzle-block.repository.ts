import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gt, gte, lt, or } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../../shared/db/database.module';
import { isExclusionViolation } from '../../../shared/db/pg-errors';
import type { BlockListFilter, BlockRepository } from '../application/ports';
import type { AvailabilityBlock } from '../domain/availability-block';
import { BlockOverlapError } from '../domain/errors';
import { availabilityBlocks } from './schema';

@Injectable()
export class DrizzleBlockRepository implements BlockRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async overlaps(coachId: string, startsAt: Date, endsAt: Date): Promise<boolean> {
    const rows = await this.db
      .select({ id: availabilityBlocks.id })
      .from(availabilityBlocks)
      .where(
        and(
          eq(availabilityBlocks.coachId, coachId),
          lt(availabilityBlocks.startsAt, endsAt),
          gt(availabilityBlocks.endsAt, startsAt),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async list(coachId: string, filter: BlockListFilter): Promise<AvailabilityBlock[]> {
    const { from, to, limit, cursor } = filter;
    return this.db
      .select()
      .from(availabilityBlocks)
      .where(
        and(
          eq(availabilityBlocks.coachId, coachId),
          gte(availabilityBlocks.startsAt, from),
          to && lt(availabilityBlocks.startsAt, to),
          cursor &&
            or(
              gt(availabilityBlocks.startsAt, cursor.at),
              and(eq(availabilityBlocks.startsAt, cursor.at), gt(availabilityBlocks.id, cursor.id)),
            ),
        ),
      )
      .orderBy(asc(availabilityBlocks.startsAt), asc(availabilityBlocks.id))
      .limit(limit + 1);
  }

  async findOwned(id: string, coachId: string): Promise<AvailabilityBlock | null> {
    const [row] = await this.db
      .select()
      .from(availabilityBlocks)
      .where(and(eq(availabilityBlocks.id, id), eq(availabilityBlocks.coachId, coachId)));
    return row ?? null;
  }

  async add(block: AvailabilityBlock): Promise<void> {
    try {
      await this.db.insert(availabilityBlocks).values(block);
    } catch (error) {
      if (isExclusionViolation(error)) throw new BlockOverlapError();
      throw error;
    }
  }
}
