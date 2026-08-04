import {
  Controller,
  ForbiddenException,
  type MessageEvent,
  ParseUUIDPipe,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { interval, map, merge, type Observable } from 'rxjs';

import { CurrentUser } from '@common/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@common/auth/guards/jwt-auth.guard';
import type { JwtPayload } from '@common/auth/jwt-payload';

import { QueueEventBroadcaster } from '../../infrastructure/nats/queue-event-broadcaster.service';

@Controller()
export class QueueEventsController {
  constructor(private readonly broadcaster: QueueEventBroadcaster) {}

  @UseGuards(JwtAuthGuard)
  @Sse('/events/queue')
  queueEvents(
    @Query('clinicId', ParseUUIDPipe) clinicId: string,
    @CurrentUser() user: JwtPayload,
  ): Observable<MessageEvent> {
    if (clinicId !== user.clinic_id) {
      throw new ForbiddenException(
        'clinicId does not match authenticated clinic scope',
      );
    }

    return merge(
      this.broadcaster.getStream(clinicId),
      interval(25_000).pipe(map(() => ({ data: ':heartbeat' }))),
    );
  }
}
