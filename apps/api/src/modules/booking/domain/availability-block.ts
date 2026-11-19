import { BlockInPastError, BlockNotAlignedError, InvalidBlockDurationError } from './errors';

export const BLOCK_DURATIONS = [30, 60] as const;
const MINUTE = 60_000;

export interface AvailabilityBlock {
  id: string;
  coachId: string;
  /** UTC instants. */
  startsAt: Date;
  endsAt: Date;
}

/** Builds a block, enforcing duration, :00/:30 UTC alignment and "not in the past". */
export function createBlock(
  input: { id: string; coachId: string; startsAt: Date; durationMinutes: number },
  now: Date,
): AvailabilityBlock {
  if (!BLOCK_DURATIONS.some((minutes) => minutes === input.durationMinutes)) {
    throw new InvalidBlockDurationError();
  }
  if (input.startsAt.getTime() % (30 * MINUTE) !== 0) throw new BlockNotAlignedError();
  if (input.startsAt <= now) throw new BlockInPastError();
  const endsAt = new Date(input.startsAt.getTime() + input.durationMinutes * MINUTE);
  return { id: input.id, coachId: input.coachId, startsAt: input.startsAt, endsAt };
}
