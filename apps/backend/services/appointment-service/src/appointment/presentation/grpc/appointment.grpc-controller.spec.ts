import { Chair } from '../../domain/entities/chair';
import { QueueEntry } from '../../domain/entities/queue-entry';
import { QueuePriority } from '../../domain/enums/queue-priority.enum';
import { QueueStatus } from '../../domain/enums/queue-status.enum';
import { ManageAppointmentsUseCase } from '../../application/use-cases/manage-appointments.use-case';
import { ManageChairsUseCase } from '../../application/use-cases/manage-chairs.use-case';
import { ManageQueueUseCase } from '../../application/use-cases/manage-queue.use-case';
import { ManageWaitingRoomUseCase } from '../../application/use-cases/manage-waiting-room.use-case';
import { AppointmentGrpcController } from './appointment.grpc-controller';

const now = new Date('2026-08-04T08:00:00.000Z');

function queueEntry(
  overrides: {
    id?: string;
    status?: QueueStatus;
    chairId?: string | null;
    chairName?: string | null;
    manualOrder?: number | null;
  } = {},
): QueueEntry {
  const status = overrides.status ?? QueueStatus.WAITING;

  return new QueueEntry(
    overrides.id ?? 'queue-1',
    'clinic-1',
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
    null,
    status === QueueStatus.IN_CHAIR ? now : null,
    null,
    now,
  );
}

function chair(): Chair {
  return new Chair({
    id: 'chair-1',
    clinicId: 'clinic-1',
    name: 'Operatory 1',
    code: 'OP-1',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
}

describe(AppointmentGrpcController.name, () => {
  function setup() {
    const waitingRoomUC = {
      getState: jest.fn().mockResolvedValue({
        entries: [],
        chairs: [
          {
            chair: chair(),
            isAvailable: true,
            occupiedByEntryId: null,
          },
        ],
        ordering: {
          mode: 'AUTO',
          manualStatuses: [],
        },
        generatedAt: now,
      }),
      updateStatus: jest.fn().mockResolvedValue(
        queueEntry({
          status: QueueStatus.IN_CHAIR,
          chairId: 'chair-1',
          chairName: 'Operatory 1',
        }),
      ),
      assignChair: jest.fn().mockResolvedValue(
        queueEntry({
          status: QueueStatus.IN_CHAIR,
          chairId: 'chair-1',
          chairName: 'Operatory 1',
        }),
      ),
      reorder: jest.fn().mockResolvedValue([
        queueEntry({
          id: 'queue-2',
          manualOrder: 1,
        }),
      ]),
    };
    const chairsUC = {
      create: jest.fn().mockResolvedValue(chair()),
      update: jest.fn().mockResolvedValue(chair()),
    };

    return {
      controller: new AppointmentGrpcController(
        {} as unknown as ManageAppointmentsUseCase,
        {} as unknown as ManageQueueUseCase,
        waitingRoomUC as unknown as ManageWaitingRoomUseCase,
        chairsUC as unknown as ManageChairsUseCase,
      ),
      waitingRoomUC,
      chairsUC,
    };
  }

  it('delegates waiting-room status updates with clinic scope and ordering hints', async () => {
    const { controller, waitingRoomUC } = setup();

    const reply = await controller.updateWaitingRoomStatus({
      clinicId: 'clinic-1',
      queueEntryId: 'queue-1',
      status: QueueStatus.IN_CHAIR,
      chairId: 'chair-1',
      targetOrderedEntryIds: ['queue-1', 'queue-2'],
    });

    expect(waitingRoomUC.updateStatus).toHaveBeenCalledWith('clinic-1', {
      queueEntryId: 'queue-1',
      status: QueueStatus.IN_CHAIR,
      chairId: 'chair-1',
      correctionReason: undefined,
      targetOrderedEntryIds: ['queue-1', 'queue-2'],
    });
    expect(reply).toEqual(
      expect.objectContaining({
        id: 'queue-1',
        chairId: 'chair-1',
        chairName: 'Operatory 1',
      }),
    );
  });

  it('returns waiting-room chairs from service state', async () => {
    const { controller, waitingRoomUC } = setup();

    const reply = await controller.listWaitingRoomChairs({
      clinicId: 'clinic-1',
    });

    expect(waitingRoomUC.getState).toHaveBeenCalledWith('clinic-1');
    expect(reply.chairs).toEqual([
      expect.objectContaining({
        id: 'chair-1',
        isAvailable: true,
        occupiedByEntryId: '',
      }),
    ]);
  });

  it('delegates chair creation and maps the created chair reply', async () => {
    const { controller, chairsUC } = setup();

    const reply = await controller.createWaitingRoomChair({
      clinicId: 'clinic-1',
      name: 'Operatory 1',
      code: 'OP-1',
      isActive: true,
    });

    expect(chairsUC.create).toHaveBeenCalledWith({
      clinicId: 'clinic-1',
      name: 'Operatory 1',
      code: 'OP-1',
      isActive: true,
    });
    expect(reply).toEqual(
      expect.objectContaining({
        id: 'chair-1',
        name: 'Operatory 1',
        isAvailable: true,
      }),
    );
  });
});
