import { Module } from '@nestjs/common';

import { NatsModule } from '../../infrastructure/nats/nats.module';
import { QueueEventsController } from './queue-events.controller';

@Module({
  imports: [NatsModule],
  controllers: [QueueEventsController],
})
export class EventsModule {}
