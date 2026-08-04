import { ConfigService } from '@nestjs/config';
import { connect } from 'nats';

import type { IOutboxRepository } from '../../domain/repositories/outbox-repository.interface';
import { OutboxRelayService } from './outbox-relay.service';

jest.mock('nats', () => ({
  connect: jest.fn(),
}));

const connectMock = connect as jest.MockedFunction<typeof connect>;

describe('OutboxRelayService', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('does not connect when NATS_URL is not configured', async () => {
    const service = new OutboxRelayService(
      { get: jest.fn().mockReturnValue('') } as unknown as ConfigService,
      { findUnpublished: jest.fn() } as unknown as IOutboxRepository,
    );

    await service.onModuleInit();

    expect(connectMock).not.toHaveBeenCalled();
  });

  it('publishes pending outbox events and marks them published', async () => {
    jest.useFakeTimers();
    const publish = jest.fn();
    const drain = jest.fn().mockResolvedValue(undefined);
    connectMock.mockResolvedValue({
      publish,
      drain,
    } as unknown as Awaited<ReturnType<typeof connect>>);
    const outbox = {
      findUnpublished: jest.fn().mockResolvedValue([
        {
          id: 'event-1',
          eventType: 'queue.checked_in',
          payload: { clinic_id: 'clinic-1', id: 'queue-1' },
          published: false,
          createdAt: new Date('2026-08-04T09:00:00.000Z'),
        },
      ]),
      markPublished: jest.fn().mockResolvedValue(undefined),
    } as unknown as IOutboxRepository;
    const config = {
      get: jest.fn((key: string, fallback?: number) =>
        key === 'NATS_URL' ? 'nats://localhost:4222' : fallback,
      ),
    } as unknown as ConfigService;
    const service = new OutboxRelayService(config, outbox);

    await service.onModuleInit();
    await (
      service as unknown as { publishPending: () => Promise<void> }
    ).publishPending();

    expect(connectMock).toHaveBeenCalledWith({
      servers: 'nats://localhost:4222',
    });
    expect(publish).toHaveBeenCalledWith(
      'queue.checked_in',
      Buffer.from(JSON.stringify({ clinic_id: 'clinic-1', id: 'queue-1' })),
    );
    expect(outbox.markPublished).toHaveBeenCalledWith('event-1');

    await service.onModuleDestroy();
    expect(drain).toHaveBeenCalled();
  });
});
