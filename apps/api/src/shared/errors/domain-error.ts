/**
 * Contract every module's typed domain errors satisfy. Domain code is pure TypeScript and may
 * not import from `shared/`, so modules declare their errors with this shape structurally and
 * the exception filter recognises them with `isDomainError`.
 */
export const ERROR_KINDS = [
  'unauthenticated', // 401
  'forbidden', // 403
  'not_found', // 404
  'conflict', // 409
  'unprocessable', // 422
  'unavailable', // 503
] as const;

export type ErrorKind = (typeof ERROR_KINDS)[number];

export interface DomainError extends Error {
  /** Stable, machine-readable code, e.g. `SLOT_ALREADY_BOOKED`. */
  readonly code: string;
  readonly kind: ErrorKind;
}

export function isDomainError(error: unknown): error is DomainError {
  if (!(error instanceof Error)) return false;
  const { code, kind } = error as Partial<Record<'code' | 'kind', unknown>>;
  return typeof code === 'string' && ERROR_KINDS.some((known) => known === kind);
}

export const STATUS_BY_KIND: Record<ErrorKind, number> = {
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  unprocessable: 422,
  unavailable: 503,
};
