import type { DomainError } from './domain-error';

export interface FieldError {
  field: string;
  messages: string[];
}

/** Request validation failed (class-validator). Rendered as a 422 Problem Details. */
export class ValidationFailedError extends Error implements DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly kind = 'unprocessable' as const;

  constructor(readonly errors: FieldError[]) {
    super('The request body or parameters are invalid');
    this.name = 'ValidationFailedError';
  }
}
