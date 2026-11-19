import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, lt } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../../shared/db/database.module';
import { isExclusionViolation } from '../../../shared/db/pg-errors';
import type { BlockRepository } from '../application/ports';
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

  async add(block: AvailabilityBlock): Promise<void> {
    try {
      await this.db.insert(availabilityBlocks).values(block);
    } catch (error) {
      if (isExclusionViolation(error)) throw new BlockOverlapError();
      throw error;
    }
  }
}
