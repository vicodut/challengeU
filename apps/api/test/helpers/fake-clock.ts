import type { Clock } from '../../src/shared/clock/clock.port';

/** Controllable clock for tests: pin it with `set`, move it with `advance`. */
export class FakeClock implements Clock {
  constructor(private current: Date = new Date('2030-01-01T00:00:00.000Z')) {}

  now(): Date {
    return new Date(this.current);
  }

  set(instant: Date | string): void {
    this.current = new Date(instant);
  }

  advance(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds);
  }
}
