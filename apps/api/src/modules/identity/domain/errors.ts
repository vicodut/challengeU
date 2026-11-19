// Typed domain errors carry a stable `code` and a `kind` the exception filter maps to a status.
export class InvalidCredentialsError extends Error {
  readonly code = 'INVALID_CREDENTIALS';
  readonly kind = 'unauthenticated' as const;

  constructor() {
    super('Missing or invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

export class RoleForbiddenError extends Error {
  readonly code = 'ROLE_FORBIDDEN';
  readonly kind = 'forbidden' as const;

  constructor() {
    super('Your role is not allowed to do this');
    this.name = 'RoleForbiddenError';
  }
}

export class UserNotFoundError extends Error {
  readonly code = 'USER_NOT_FOUND';
  readonly kind = 'not_found' as const;

  constructor() {
    super('User not found');
    this.name = 'UserNotFoundError';
  }
}

export class UsernameTakenError extends Error {
  readonly code = 'USERNAME_TAKEN';
  readonly kind = 'conflict' as const;

  constructor(username: string) {
    super(`The username "${username}" is already taken`);
    this.name = 'UsernameTakenError';
  }
}

export class InvalidTimeZoneError extends Error {
  readonly code = 'INVALID_TIME_ZONE';
  readonly kind = 'unprocessable' as const;

  constructor(timeZone: string) {
    super(`"${timeZone}" is not an IANA time zone`);
    this.name = 'InvalidTimeZoneError';
  }
}
