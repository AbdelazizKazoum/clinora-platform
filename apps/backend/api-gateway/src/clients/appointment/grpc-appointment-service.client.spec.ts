import type { ClientGrpc } from '@nestjs/microservices';
import { of } from 'rxjs';

import { APPOINTMENT_SERVICE_NAME } from '@clinora/contracts-appointment';

import { GrpcAppointmentServiceClient } from './grpc-appointment-service.client';

describe(GrpcAppointmentServiceClient.name, () => {
  function setup() {
    const service = {
      getWaitingRoomState: jest.fn().mockReturnValue(
        of({
          entries: [],
          chairs: [],
          ordering: {
            mode: 'AUTO',
            manualStatuses: [],
          },
          generatedAt: '2026-08-04T08:00:00.000Z',
        }),
      ),
      updateWaitingRoomStatus: jest.fn().mockReturnValue(
        of({
          id: 'queue-1',
          chairId: 'chair-1',
          chairName: 'Operatory 1',
        }),
      ),
      createWaitingRoomChair: jest.fn().mockReturnValue(
        of({
          id: 'chair-1',
          clinicId: 'clinic-1',
          name: 'Operatory 1',
          code: 'OP-1',
          isActive: true,
          isAvailable: true,
          occupiedByEntryId: '',
          createdAt: '2026-08-04T08:00:00.000Z',
          updatedAt: '2026-08-04T08:00:00.000Z',
        }),
      ),
    };
    const grpcClient = {
      getService: jest.fn().mockReturnValue(service),
    };
    const client = new GrpcAppointmentServiceClient(
      grpcClient as unknown as ClientGrpc,
    );

    client.onModuleInit();

    return {
      client,
      grpcClient,
      service,
    };
  }

  it('resolves the appointment gRPC service on module init', () => {
    const { grpcClient } = setup();

    expect(grpcClient.getService).toHaveBeenCalledWith(
      APPOINTMENT_SERVICE_NAME,
    );
  });

  it('delegates waiting-room calls to the gRPC contract client', async () => {
    const { client, service } = setup();

    await expect(
      client.getWaitingRoomState({ clinicId: 'clinic-1' }),
    ).resolves.toEqual(
      expect.objectContaining({
        ordering: {
          mode: 'AUTO',
          manualStatuses: [],
        },
      }),
    );
    await expect(
      client.updateWaitingRoomStatus({
        clinicId: 'clinic-1',
        queueEntryId: 'queue-1',
        status: 'IN_CHAIR',
        chairId: 'chair-1',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        chairId: 'chair-1',
      }),
    );
    await expect(
      client.createWaitingRoomChair({
        clinicId: 'clinic-1',
        name: 'Operatory 1',
        code: 'OP-1',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'chair-1',
      }),
    );

    expect(service.getWaitingRoomState).toHaveBeenCalledWith({
      clinicId: 'clinic-1',
    });
    expect(service.updateWaitingRoomStatus).toHaveBeenCalledWith({
      clinicId: 'clinic-1',
      queueEntryId: 'queue-1',
      status: 'IN_CHAIR',
      chairId: 'chair-1',
    });
    expect(service.createWaitingRoomChair).toHaveBeenCalledWith({
      clinicId: 'clinic-1',
      name: 'Operatory 1',
      code: 'OP-1',
    });
  });
});
