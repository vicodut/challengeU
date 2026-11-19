// Typed domain errors carry a stable `code` and a `kind` the exception filter maps to a status.
// The domain is pure (no shared/), so the base class lives here; `kind` values mirror
// shared/errors/domain-error.ts and are matched structurally by the filter.
type ErrorKind = 'unauthenticated' | 'forbidden' | 'not_found' | 'conflict' | 'unprocessable';

abstract class IdentityError extends Error {
  constructor(
    readonly code: string,
    readonly kind: ErrorKind,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidCredentialsError extends IdentityError {
  constructor() {
    super('INVALID_CREDENTIALS', 'unauthenticated', 'Missing or invalid credentials');
  }
}

export class RoleForbiddenError extends IdentityError {
  constructor() {
    super('ROLE_FORBIDDEN', 'forbidden', 'Your role is not allowed to do this');
  }
}

export class UserNotFoundError extends IdentityError {
  constructor() {
    super('USER_NOT_FOUND', 'not_found', 'User not found');
  }
}

export class UsernameTakenError extends IdentityError {
  constructor(username: string) {
    super('USERNAME_TAKEN', 'conflict', `The username "${username}" is already taken`);
  }
}

export class InvalidTimeZoneError extends IdentityError {
  constructor(timeZone: string) {
    super('INVALID_TIME_ZONE', 'unprocessable', `"${timeZone}" is not an IANA time zone`);
  }
}
