import type { AxiosResponse } from 'axios';

import { apiClient } from '@/lib/api';

import type {
  AppointmentResponseDto,
  AppointmentsListResponseDto,
  ConflictResponseDto,
} from '../dto';
import { checkAppointmentConflicts } from './check-appointment-conflicts';
import { getAppointment } from './get-appointment';
import { listAppointments } from './list-appointments';

jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const createAxiosResponse = <TData>(data: TData): AxiosResponse<TData> =>
  ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  }) as AxiosResponse<TData>;

const appointmentResponse: AppointmentResponseDto = {
  id: 'appointment-1',
  clinicId: 'clinic A/1',
  patientId: 'patient-1',
  patientName: 'Sara Amrani',
  patientPhone: '+212600000000',
  doctorId: 'doctor-1',
  doctorName: 'Dr. Salma El Mansouri',
  startAt: '2026-08-03T09:00:00.000Z',
  endAt: '2026-08-03T09:30:00.000Z',
  isEmergency: false,
  type: 'Consultation',
  channel: 'PHONE',
  status: 'CONFIRMED',
  notes: '',
  cancelledAt: '',
  cancellationReason: '',
  createdBy: '',
  createdAt: '2026-08-01T09:00:00.000Z',
  updatedAt: '2026-08-01T09:15:00.000Z',
};

describe('appointment queries', () => {
  const apiClientGet = jest.mocked(apiClient.get);

  beforeEach(() => {
    apiClientGet.mockReset();
  });

  it('lists appointments with ISO date range params', async () => {
    const response: AppointmentsListResponseDto = {
      appointments: [appointmentResponse],
      total: 1,
    };
    apiClientGet.mockResolvedValue(createAxiosResponse(response));

    const result = await listAppointments({
      clinicId: 'clinic A/1',
      page: 2,
      limit: 75,
      startDate: new Date('2026-08-03T00:00:00.000Z'),
      endDate: new Date('2026-08-04T00:00:00.000Z'),
      doctorId: 'doctor-1',
      status: 'CONFIRMED',
    });

    expect(apiClientGet).toHaveBeenCalledWith(
      '/clinics/clinic%20A%2F1/appointments',
      {
        params: {
          page: 2,
          limit: 75,
          startDate: '2026-08-03T00:00:00.000Z',
          endDate: '2026-08-04T00:00:00.000Z',
          doctorId: 'doctor-1',
          status: 'CONFIRMED',
        },
      },
    );
    expect(result).toMatchObject({
      appointments: [{ id: 'appointment-1', notes: null }],
      total: 1,
    });
  });

  it('gets one appointment by clinic and appointment ID', async () => {
    apiClientGet.mockResolvedValue(createAxiosResponse(appointmentResponse));

    const appointment = await getAppointment({
      clinicId: 'clinic A/1',
      appointmentId: 'appointment A/1',
    });

    expect(apiClientGet).toHaveBeenCalledWith(
      '/clinics/clinic%20A%2F1/appointments/appointment%20A%2F1',
    );
    expect(appointment.startAt).toEqual(
      new Date('2026-08-03T09:00:00.000Z'),
    );
  });

  it('checks conflicts with proposed timing params', async () => {
    const response: ConflictResponseDto = { hasConflict: true };
    apiClientGet.mockResolvedValue(createAxiosResponse(response));

    await expect(
      checkAppointmentConflicts({
        clinicId: 'clinic A/1',
        doctorId: 'doctor-1',
        startAt: new Date('2026-08-03T09:00:00.000Z'),
        endAt: new Date('2026-08-03T09:30:00.000Z'),
        excludeStatus: 'CANCELLED',
        excludeAppointmentId: 'appointment-1',
      }),
    ).resolves.toEqual({ hasConflict: true });

    expect(apiClientGet).toHaveBeenCalledWith(
      '/clinics/clinic%20A%2F1/appointments/conflicts',
      {
        params: {
          doctorId: 'doctor-1',
          startAt: '2026-08-03T09:00:00.000Z',
          endAt: '2026-08-03T09:30:00.000Z',
          excludeStatus: 'CANCELLED',
          excludeAppointmentId: 'appointment-1',
        },
      },
    );
  });
});
