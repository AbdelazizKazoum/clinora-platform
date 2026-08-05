import type { QueryClient } from '@tanstack/react-query';

import { waitingRoomQueryKeys } from '../model';
import {
  getUpdatedEntryIdsFromQueueEvent,
  mergeWaitingRoomStreamEvent,
} from './use-waiting-room-events';

describe(getUpdatedEntryIdsFromQueueEvent.name, () => {
  it('returns unique entry ids for single-entry and reorder events', () => {
    expect(
      getUpdatedEntryIdsFromQueueEvent({
        clinic_id: 'clinic-a',
        type: 'queue.status.updated',
        entry: {
          id: 'queue-1',
          clinic_id: 'clinic-a',
          appointment_id: 'appointment-1',
          patient_id: 'patient-1',
          patient_name: 'Sara Amrani',
          doctor_id: 'doctor-1',
          doctor_name: 'Dr. Salma El Mansouri',
          status: 'WAITING',
          priority: 'NORMAL',
          arrived_at: '2026-08-04T08:00:00.000Z',
          updated_at: '2026-08-04T08:05:00.000Z',
        },
      }),
    ).toEqual(['queue-1']);

    expect(
      getUpdatedEntryIdsFromQueueEvent({
        clinic_id: 'clinic-a',
        type: 'queue.reordered',
        entries: [
          {
            id: 'queue-1',
            clinic_id: 'clinic-a',
            appointment_id: 'appointment-1',
            patient_id: 'patient-1',
            patient_name: 'Sara Amrani',
            doctor_id: 'doctor-1',
            doctor_name: 'Dr. Salma El Mansouri',
            status: 'WAITING',
            priority: 'NORMAL',
            arrived_at: '2026-08-04T08:00:00.000Z',
            updated_at: '2026-08-04T08:05:00.000Z',
          },
          {
            id: 'queue-2',
            clinic_id: 'clinic-a',
            appointment_id: 'appointment-2',
            patient_id: 'patient-2',
            patient_name: 'Omar Tazi',
            doctor_id: 'doctor-1',
            doctor_name: 'Dr. Salma El Mansouri',
            status: 'WAITING',
            priority: 'URGENT',
            arrived_at: '2026-08-04T08:02:00.000Z',
            updated_at: '2026-08-04T08:06:00.000Z',
          },
        ],
      }),
    ).toEqual(['queue-1', 'queue-2']);
  });
});

describe('mergeWaitingRoomStreamEvent', () => {
  it('merges stream events into state and chair caches', () => {
    const queryClient = {
      invalidateQueries: jest.fn(),
      setQueryData: jest.fn(),
    } as unknown as QueryClient;

    mergeWaitingRoomStreamEvent(queryClient, {
      type: 'queue.chair.assigned',
      clinic_id: 'clinic-a',
      entry: {
        id: 'queue-1',
        clinic_id: 'clinic-a',
        appointment_id: 'appointment-1',
        patient_id: 'patient-1',
        patient_name: 'Sara Amrani',
        doctor_id: 'doctor-1',
        doctor_name: 'Dr. Salma El Mansouri',
        status: 'IN_CHAIR',
        priority: 'NORMAL',
        chair_id: 'chair-1',
        chair_name: 'Operatory 1',
        arrived_at: '2026-08-04T08:00:00.000Z',
        seated_at: '2026-08-04T08:15:00.000Z',
        updated_at: '2026-08-04T08:15:00.000Z',
      },
      chair: {
        id: 'chair-1',
        clinic_id: 'clinic-a',
        name: 'Operatory 1',
        is_active: true,
        created_at: '2026-08-01T08:00:00.000Z',
        updated_at: '2026-08-01T08:00:00.000Z',
      },
    });

    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      waitingRoomQueryKeys.state('clinic-a'),
      expect.any(Function),
    );
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      waitingRoomQueryKeys.chairs('clinic-a'),
      expect.any(Function),
    );
  });

  it('invalidates state and chairs after chair update events', () => {
    const queryClient = {
      invalidateQueries: jest.fn(),
      setQueryData: jest.fn(),
    } as unknown as QueryClient;

    mergeWaitingRoomStreamEvent(queryClient, {
      type: 'queue.chair.updated',
      clinic_id: 'clinic-a',
      chair: {
        id: 'chair-1',
        clinic_id: 'clinic-a',
        name: 'Operatory 1A',
        is_active: false,
        created_at: '2026-08-01T08:00:00.000Z',
        updated_at: '2026-08-02T08:00:00.000Z',
      },
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: waitingRoomQueryKeys.state('clinic-a'),
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: waitingRoomQueryKeys.chairs('clinic-a'),
    });
  });
});
