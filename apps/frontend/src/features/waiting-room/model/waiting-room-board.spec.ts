import type { WaitingRoomEntry } from './waiting-room';
import {
  filterWaitingRoomEntries,
  getWaitingRoomDoctorOptions,
  getWaitingRoomPatientInitials,
  getWaitingRoomSummary,
  groupWaitingRoomEntriesByStatus,
  projectWaitingRoomBoardMove,
} from './waiting-room-board';

const createEntry = (
  overrides: Partial<WaitingRoomEntry> = {},
): WaitingRoomEntry => ({
  id: 'entry-1',
  clinicId: 'clinic-1',
  appointmentId: 'appointment-1',
  patientId: 'patient-1',
  patientName: 'Sara Amrani',
  patientPhone: '+212600000001',
  doctorId: 'doctor-1',
  doctorName: 'Dr. Karim Alaoui',
  appointmentType: 'Consultation',
  status: 'WAITING',
  priority: 'NORMAL',
  queueNotes: null,
  chairId: null,
  chairName: null,
  manualOrder: null,
  arrivedAt: new Date('2026-08-05T08:00:00.000Z'),
  calledAt: new Date('2026-08-05T08:05:00.000Z'),
  seatedAt: null,
  completedAt: null,
  updatedAt: new Date('2026-08-05T08:05:00.000Z'),
  ...overrides,
});

describe('waiting-room board projection', () => {
  it('filters across operational fields without changing server order', () => {
    const first = createEntry({ id: 'entry-1', patientName: 'Sara Amrani' });
    const second = createEntry({
      id: 'entry-2',
      patientName: 'Youssef Idrissi',
      priority: 'URGENT',
      queueNotes: 'Wheelchair assistance',
    });

    expect(
      filterWaitingRoomEntries([first, second], {
        doctorId: 'ALL',
        priority: 'URGENT',
        search: 'wheelchair',
      }),
    ).toEqual([second]);
    expect(
      filterWaitingRoomEntries([second, first], {
        doctorId: 'ALL',
        priority: 'ALL',
        search: '',
      }),
    ).toEqual([second, first]);
  });

  it('groups entries and counts each queue status', () => {
    const entries = [
      createEntry({ id: 'arrived', status: 'ARRIVED' }),
      createEntry({ id: 'waiting', status: 'WAITING' }),
      createEntry({ id: 'done', status: 'DONE' }),
    ];

    expect(groupWaitingRoomEntriesByStatus(entries).WAITING).toHaveLength(1);
    expect(getWaitingRoomSummary(entries)).toEqual({
      ARRIVED: 1,
      WAITING: 1,
      IN_CHAIR: 0,
      DONE: 1,
    });
  });

  it('builds stable doctor filters and patient initials', () => {
    const entries = [
      createEntry({ doctorId: 'doctor-2', doctorName: 'Dr. Zineb Bennani' }),
      createEntry({ doctorId: 'doctor-1', doctorName: 'Dr. Amal Farah' }),
      createEntry({ doctorId: 'doctor-1', doctorName: 'Dr. Amal Farah' }),
    ];

    expect(getWaitingRoomDoctorOptions(entries)).toEqual([
      { id: 'doctor-1', name: 'Dr. Amal Farah' },
      { id: 'doctor-2', name: 'Dr. Zineb Bennani' },
    ]);
    expect(getWaitingRoomPatientInitials('  Sara   Amrani El Idrissi ')).toBe(
      'SA',
    );
  });

  it('projects same-column manual order without mutating source entries', () => {
    const first = createEntry({ id: 'entry-1' });
    const second = createEntry({ id: 'entry-2' });

    const move = projectWaitingRoomBoardMove([first, second], {
      destinationIndex: 0,
      destinationStatus: 'WAITING',
      entryId: second.id,
      sourceIndex: 1,
      sourceStatus: 'WAITING',
    });

    expect(move?.destinationOrderedEntryIds).toEqual(['entry-2', 'entry-1']);
    expect(move?.entries.map((entry) => [entry.id, entry.manualOrder])).toEqual(
      [
        ['entry-2', 1],
        ['entry-1', 2],
      ],
    );
    expect(first.manualOrder).toBeNull();
    expect(second.manualOrder).toBeNull();
  });

  it('projects cross-column movement and complete destination order', () => {
    const arrived = createEntry({ id: 'arrived', status: 'ARRIVED' });
    const firstWaiting = createEntry({ id: 'waiting-1' });
    const secondWaiting = createEntry({ id: 'waiting-2' });

    const move = projectWaitingRoomBoardMove(
      [arrived, firstWaiting, secondWaiting],
      {
        destinationIndex: 1,
        destinationStatus: 'WAITING',
        entryId: arrived.id,
        sourceIndex: 0,
        sourceStatus: 'ARRIVED',
      },
    );

    expect(move?.destinationOrderedEntryIds).toEqual([
      'waiting-1',
      'arrived',
      'waiting-2',
    ]);
    expect(
      move?.entries.find((entry) => entry.id === arrived.id),
    ).toMatchObject({
      status: 'WAITING',
      manualOrder: 2,
    });
  });
});
