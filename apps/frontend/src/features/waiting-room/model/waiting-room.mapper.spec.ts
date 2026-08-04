import type {
  QueueStreamEntryDto,
  QueueStreamEventDto,
  WaitingRoomStateResponseDto,
} from '../api/dto';
import {
  mapCreateWaitingRoomChairCommandToDto,
  mapQueueStreamEventFromDto,
  mapUpdateWaitingRoomChairCommandToDto,
  mapUpdateWaitingRoomNotesCommandToDto,
  mapWaitingRoomStateFromDto,
} from './waiting-room.mapper';

const createEntryDto = (
  overrides: Partial<WaitingRoomStateResponseDto['entries'][number]> = {},
): WaitingRoomStateResponseDto['entries'][number] => ({
  id: 'queue-1',
  clinicId: 'clinic-1',
  appointmentId: 'appointment-1',
  patientId: 'patient-1',
  patientName: 'Sara Amrani',
  patientPhone: '',
  doctorId: 'doctor-1',
  doctorName: 'Dr. Salma El Mansouri',
  appointmentType: '',
  status: 'WAITING',
  priority: 'URGENT',
  queueNotes: '',
  chairId: '',
  chairName: '',
  arrivedAt: '2026-08-04T08:00:00.000Z',
  calledAt: '',
  seatedAt: '',
  completedAt: '',
  updatedAt: '2026-08-04T08:05:00.000Z',
  ...overrides,
});

const createStateDto = (
  overrides: Partial<WaitingRoomStateResponseDto> = {},
): WaitingRoomStateResponseDto => ({
  entries: [createEntryDto()],
  chairs: [
    {
      id: 'chair-1',
      clinicId: 'clinic-1',
      name: 'Operatory 1',
      code: '',
      isActive: true,
      isAvailable: false,
      occupiedByEntryId: 'queue-1',
      createdAt: '2026-08-01T08:00:00.000Z',
      updatedAt: '2026-08-02T08:00:00.000Z',
    },
  ],
  ordering: {
    mode: 'MANUAL',
    manualStatuses: ['WAITING'],
  },
  generatedAt: '2026-08-04T08:10:00.000Z',
  ...overrides,
});

const createStreamEntryDto = (
  overrides: Partial<QueueStreamEntryDto> = {},
): QueueStreamEntryDto => ({
  id: 'queue-1',
  clinic_id: 'clinic-1',
  appointment_id: 'appointment-1',
  patient_id: 'patient-1',
  patient_name: 'Sara Amrani',
  doctor_id: 'doctor-1',
  doctor_name: 'Dr. Salma El Mansouri',
  status: 'IN_CHAIR',
  priority: 'NORMAL',
  chair_id: 'chair-1',
  chair_name: 'Operatory 1',
  manual_order: 1,
  arrived_at: '2026-08-04T08:00:00.000Z',
  seated_at: '2026-08-04T08:15:00.000Z',
  updated_at: '2026-08-04T08:15:00.000Z',
  ...overrides,
});

describe('waiting-room mappers', () => {
  it('maps waiting-room state transport fields into frontend models', () => {
    const state = mapWaitingRoomStateFromDto(createStateDto());

    expect(state.entries[0]).toMatchObject({
      id: 'queue-1',
      patientName: 'Sara Amrani',
      patientPhone: null,
      appointmentType: null,
      queueNotes: null,
      chairId: null,
      chairName: null,
      manualOrder: null,
      status: 'WAITING',
      priority: 'URGENT',
    });
    expect(state.entries[0].arrivedAt).toEqual(
      new Date('2026-08-04T08:00:00.000Z'),
    );
    expect(state.entries[0].calledAt).toBeNull();
    expect(state.chairs[0]).toMatchObject({
      id: 'chair-1',
      code: null,
      isAvailable: false,
      occupiedByEntryId: 'queue-1',
    });
    expect(state.ordering).toEqual({
      mode: 'MANUAL',
      manualStatuses: ['WAITING'],
    });
    expect(state.generatedAt).toEqual(new Date('2026-08-04T08:10:00.000Z'));
  });

  it('maps queue stream events into the same waiting-room models', () => {
    const eventDto: QueueStreamEventDto = {
      type: 'queue.chair.assigned',
      clinic_id: 'clinic-1',
      entry: createStreamEntryDto(),
      chair: {
        id: 'chair-1',
        clinic_id: 'clinic-1',
        name: 'Operatory 1',
        code: 'OP-1',
        is_active: true,
        created_at: '2026-08-01T08:00:00.000Z',
        updated_at: '2026-08-02T08:00:00.000Z',
      },
    };

    const event = mapQueueStreamEventFromDto(eventDto);

    expect(event).toMatchObject({
      type: 'queue.chair.assigned',
      clinicId: 'clinic-1',
      entry: {
        id: 'queue-1',
        chairId: 'chair-1',
        chairName: 'Operatory 1',
        manualOrder: 1,
      },
      chair: {
        id: 'chair-1',
        code: 'OP-1',
        isActive: true,
        isAvailable: true,
        occupiedByEntryId: null,
      },
    });
    expect(event.entry?.seatedAt).toEqual(new Date('2026-08-04T08:15:00.000Z'));
  });

  it('maps command models into Gateway request bodies', () => {
    expect(
      mapUpdateWaitingRoomNotesCommandToDto({
        clinicId: 'clinic-1',
        entryId: 'queue-1',
        queueNotes: null,
      }),
    ).toEqual({ queueNotes: '' });
    expect(
      mapCreateWaitingRoomChairCommandToDto({
        clinicId: 'clinic-1',
        name: 'Operatory 1',
        code: null,
      }),
    ).toEqual({
      name: 'Operatory 1',
      code: undefined,
      isActive: undefined,
    });
    expect(
      mapUpdateWaitingRoomChairCommandToDto({
        clinicId: 'clinic-1',
        chairId: 'chair-1',
        code: null,
        isActive: false,
      }),
    ).toEqual({
      name: undefined,
      code: '',
      isActive: false,
    });
  });
});
