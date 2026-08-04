import type {
  WaitingRoomChair,
  WaitingRoomEntry,
  WaitingRoomState,
} from './waiting-room';
import {
  applyWaitingRoomEventToChairs,
  applyWaitingRoomEventToState,
} from './waiting-room-cache';

const now = new Date('2026-08-04T08:00:00.000Z');

const entry = (
  overrides: Partial<WaitingRoomEntry> = {},
): WaitingRoomEntry => ({
  id: 'queue-1',
  clinicId: 'clinic-1',
  appointmentId: 'appointment-1',
  patientId: 'patient-1',
  patientName: 'Sara Amrani',
  patientPhone: null,
  doctorId: 'doctor-1',
  doctorName: 'Dr. Salma El Mansouri',
  appointmentType: null,
  status: 'WAITING',
  priority: 'NORMAL',
  queueNotes: null,
  chairId: null,
  chairName: null,
  manualOrder: null,
  arrivedAt: now,
  calledAt: null,
  seatedAt: null,
  completedAt: null,
  updatedAt: now,
  ...overrides,
});

const chair = (
  overrides: Partial<WaitingRoomChair> = {},
): WaitingRoomChair => ({
  id: 'chair-1',
  clinicId: 'clinic-1',
  name: 'Operatory 1',
  code: null,
  isActive: true,
  isAvailable: true,
  occupiedByEntryId: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const state = (
  overrides: Partial<WaitingRoomState> = {},
): WaitingRoomState => ({
  entries: [entry()],
  chairs: [chair()],
  ordering: {
    mode: 'AUTO',
    manualStatuses: [],
  },
  generatedAt: now,
  ...overrides,
});

describe('waiting-room cache reconciliation', () => {
  it('upserts entry events into waiting-room state', () => {
    const result = applyWaitingRoomEventToState(state(), {
      type: 'queue.status.updated',
      clinicId: 'clinic-1',
      entry: entry({
        status: 'IN_CHAIR',
        chairId: 'chair-1',
        chairName: 'Operatory 1',
      }),
    });

    expect(result?.entries).toHaveLength(1);
    expect(result?.entries[0]).toMatchObject({
      status: 'IN_CHAIR',
      chairId: 'chair-1',
    });
  });

  it('replaces reordered status entries without dropping other columns', () => {
    const result = applyWaitingRoomEventToState(
      state({
        entries: [
          entry({ id: 'queue-1', status: 'WAITING' }),
          entry({ id: 'queue-2', status: 'WAITING' }),
          entry({ id: 'queue-3', status: 'IN_CHAIR' }),
        ],
      }),
      {
        type: 'queue.reordered',
        clinicId: 'clinic-1',
        status: 'WAITING',
        entries: [
          entry({ id: 'queue-2', status: 'WAITING', manualOrder: 1 }),
          entry({ id: 'queue-1', status: 'WAITING', manualOrder: 2 }),
        ],
      },
    );

    expect(result?.entries.map((candidate) => candidate.id)).toEqual([
      'queue-3',
      'queue-2',
      'queue-1',
    ]);
    expect(result?.ordering).toEqual({
      mode: 'MANUAL',
      manualStatuses: ['WAITING'],
    });
  });

  it('restores automatic ordering metadata from reorder events', () => {
    const result = applyWaitingRoomEventToState(
      state({
        entries: [entry({ manualOrder: 1 })],
        ordering: { mode: 'MANUAL', manualStatuses: ['WAITING'] },
      }),
      {
        type: 'queue.reordered',
        clinicId: 'clinic-1',
        entries: [entry({ manualOrder: null })],
      },
    );

    expect(result?.ordering).toEqual({
      mode: 'AUTO',
      manualStatuses: [],
    });
  });

  it('upserts chair events into state and chair list caches', () => {
    const updatedChair = chair({ name: 'Operatory 1A', isAvailable: false });
    const event = {
      type: 'queue.chair.updated' as const,
      clinicId: 'clinic-1',
      chair: updatedChair,
    };

    expect(
      applyWaitingRoomEventToState(state(), event)?.chairs[0],
    ).toMatchObject({
      name: 'Operatory 1A',
      isAvailable: false,
    });
    expect(applyWaitingRoomEventToChairs([chair()], event)?.[0]).toMatchObject({
      name: 'Operatory 1A',
    });
  });
});
