import { useQuery } from '@tanstack/react-query';

import {
  checkAppointmentConflicts,
  getAppointment,
  listAppointments,
} from '../../api';
import { appointmentQueryKeys } from '../../model';
import { useAppointment } from './use-appointment';
import { useAppointmentConflicts } from './use-appointment-conflicts';
import { useAppointments } from './use-appointments';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('../../api', () => ({
  checkAppointmentConflicts: jest.fn(),
  getAppointment: jest.fn(),
  listAppointments: jest.fn(),
}));

const useQueryMock = jest.mocked(useQuery);

describe('appointment query hooks', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue({} as never);
  });

  it('uses list query keys scoped by clinic, range, and filters', async () => {
    const query = {
      clinicId: 'clinic-a',
      doctorId: 'doctor-1',
      endDate: new Date('2026-08-04T00:00:00.000Z'),
      page: 1,
      startDate: new Date('2026-08-03T00:00:00.000Z'),
      status: 'CONFIRMED' as const,
    };

    useAppointments(query);

    const options = useQueryMock.mock.calls[0]?.[0] as {
      enabled: boolean;
      queryFn: () => Promise<unknown>;
      queryKey: readonly unknown[];
    };

    expect(options).toMatchObject({
      enabled: true,
      queryKey: appointmentQueryKeys.list(query),
    });

    await options.queryFn();

    expect(listAppointments).toHaveBeenCalledWith(query);
  });

  it('disables appointment list loading without a clinic ID', () => {
    useAppointments(null);

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('uses detail query keys for appointment details', async () => {
    useAppointment({ appointmentId: 'appointment-1', clinicId: 'clinic-a' });

    const options = useQueryMock.mock.calls[0]?.[0] as {
      enabled: boolean;
      queryFn: () => Promise<unknown>;
      queryKey: readonly unknown[];
    };

    expect(options).toMatchObject({
      enabled: true,
      queryKey: appointmentQueryKeys.detail('clinic-a', 'appointment-1'),
    });

    await options.queryFn();

    expect(getAppointment).toHaveBeenCalledWith({
      appointmentId: 'appointment-1',
      clinicId: 'clinic-a',
    });
  });

  it('uses conflict query keys scoped by proposed timing', async () => {
    const query = {
      clinicId: 'clinic-a',
      doctorId: 'doctor-1',
      startAt: new Date('2026-08-03T09:00:00.000Z'),
      endAt: new Date('2026-08-03T09:30:00.000Z'),
      excludeAppointmentId: 'appointment-1',
    };

    useAppointmentConflicts(query);

    const options = useQueryMock.mock.calls[0]?.[0] as {
      enabled: boolean;
      queryFn: () => Promise<unknown>;
      queryKey: readonly unknown[];
    };

    expect(options).toMatchObject({
      enabled: true,
      queryKey: appointmentQueryKeys.conflict(query),
    });

    await options.queryFn();

    expect(checkAppointmentConflicts).toHaveBeenCalledWith(query);
  });
});
