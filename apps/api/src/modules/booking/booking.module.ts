import { Module } from '@nestjs/common';
import { ACTIVE_BOOKING_COUNTER, BLOCK_REPOSITORY } from './application/ports';
import { DeleteBlock } from './application/delete-block';
import { NoBookingCounter } from './infrastructure/no-booking-counter';
import { GetBlock, ListBlocks } from './application/read-blocks';
import { PublishBlock } from './application/publish-block';
import { AvailabilityController } from './controllers/availability.controller';
import { DrizzleBlockRepository } from './infrastructure/drizzle-block.repository';

@Module({
  controllers: [AvailabilityController],
  providers: [
    PublishBlock,
    ListBlocks,
    GetBlock,
    DeleteBlock,
    { provide: ACTIVE_BOOKING_COUNTER, useClass: NoBookingCounter },
    { provide: BLOCK_REPOSITORY, useClass: DrizzleBlockRepository },
  ],
  exports: [PublishBlock],
})
export class BookingModule {}
