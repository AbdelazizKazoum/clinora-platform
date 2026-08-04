import { Module } from '@nestjs/common';

import { QueueEventBroadcaster } from './queue-event-broadcaster.service';

@Module({
  providers: [QueueEventBroadcaster],
  exports: [QueueEventBroadcaster],
})
export class NatsModule {}
