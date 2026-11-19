export class DatabaseUnavailableError extends Error {
  readonly code = 'DATABASE_UNAVAILABLE';
  readonly kind = 'unavailable' as const;

  constructor() {
    super('Database unreachable');
    this.name = 'DatabaseUnavailableError';
  }
}
