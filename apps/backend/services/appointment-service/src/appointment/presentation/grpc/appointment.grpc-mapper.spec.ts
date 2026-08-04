import { Chair } from '../../domain/entities/chair';
import { QueueEntry } from '../../domain/entities/queue-entry';
import { QueuePriority } from '../../domain/enums/queue-priority.enum';
import { QueueStatus } from '../../domain/enums/queue-status.enum';
import { AppointmentGrpcMapper } from './appointment.grpc-mapper';

const now = new Date('2026-08-04T08:00:00.000Z');

function queueEntry(
  overrides: {
    status?: QueueStatus;
    chairId?: string | null;
    chairName?: string | null;
    manualOrder?: number | null;
  } = {},
): QueueEntry {
  const status = overrides.status ?? QueueStatus.WAITING;

  return new QueueEntry(
    'queue-1',
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

function chair(overrides: Partial<Chair['properties']> = {}): Chair {
  return new Chair({
    id: 'chair-1',
    clinicId: 'clinic-1',
    name: 'Operatory 1',
    code: 'OP-1',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

describe(AppointmentGrpcMapper.name, () => {
  it('maps queue chair assignment and manual order fields', () => {
    const reply = AppointmentGrpcMapper.toQueueEntryReply(
      queueEntry({
        status: QueueStatus.IN_CHAIR,
        chairId: 'chair-1',
        chairName: 'Operatory 1',
        manualOrder: 3,
      }),
    );

    expect(reply).toEqual(
      expect.objectContaining({
        chairId: 'chair-1',
        chairName: 'Operatory 1',
        manualOrder: 3,
        seatedAt: now.toISOString(),
      }),
    );
  });

  it('maps waiting-room state with chair availability', () => {
    const reply = AppointmentGrpcMapper.toWaitingRoomStateReply({
      entries: [
        queueEntry({
          status: QueueStatus.IN_CHAIR,
          chairId: 'chair-1',
          chairName: 'Operatory 1',
        }),
      ],
      chairs: [
        {
          chair: chair(),
          isAvailable: false,
          occupiedByEntryId: 'queue-1',
        },
      ],
      ordering: {
        mode: 'MANUAL',
        manualStatuses: [QueueStatus.IN_CHAIR],
      },
      generatedAt: now,
    });

    expect(reply.chairs).toEqual([
      expect.objectContaining({
        id: 'chair-1',
        isAvailable: false,
        occupiedByEntryId: 'queue-1',
      }),
    ]);
    expect(reply.ordering).toEqual({
      mode: 'MANUAL',
      manualStatuses: [QueueStatus.IN_CHAIR],
    });
    expect(reply.generatedAt).toBe(now.toISOString());
  });
});
