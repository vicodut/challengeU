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
 * The UTC instant of a wall-clock time in an IANA zone. shortcut: inside a DST gap or overlap it
 * returns one of the candidate instants without saying which; callers pass unambiguous times.
 */
export function zonedToUtc(
  local: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string,
): Date {
  const asUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  const guess = asUtc - zoneOffset(asUtc, timeZone);
  return new Date(asUtc - zoneOffset(guess, timeZone));
}
