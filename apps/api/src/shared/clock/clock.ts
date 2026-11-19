import { Injectable } from '@nestjs/common';

/**
 * Port for "the current time". Domain and application code must never call
 * `new Date()` / `Date.now()` directly; tests override this provider.
 */
export abstract class Clock {
  abstract now(): Date;
}

@Injectable()
export class SystemClock extends Clock {
  override now(): Date {
    return new Date();
  }
}
