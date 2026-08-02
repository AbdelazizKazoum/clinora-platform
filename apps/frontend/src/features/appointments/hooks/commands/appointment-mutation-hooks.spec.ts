import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Appointment } from '../../model';
import {
  appointmentQueryKeys,
  appointmentQueueQueryKeys,
} from '../../model';
import { useCheckInAppointment } from './use-check-in-appointment';
import { useCreateAppointment } from './use-create-appointment';
import { useUpdateAppointment } from './use-update-appointment';

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../../api', () => ({
  checkInAppointment: jest.fn(),
  createAppointment: jest.fn(),
  updateAppointment: jest.fn(),
}));

const useMutationMock = jest.mocked(useMutation);
const useQueryClientMock = jest.mocked(useQueryClient);

const createAppointmentModel = (
  overrides: Partial<Appointment> = {},
): Appointment => ({
  id: 'appointment-1',
  clinicId: 'clinic-a',
  patientId: 'patient-1',
  patientName: 'Sara Amrani',
  patientPhone: null,
  doctorId: 'doctor-1',
  doctorName: 'Dr. Salma El Mansouri',
  startAt: new Date('2026-08-03T09:00:00.000Z'),
  endAt: new Date('2026-08-03T09:30:00.000Z'),
  isEmergency: false,
  type: null,
  channel: 'PHONE',
  status: 'CONFIRMED',
  notes: null,
  cancelledAt: null,
  cancellationReason: null,
  createdBy: null,
  createdAt: new Date('2026-08-01T09:00:00.000Z'),
  updatedAt: new Date('2026-08-01T09:15:00.000Z'),
  ...overrides,
});

const mutationReturn = {
  error: null,
  isPending: false,
  mutateAsync: jest.fn(),
  reset: jest.fn(),
};

describe('appointment mutation hooks', () => {
  const invalidateQueries = jest.fn();

  beforeEach(() => {
    invalidateQueries.mockReset();
    invalidateQueries.mockResolvedValue(undefined);
    useMutationMock.mockReset();
    useMutationMock.mockReturnValue(mutationReturn as never);
    useQueryClientMock.mockReset();
    useQueryClientMock.mockReturnValue({ invalidateQueries } as never);
  });

  it('invalidates appointment lists after create', async () => {
    useCreateAppointment();

    const options = useMutationMock.mock.calls[0]?.[0] as {
      onSuccess: (appointment: Appointment) => Promise<void>;
    };

    await options.onSuccess(createAppointmentModel());

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: appointmentQueryKeys.lists('clinic-a'),
    });
  });

  it('invalidates appointment list and detail after update', async () => {
    useUpdateAppointment();

    const options = useMutationMock.mock.calls[0]?.[0] as {
      onSuccess: (appointment: Appointment) => Promise<void>;
    };

    await options.onSuccess(createAppointmentModel());

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: appointmentQueryKeys.lists('clinic-a'),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: appointmentQueryKeys.detail('clinic-a', 'appointment-1'),
    });
  });

  it('invalidates queue and appointment state after check-in', async () => {
    useCheckInAppointment();

    const options = useMutationMock.mock.calls[0]?.[0] as {
      onSuccess: (queueEntry: {
        clinicId: string;
        appointmentId: string;
      }) => Promise<void>;
    };

    await options.onSuccess({
      appointmentId: 'appointment-1',
      clinicId: 'clinic-a',
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: appointmentQueueQueryKeys.lists('clinic-a'),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: appointmentQueryKeys.lists('clinic-a'),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: appointmentQueryKeys.detail('clinic-a', 'appointment-1'),
    });
  });
});
