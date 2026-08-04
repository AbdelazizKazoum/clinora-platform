import { ForbiddenException, type MessageEvent } from '@nestjs/common';
import { Subject } from 'rxjs';

import type { JwtPayload } from '@common/auth/jwt-payload';

import { QueueEventBroadcaster } from '../../infrastructure/nats/queue-event-broadcaster.service';
import { QueueEventsController } from './queue-events.controller';

describe('QueueEventsController', () => {
  const user = {
    user_id: 'user-1',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    role: 'admin',
    iat: 1,
    exp: 2,
  } satisfies JwtPayload;

  it('rejects streams for a different clinic scope', () => {
    const controller = new QueueEventsController({
      getStream: jest.fn(),
    } as unknown as QueueEventBroadcaster);

    expect(() =>
      controller.queueEvents('22222222-2222-2222-2222-222222222222', user),
    ).toThrow(ForbiddenException);
  });

  it('returns the clinic-scoped queue stream', (done) => {
    const stream = new Subject<MessageEvent>();
    const broadcaster = {
      getStream: jest.fn().mockReturnValue(stream.asObservable()),
    } as unknown as QueueEventBroadcaster;
    const controller = new QueueEventsController(broadcaster);

    const result = controller.queueEvents(user.clinic_id, user);
    const subscription = result.subscribe((event) => {
      expect(event).toEqual({ data: 'queue event' });
      expect(broadcaster.getStream).toHaveBeenCalledWith(user.clinic_id);
      subscription.unsubscribe();
      done();
    });

    stream.next({ data: 'queue event' });
  });
});
