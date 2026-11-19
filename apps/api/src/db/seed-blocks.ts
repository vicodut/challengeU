import { BlockOverlapError, type PublishBlock } from '../modules/booking';
import type { AuthenticateUser } from '../modules/identity';
import { zonedToUtc } from '../shared/time/zoned-time';
import { SEED_USERS } from './seed-users';

// Local working hours, mixing 60- and 30-minute blocks.
const DAILY_BLOCKS = [
  { hour: 9, durationMinutes: 60 },
  { hour: 10, durationMinutes: 30 },
  { hour: 14, durationMinutes: 60 },
  { hour: 15, durationMinutes: 30 },
] as const;

/**
 * Publishes blocks for coachA and coachB on each weekday of the next 2 weeks (in the coach's own
 * zone) through the real use case. Idempotent: blocks that already exist are skipped.
 */
export async function seedBlocks(
  publish: PublishBlock,
  authenticate: AuthenticateUser,
  now: Date,
): Promise<void> {
  for (const coach of SEED_USERS.filter(({ role }) => role === 'coach')) {
    const { userId } = await authenticate.execute(coach.username, coach.password);
    const [year, month, day] = now
      .toLocaleDateString('en-CA', { timeZone: coach.timeZone })
      .split('-')
      .map(Number) as [number, number, number];
    for (let offset = 1; offset <= 14; offset++) {
      const date = new Date(Date.UTC(year, month - 1, day + offset));
      if ([0, 6].includes(date.getUTCDay())) continue;
      for (const { hour, durationMinutes } of DAILY_BLOCKS) {
        const startsAt = zonedToUtc(
          {
            year: date.getUTCFullYear(),
            month: date.getUTCMonth() + 1,
            day: date.getUTCDate(),
            hour,
            minute: 0,
          },
          coach.timeZone,
        );
        try {
          await publish.execute(userId, { startsAt, durationMinutes });
        } catch (error) {
          if (!(error instanceof BlockOverlapError)) throw error;
        }
      }
    }
  }
}
