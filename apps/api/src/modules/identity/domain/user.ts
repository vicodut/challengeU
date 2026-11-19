import { InvalidTimeZoneError } from './errors';
import type { Role } from './role';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  /** IANA time zone, e.g. `America/Toronto`. */
  timeZone: string;
  role: Role;
}

const IANA_ZONES: ReadonlySet<string> = new Set([...Intl.supportedValuesOf('timeZone'), 'UTC']);

/** Builds a user, enforcing the domain rule that the time zone is a real IANA zone. */
export function createUser(input: User): User {
  if (!IANA_ZONES.has(input.timeZone)) throw new InvalidTimeZoneError(input.timeZone);
  return input;
}
