import { Injectable } from '@nestjs/common';
import type { ActiveBookingCounter } from '../application/ports';

/** shortcut: bookings do not exist yet (ticket #16); replace with the real count in #23. */
@Injectable()
export class NoBookingCounter implements ActiveBookingCounter {
  countForBlock(): Promise<number> {
    return Promise.resolve(0);
  }
}
