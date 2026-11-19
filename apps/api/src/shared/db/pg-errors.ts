const UNIQUE_VIOLATION = '23505';
const EXCLUSION_VIOLATION = '23P01';

/** True when the error, or a `cause` Drizzle wrapped it in, carries this Postgres code. */
function hasPgCode(error: unknown, code: string): boolean {
  for (let current = error; current instanceof Error; current = current.cause) {
    if ((current as { code?: unknown }).code === code) return true;
  }
  return false;
}

export const isUniqueViolation = (error: unknown): boolean => hasPgCode(error, UNIQUE_VIOLATION);
export const isExclusionViolation = (error: unknown): boolean =>
  hasPgCode(error, EXCLUSION_VIOLATION);
