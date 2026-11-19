import { Module } from '@nestjs/common';
import { BLOCK_REPOSITORY } from './application/ports';
import { PublishBlock } from './application/publish-block';
import { AvailabilityController } from './controllers/availability.controller';
import { DrizzleBlockRepository } from './infrastructure/drizzle-block.repository';

@Module({
  controllers: [AvailabilityController],
  providers: [PublishBlock, { provide: BLOCK_REPOSITORY, useClass: DrizzleBlockRepository }],
  exports: [PublishBlock],
})
export class BookingModule {}
