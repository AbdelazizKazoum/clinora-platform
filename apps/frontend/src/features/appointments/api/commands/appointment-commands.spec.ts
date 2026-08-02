import type { AxiosResponse } from 'axios';

import { apiClient } from '@/lib/api';

import type { AppointmentResponseDto, QueueEntryResponseDto } from '../dto';
import { cancelAppointment } from './cancel-appointment';
import { checkInAppointment } from './check-in-appointment';
import { createAppointment } from './create-appointment';
import { rescheduleAppointment } from './reschedule-appointment';
import { updateAppointment } from './update-appointment';

jest.mock('@/lib/api', () => ({
  apiClient: {
    patch: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
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
  patientPhone: '',
  doctorId: 'doctor-1',
  doctorName: 'Dr. Salma El Mansouri',
  startAt: '2026-08-03T09:00:00.000Z',
  endAt: '2026-08-03T09:30:00.000Z',
  isEmergency: false,
  type: '',
  channel: 'PHONE',
  status: 'CONFIRMED',
  notes: '',
  cancelledAt: '',
  cancellationReason: '',
  createdBy: '',
  createdAt: '2026-08-01T09:00:00.000Z',
  updatedAt: '2026-08-01T09:15:00.000Z',
};

const queueEntryResponse: QueueEntryResponseDto = {
  id: 'queue-entry-1',
  clinicId: 'clinic A/1',
  appointmentId: 'appointment-1',
  patientId: 'patient-1',
  patientName: 'Sara Amrani',
  patientPhone: '',
  doctorId: 'doctor-1',
  doctorName: 'Dr. Salma El Mansouri',
  appointmentType: '',
  status: 'ARRIVED',
  priority: 'NORMAL',
  queueNotes: '',
  arrivedAt: '2026-08-03T08:55:00.000Z',
  calledAt: '',
  seatedAt: '',
  completedAt: '',
  updatedAt: '2026-08-03T08:55:00.000Z',
};

describe('appointment commands', () => {
  const apiClientPatch = jest.mocked(apiClient.patch);
  const apiClientPost = jest.mocked(apiClient.post);
  const apiClientPut = jest.mocked(apiClient.put);

  beforeEach(() => {
    apiClientPatch.mockReset();
    apiClientPost.mockReset();
    apiClientPut.mockReset();
  });

  it('creates an appointment with a Gateway-compatible body', async () => {
    apiClientPost.mockResolvedValue(createAxiosResponse(appointmentResponse));

    const appointment = await createAppointment({
      clinicId: 'clinic A/1',
      patientId: 'patient-1',
      patientName: 'Sara Amrani',
      patientPhone: null,
      doctorId: 'doctor-1',
      doctorName: 'Dr. Salma El Mansouri',
      startAt: new Date('2026-08-03T09:00:00.000Z'),
      endAt: new Date('2026-08-03T09:30:00.000Z'),
      isEmergency: false,
      type: 'Consultation',
      channel: 'PHONE',
      notes: null,
    });

    expect(apiClientPost).toHaveBeenCalledWith(
      '/clinics/clinic%20A%2F1/appointments',
      {
        patientId: 'patient-1',
        patientName: 'Sara Amrani',
        patientPhone: undefined,
        doctorId: 'doctor-1',
        doctorName: 'Dr. Salma El Mansouri',
        startAt: '2026-08-03T09:00:00.000Z',
        endAt: '2026-08-03T09:30:00.000Z',
        isEmergency: false,
        type: 'Consultation',
        channel: 'PHONE',
        status: undefined,
        notes: undefined,
      },
    );
    expect(appointment.id).toBe('appointment-1');
  });

  it('updates an appointment and sends empty strings for cleared fields', async () => {
    apiClientPut.mockResolvedValue(createAxiosResponse(appointmentResponse));

    await updateAppointment({
      clinicId: 'clinic A/1',
      appointmentId: 'appointment A/1',
      type: null,
      notes: null,
      startAt: new Date('2026-08-03T10:00:00.000Z'),
      endAt: new Date('2026-08-03T10:45:00.000Z'),
      status: 'PENDING',
    });

    expect(apiClientPut).toHaveBeenCalledWith(
      '/clinics/clinic%20A%2F1/appointments/appointment%20A%2F1',
      expect.objectContaining({
        type: '',
        notes: '',
        startAt: '2026-08-03T10:00:00.000Z',
        endAt: '2026-08-03T10:45:00.000Z',
        status: 'PENDING',
      }),
    );
  });

  it('reschedules appointment timing through the timing endpoint', async () => {
    apiClientPatch.mockResolvedValue(createAxiosResponse(appointmentResponse));

    await rescheduleAppointment({
      clinicId: 'clinic A/1',
      appointmentId: 'appointment A/1',
      doctorId: 'doctor-2',
      doctorName: null,
      newStartAt: new Date('2026-08-03T11:00:00.000Z'),
      newEndAt: new Date('2026-08-03T11:30:00.000Z'),
    });

    expect(apiClientPatch).toHaveBeenCalledWith(
      '/clinics/clinic%20A%2F1/appointments/appointment%20A%2F1/timing',
      {
        doctorId: 'doctor-2',
        doctorName: undefined,
        newStartAt: '2026-08-03T11:00:00.000Z',
        newEndAt: '2026-08-03T11:30:00.000Z',
      },
    );
  });

  it('cancels an appointment with status and cancellation fields', async () => {
    apiClientPut.mockResolvedValue(createAxiosResponse(appointmentResponse));

    await cancelAppointment({
      clinicId: 'clinic A/1',
      appointmentId: 'appointment A/1',
      cancelledAt: new Date('2026-08-03T12:00:00.000Z'),
      cancellationReason: 'Patient called.',
    });

    expect(apiClientPut).toHaveBeenCalledWith(
      '/clinics/clinic%20A%2F1/appointments/appointment%20A%2F1',
      {
        status: 'CANCELLED',
        cancelledAt: '2026-08-03T12:00:00.000Z',
        cancellationReason: 'Patient called.',
      },
    );
  });

  it('checks in an appointment through the clinic queue endpoint', async () => {
    apiClientPost.mockResolvedValue(createAxiosResponse(queueEntryResponse));

    await expect(
      checkInAppointment({
        clinicId: 'clinic A/1',
        appointmentId: 'appointment-1',
        patientId: 'patient-1',
        patientName: 'Sara Amrani',
        patientPhone: null,
        doctorId: 'doctor-1',
        doctorName: 'Dr. Salma El Mansouri',
        appointmentType: 'Consultation',
        priority: 'URGENT',
        queueNotes: 'Needs assistance.',
        arrivedAt: new Date('2026-08-03T08:55:00.000Z'),
      }),
    ).resolves.toMatchObject({
      id: 'queue-entry-1',
      status: 'ARRIVED',
    });

    expect(apiClientPost).toHaveBeenCalledWith('/clinics/clinic%20A%2F1/queue', {
      appointmentId: 'appointment-1',
      patientId: 'patient-1',
      patientName: 'Sara Amrani',
      patientPhone: undefined,
      doctorId: 'doctor-1',
      doctorName: 'Dr. Salma El Mansouri',
      appointmentType: 'Consultation',
      priority: 'URGENT',
      queueNotes: 'Needs assistance.',
      arrivedAt: '2026-08-03T08:55:00.000Z',
    });
  });
});
