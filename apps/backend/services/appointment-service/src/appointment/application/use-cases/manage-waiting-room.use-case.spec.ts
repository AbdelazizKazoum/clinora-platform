import { BadRequestException, ConflictException } from '@nestjs/common';

import { Chair } from '../../domain/entities/chair';
import { QueueEntry } from '../../domain/entities/queue-entry';
import { QueuePriority } from '../../domain/enums/queue-priority.enum';
import { QueueStatus } from '../../domain/enums/queue-status.enum';
import { ManageWaitingRoomUseCase } from './manage-waiting-room.use-case';

const now = new Date('2026-08-04T08:00:00.000Z');
const clinicId = 'clinic-1';

function chair(overrides: Partial<Chair['properties']> = {}): Chair {
  return new Chair({
    id: 'chair-1',
    clinicId,
    name: 'Operatory 1',
    code: 'OP-1',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

function queueEntry(
  overrides: {
    id?: string;
    clinicId?: string;
    status?: QueueStatus;
    chairId?: string | null;
    chairName?: string | null;
    manualOrder?: number | null;
  } = {},
): QueueEntry {
  const status = overrides.status ?? QueueStatus.WAITING;
  return new QueueEntry(
    overrides.id ?? 'queue-1',
    overrides.clinicId ?? clinicId,
    'appointment-1',
    'patient-1',
    'Patient One',
    null,
    'doctor-1',
    'Doctor One',
    'Checkup',
    status,
    QueuePriority.NORMAL,
    null,
    overrides.chairId ?? null,
    overrides.chairName ?? null,
    overrides.manualOrder ?? null,
    now,
    status === QueueStatus.WAITING ? now : null,
    status === QueueStatus.IN_CHAIR ? now : null,
    status === QueueStatus.DONE ? now : null,
    now,
  );
}

describe(ManageWaitingRoomUseCase.name, () => {
  function setup() {
    const queue = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(queueEntry()),
      findByAppointmentId: jest.fn(),
      findInChairByChairId: jest.fn().mockResolvedValue(null),
      listByClinic: jest.fn().mockResolvedValue([queueEntry()]),
      updateStatus: jest.fn(),
      updateWaitingRoomStatus: jest.fn().mockImplementation(({ status }) =>
        Promise.resolve(
          queueEntry({
            status,
            chairId: status === QueueStatus.IN_CHAIR ? 'chair-1' : null,
            chairName: status === QueueStatus.IN_CHAIR ? 'Operatory 1' : null,
          }),
        ),
      ),
      assignChair: jest.fn().mockResolvedValue(
        queueEntry({
          status: QueueStatus.IN_CHAIR,
          chairId: 'chair-1',
          chairName: 'Operatory 1',
        }),
      ),
      reorderStatus: jest.fn().mockResolvedValue([queueEntry()]),
      clearManualOrder: jest.fn().mockResolvedValue([queueEntry()]),
      updateNotes: jest.fn().mockResolvedValue(queueEntry()),
    };
    const chairs = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(chair()),
      listByClinic: jest.fn().mockResolvedValue([chair()]),
      listActiveByClinic: jest.fn(),
      update: jest.fn(),
    };
    const outbox = {
      add: jest.fn().mockResolvedValue(undefined),
      findUnpublished: jest.fn(),
      markPublished: jest.fn(),
    };

    return {
      useCase: new ManageWaitingRoomUseCase(queue, chairs, outbox),
      queue,
      chairs,
      outbox,
    };
  }

  it('returns waiting-room state with chair availability and ordering mode', async () => {
    const { useCase, queue } = setup();
    queue.listByClinic.mockResolvedValue([
      queueEntry({
        status: QueueStatus.IN_CHAIR,
        chairId: 'chair-1',
        manualOrder: 10,
      }),
    ]);

    const state = await useCase.getState(clinicId);

    expect(state.ordering).toEqual({
      mode: 'MANUAL',
      manualStatuses: [QueueStatus.IN_CHAIR],
    });
    expect(state.chairs[0]).toMatchObject({
      occupiedByEntryId: 'queue-1',
      isAvailable: false,
    });
  });

  it('requires an active chair before moving a patient into a chair', async () => {
    const { useCase } = setup();

    await expect(
      useCase.updateStatus(clinicId, {
        queueEntryId: 'queue-1',
        status: QueueStatus.IN_CHAIR,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects assigning an inactive chair', async () => {
    const { useCase, chairs } = setup();
    chairs.findById.mockResolvedValueOnce(chair({ isActive: false }));

    await expect(
      useCase.updateStatus(clinicId, {
        queueEntryId: 'queue-1',
        status: QueueStatus.IN_CHAIR,
        chairId: 'chair-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects assigning an occupied chair', async () => {
    const { useCase, queue } = setup();
    queue.findInChairByChairId.mockResolvedValueOnce(
      queueEntry({
        id: 'queue-2',
        status: QueueStatus.IN_CHAIR,
        chairId: 'chair-1',
      }),
    );

    await expect(
      useCase.updateStatus(clinicId, {
        queueEntryId: 'queue-1',
        status: QueueStatus.IN_CHAIR,
        chairId: 'chair-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates status with chair snapshot and publishes a status event', async () => {
    const { useCase, queue, outbox } = setup();

    await useCase.updateStatus(clinicId, {
      queueEntryId: 'queue-1',
      status: QueueStatus.IN_CHAIR,
      chairId: 'chair-1',
    });

    expect(queue.updateWaitingRoomStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'queue-1',
        status: QueueStatus.IN_CHAIR,
        chairId: 'chair-1',
        chairName: 'Operatory 1',
      }),
    );
    expect(outbox.add).toHaveBeenCalledWith({
      eventType: 'queue.status.updated',
      payload: expect.objectContaining({
        clinic_id: clinicId,
        status: QueueStatus.IN_CHAIR,
      }),
    });
  });

  it('requires a correction reason before moving backward', async () => {
    const { useCase, queue } = setup();
    queue.findById.mockResolvedValueOnce(
      queueEntry({ status: QueueStatus.IN_CHAIR }),
    );

    await expect(
      useCase.updateStatus(clinicId, {
        queueEntryId: 'queue-1',
        status: QueueStatus.WAITING,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects manual reorder entries outside the requested status', async () => {
    const { useCase, queue } = setup();
    queue.listByClinic.mockResolvedValue([
      queueEntry({ id: 'queue-1', status: QueueStatus.WAITING }),
      queueEntry({ id: 'queue-2', status: QueueStatus.ARRIVED }),
    ]);

    await expect(
      useCase.reorder({
        clinicId,
        mode: 'MANUAL',
        status: QueueStatus.WAITING,
        orderedEntryIds: ['queue-1', 'queue-2'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('persists manual reorder and writes a reorder event', async () => {
    const { useCase, queue, outbox } = setup();
    queue.listByClinic.mockResolvedValue([
      queueEntry({ id: 'queue-1', status: QueueStatus.WAITING }),
      queueEntry({ id: 'queue-2', status: QueueStatus.WAITING }),
    ]);
    queue.reorderStatus.mockResolvedValue([
      queueEntry({ id: 'queue-2', manualOrder: 1 }),
      queueEntry({ id: 'queue-1', manualOrder: 2 }),
    ]);

    await useCase.reorder({
      clinicId,
      mode: 'MANUAL',
      status: QueueStatus.WAITING,
      orderedEntryIds: ['queue-2', 'queue-1'],
    });

    expect(queue.reorderStatus).toHaveBeenCalledWith({
      clinicId,
      status: QueueStatus.WAITING,
      orderedEntryIds: ['queue-2', 'queue-1'],
    });
    expect(outbox.add).toHaveBeenCalledWith({
      eventType: 'queue.reordered',
      payload: expect.objectContaining({
        clinic_id: clinicId,
        status: QueueStatus.WAITING,
      }),
    });
  });

  it('writes status and reorder events when a status move includes destination order', async () => {
    const { useCase, queue, outbox } = setup();
    queue.listByClinic.mockResolvedValue([
      queueEntry({ id: 'queue-1', status: QueueStatus.IN_CHAIR }),
      queueEntry({ id: 'queue-2', status: QueueStatus.IN_CHAIR }),
    ]);
    queue.reorderStatus.mockResolvedValue([
      queueEntry({
        id: 'queue-1',
        status: QueueStatus.IN_CHAIR,
        manualOrder: 1,
      }),
      queueEntry({
        id: 'queue-2',
        status: QueueStatus.IN_CHAIR,
        manualOrder: 2,
      }),
    ]);

    await useCase.updateStatus(clinicId, {
      queueEntryId: 'queue-1',
      status: QueueStatus.IN_CHAIR,
      chairId: 'chair-1',
      targetOrderedEntryIds: ['queue-1', 'queue-2'],
    });

    expect(outbox.add).toHaveBeenCalledWith({
      eventType: 'queue.status.updated',
      payload: expect.objectContaining({ status: QueueStatus.IN_CHAIR }),
    });
    expect(outbox.add).toHaveBeenCalledWith({
      eventType: 'queue.reordered',
      payload: expect.objectContaining({ status: QueueStatus.IN_CHAIR }),
    });
  });

  it('assigns a chair to a seated entry and writes a chair assignment event', async () => {
    const { useCase, queue, outbox } = setup();
    queue.findById.mockResolvedValueOnce(
      queueEntry({ status: QueueStatus.IN_CHAIR }),
    );

    await useCase.assignChair(clinicId, 'queue-1', 'chair-1');

    expect(queue.assignChair).toHaveBeenCalledWith({
      id: 'queue-1',
      chairId: 'chair-1',
      chairName: 'Operatory 1',
    });
    expect(outbox.add).toHaveBeenCalledWith({
      eventType: 'queue.chair.assigned',
      payload: expect.objectContaining({
        clinic_id: clinicId,
        entry: expect.objectContaining({
          id: 'queue-1',
          chair_id: 'chair-1',
        }),
        chair: expect.objectContaining({ id: 'chair-1' }),
      }),
    });
  });

  it('clears manual order for automatic reorder', async () => {
    const { useCase, queue } = setup();

    await useCase.reorder({
      clinicId,
      mode: 'AUTO',
      status: QueueStatus.WAITING,
    });

    expect(queue.clearManualOrder).toHaveBeenCalledWith({
      clinicId,
      status: QueueStatus.WAITING,
    });
  });
});
