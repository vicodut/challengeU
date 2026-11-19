// Typed domain errors: `code` is stable, `kind` is mapped to a status by the exception filter
// (same structural contract as shared/errors/domain-error.ts; the domain may not import shared/).
type ErrorKind = 'conflict' | 'unprocessable' | 'not_found';

abstract class BookingError extends Error {
  constructor(
    readonly code: string,
    readonly kind: ErrorKind,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidBlockDurationError extends BookingError {
  constructor() {
    super('INVALID_BLOCK_DURATION', 'unprocessable', 'A block lasts 30 or 60 minutes');
  }
}

export class BlockNotAlignedError extends BookingError {
  constructor() {
    super('BLOCK_NOT_ALIGNED', 'unprocessable', 'A block must start on a :00 or :30 UTC boundary');
  }
}

export class BlockInPastError extends BookingError {
  constructor() {
    super('BLOCK_IN_PAST', 'unprocessable', 'A block cannot start in the past');
  }
}

export class BlockOverlapError extends BookingError {
  constructor() {
    super('BLOCK_OVERLAP', 'conflict', 'The block overlaps another of your blocks');
  }
}

export class BlockNotFoundError extends BookingError {
  constructor() {
    super('BLOCK_NOT_FOUND', 'not_found', 'No such availability block');
  }
}

export class BlockHasBookingsError extends BookingError {
  constructor() {
    super('BLOCK_HAS_BOOKINGS', 'conflict', 'A block with bookings cannot be deleted');
  }
}
