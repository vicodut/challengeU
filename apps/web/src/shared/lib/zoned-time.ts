const DAY = 86_400_000;

/** Offset (ms) of `timeZone` from UTC at the instant `at`. */
function zoneOffset(at: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(at);
  const n = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const local = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'));
  return local - Math.floor(at / 1000) * 1000;
}

/**
 * The UTC instant of a wall-clock time (`YYYY-MM-DDTHH:mm`, as a datetime-local input gives it) in
 * an IANA zone, or null when that time is not a single instant there: it does not exist (the
 * clocks skipped it) or it happens twice (the clocks repeated it), or the input is malformed.
 */
export function zonedToUtc(local: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
    number,
  ];
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  // A zone's offset changes at most once near any instant, so the offsets a day either side are
  // the only candidates; a candidate is real when the zone really has that offset at that instant.
  const instants = new Set(
    [asUtc - DAY, asUtc + DAY]
      .map((probe) => asUtc - zoneOffset(probe, timeZone))
      .filter((instant) => asUtc - zoneOffset(instant, timeZone) === instant),
  );
  return instants.size === 1 ? new Date([...instants][0] as number) : null;
}

/** An instant rendered as a readable date and time in an IANA zone. */
export function formatInZone(instant: string, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(instant));
}
