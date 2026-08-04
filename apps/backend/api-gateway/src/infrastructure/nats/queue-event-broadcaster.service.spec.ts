import { ConfigService } from '@nestjs/config';
import { connect } from 'nats';

import { QueueEventBroadcaster } from './queue-event-broadcaster.service';

jest.mock('nats', () => ({
  connect: jest.fn(),
}));

const connectMock = connect as jest.MockedFunction<typeof connect>;
const clinicId = '10000000-0000-4000-8000-000000000001';

describe(QueueEventBroadcaster.name, () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not connect when NATS_URL is not configured', async () => {
    const service = new QueueEventBroadcaster({
      get: jest.fn().mockReturnValue(''),
    } as unknown as ConfigService);

    await service.onModuleInit();

    expect(connectMock).not.toHaveBeenCalled();
  });

  it('subscribes to all queue subjects needed by waiting-room SSE', async () => {
    const subscribe = jest.fn().mockReturnValue(createIdleSubscription());
    connectMock.mockResolvedValue({
      subscribe,
      drain: jest.fn().mockResolvedValue(undefined),
    } as unknown as Awaited<ReturnType<typeof connect>>);
    const service = new QueueEventBroadcaster({
      get: jest.fn().mockReturnValue('nats://localhost:4222'),
    } as unknown as ConfigService);

    await service.onModuleInit();

    expect(connectMock).toHaveBeenCalledWith({
      servers: 'nats://localhost:4222',
    });
    expect(subscribe).toHaveBeenCalledWith('queue.checked_in');
    expect(subscribe).toHaveBeenCalledWith('queue.status.updated');
    expect(subscribe).toHaveBeenCalledWith('queue.notes.updated');
    expect(subscribe).toHaveBeenCalledWith('queue.reordered');
    expect(subscribe).toHaveBeenCalledWith('queue.chair.assigned');
    expect(subscribe).toHaveBeenCalledWith('queue.chair.updated');
  });

  it('normalizes entry events into queue stream envelopes', () => {
    const service = createServiceForNormalization();

    expect(
      service.toStreamEvent('queue.status.updated', clinicId, {
        clinic_id: clinicId,
        id: 'queue-1',
        chair_id: 'chair-1',
        manual_order: 2,
      }),
    ).toEqual({
      type: 'queue.status.updated',
      clinic_id: clinicId,
      entry: {
        clinic_id: clinicId,
        id: 'queue-1',
        chair_id: 'chair-1',
        manual_order: 2,
      },
    });
  });

  it('normalizes reorder and chair events into queue stream envelopes', () => {
    const service = createServiceForNormalization();

    expect(
      service.toStreamEvent('queue.reordered', clinicId, {
        clinic_id: clinicId,
        status: 'WAITING',
        entries: [{ id: 'queue-2' }, { id: 'queue-1' }],
      }),
    ).toEqual({
      type: 'queue.reordered',
      clinic_id: clinicId,
      status: 'WAITING',
      entries: [{ id: 'queue-2' }, { id: 'queue-1' }],
    });
    expect(
      service.toStreamEvent('queue.chair.assigned', clinicId, {
        clinic_id: clinicId,
        entry: { id: 'queue-1', chair_id: 'chair-1' },
        chair: { id: 'chair-1' },
      }),
    ).toEqual({
      type: 'queue.chair.assigned',
      clinic_id: clinicId,
      entry: { id: 'queue-1', chair_id: 'chair-1' },
      chair: { id: 'chair-1' },
    });
    expect(
      service.toStreamEvent('queue.chair.updated', clinicId, {
        clinic_id: clinicId,
        chair: { id: 'chair-1', is_active: false },
      }),
    ).toEqual({
      type: 'queue.chair.updated',
      clinic_id: clinicId,
      chair: { id: 'chair-1', is_active: false },
    });
  });
});

function createServiceForNormalization(): {
  toStreamEvent: (
    subject:
      | 'queue.checked_in'
      | 'queue.status.updated'
      | 'queue.notes.updated'
      | 'queue.reordered'
      | 'queue.chair.assigned'
      | 'queue.chair.updated',
    clinicId: string,
    payload: Record<string, unknown>,
  ) => unknown;
} {
  return new QueueEventBroadcaster({
    get: jest.fn(),
  } as unknown as ConfigService) as unknown as {
    toStreamEvent: (
      subject:
        | 'queue.checked_in'
        | 'queue.status.updated'
        | 'queue.notes.updated'
        | 'queue.reordered'
        | 'queue.chair.assigned'
        | 'queue.chair.updated',
      clinicId: string,
      payload: Record<string, unknown>,
    ) => unknown;
  };
}

function createIdleSubscription(): AsyncIterable<unknown> & {
  unsubscribe: jest.Mock;
} {
  return {
    unsubscribe: jest.fn(),
    async *[Symbol.asyncIterator]() {
      return;
    },
  };
}
