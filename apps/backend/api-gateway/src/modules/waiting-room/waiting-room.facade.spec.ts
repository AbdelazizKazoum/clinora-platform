import { status } from '@grpc/grpc-js';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import type { AppointmentServiceClient } from '../../clients/appointment/appointment-service.client';
import {
  mapWaitingRoomGrpcException,
  WaitingRoomFacade,
} from './waiting-room.facade';

const clinicId = '10000000-0000-4000-8000-000000000001';
const otherClinicId = '10000000-0000-4000-8000-000000000002';
const entryId = '20000000-0000-4000-8000-000000000001';
const chairId = '30000000-0000-4000-8000-000000000001';

function queueEntry(overrides: { clinicId?: string } = {}) {
  return {
    id: entryId,
    clinicId: overrides.clinicId ?? clinicId,
    appointmentId: '40000000-0000-4000-8000-000000000001',
    patientId: '50000000-0000-4000-8000-000000000001',
    patientName: 'Patient One',
    patientPhone: '',
    doctorId: '60000000-0000-4000-8000-000000000001',
    doctorName: 'Doctor One',
    appointmentType: 'Checkup',
    status: 'WAITING',
    priority: 'NORMAL',
    queueNotes: '',
    arrivedAt: '2026-08-04T08:00:00.000Z',
    calledAt: '',
    seatedAt: '',
    completedAt: '',
    updatedAt: '2026-08-04T08:00:00.000Z',
    chairId: '',
    chairName: '',
  };
}

describe(mapWaitingRoomGrpcException.name, () => {
  it.each([
    [status.INVALID_ARGUMENT, BadRequestException],
    [status.ALREADY_EXISTS, ConflictException],
    [status.NOT_FOUND, NotFoundException],
    [status.PERMISSION_DENIED, ForbiddenException],
    [status.UNAVAILABLE, ServiceUnavailableException],
    [status.DEADLINE_EXCEEDED, ServiceUnavailableException],
    [status.INTERNAL, InternalServerErrorException],
  ])('maps gRPC status %s to the expected HTTP error', (code, ErrorType) => {
    expect(
      mapWaitingRoomGrpcException({
        code,
        details: 'waiting room request failed',
      }),
    ).toBeInstanceOf(ErrorType);
  });
});

describe(WaitingRoomFacade.name, () => {
  const appointmentsClient: jest.Mocked<
    Pick<
      AppointmentServiceClient,
      | 'getWaitingRoomState'
      | 'updateWaitingRoomStatus'
      | 'getQueueEntry'
      | 'updateQueueNotes'
      | 'assignWaitingRoomChair'
      | 'reorderWaitingRoomEntries'
      | 'listWaitingRoomChairs'
      | 'createWaitingRoomChair'
      | 'updateWaitingRoomChair'
    >
  > = {
    getWaitingRoomState: jest.fn(),
    updateWaitingRoomStatus: jest.fn(),
    getQueueEntry: jest.fn(),
    updateQueueNotes: jest.fn(),
    assignWaitingRoomChair: jest.fn(),
    reorderWaitingRoomEntries: jest.fn(),
    listWaitingRoomChairs: jest.fn(),
    createWaitingRoomChair: jest.fn(),
    updateWaitingRoomChair: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  function facade(): WaitingRoomFacade {
    return new WaitingRoomFacade(
      appointmentsClient as unknown as AppointmentServiceClient,
    );
  }

  it('delegates waiting-room state reads to the appointment client', async () => {
    appointmentsClient.getWaitingRoomState.mockResolvedValue({
      entries: [],
      chairs: [],
      ordering: {
        mode: 'AUTO',
        manualStatuses: [],
      },
      generatedAt: '2026-08-04T08:00:00.000Z',
    });

    await facade().getState(clinicId);

    expect(appointmentsClient.getWaitingRoomState).toHaveBeenCalledWith({
      clinicId,
    });
  });

  it('passes clinic-scoped waiting-room commands through to gRPC', async () => {
    appointmentsClient.updateWaitingRoomStatus.mockResolvedValue(queueEntry());
    appointmentsClient.assignWaitingRoomChair.mockResolvedValue(queueEntry());
    appointmentsClient.reorderWaitingRoomEntries.mockResolvedValue({
      queueEntries: [queueEntry()],
    });

    await facade().updateStatus({
      clinicId,
      queueEntryId: entryId,
      status: 'IN_CHAIR',
      chairId,
    });
    await facade().assignChair({
      clinicId,
      queueEntryId: entryId,
      chairId,
    });
    await facade().reorderEntries({
      clinicId,
      mode: 'MANUAL',
      status: 'WAITING',
      orderedEntryIds: [entryId],
    });

    expect(appointmentsClient.updateWaitingRoomStatus).toHaveBeenCalledWith({
      clinicId,
      queueEntryId: entryId,
      status: 'IN_CHAIR',
      chairId,
    });
    expect(appointmentsClient.assignWaitingRoomChair).toHaveBeenCalledWith({
      clinicId,
      queueEntryId: entryId,
      chairId,
    });
    expect(appointmentsClient.reorderWaitingRoomEntries).toHaveBeenCalledWith({
      clinicId,
      mode: 'MANUAL',
      status: 'WAITING',
      orderedEntryIds: [entryId],
    });
  });

  it('checks clinic ownership before using the legacy queue notes command', async () => {
    appointmentsClient.getQueueEntry.mockResolvedValue(queueEntry());
    appointmentsClient.updateQueueNotes.mockResolvedValue(
      queueEntry({ clinicId }),
    );

    await facade().updateNotes(clinicId, {
      queueEntryId: entryId,
      queueNotes: 'Needs x-ray',
    });

    expect(appointmentsClient.getQueueEntry).toHaveBeenCalledWith({
      id: entryId,
    });
    expect(appointmentsClient.updateQueueNotes).toHaveBeenCalledWith({
      queueEntryId: entryId,
      queueNotes: 'Needs x-ray',
    });
  });

  it('does not update notes when the queue entry belongs to another clinic', async () => {
    appointmentsClient.getQueueEntry.mockResolvedValue(
      queueEntry({ clinicId: otherClinicId }),
    );

    await expect(
      facade().updateNotes(clinicId, {
        queueEntryId: entryId,
        queueNotes: 'Needs x-ray',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(appointmentsClient.updateQueueNotes).not.toHaveBeenCalled();
  });

  it('maps appointment-service failures to stable HTTP errors', async () => {
    appointmentsClient.createWaitingRoomChair.mockRejectedValue({
      code: status.UNAVAILABLE,
    });

    await expect(
      facade().createChair({
        clinicId,
        name: 'Operatory 1',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
