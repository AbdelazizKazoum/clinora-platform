import type {
  AppointmentResponseDto,
  AppointmentsListResponseDto,
} from '../api/dto';
import {
  mapAppointmentFromDto,
  mapAppointmentsListFromDto,
  mapCheckInAppointmentCommandToDto,
} from './appointment.mapper';

const createAppointmentDto = (
  overrides: Partial<AppointmentResponseDto> = {},
): AppointmentResponseDto => ({
  id: 'appointment-1',
  clinicId: 'clinic-1',
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
  notes: 'Arrive 10 minutes early.',
  cancelledAt: '',
  cancellationReason: '',
  createdBy: 'user-1',
  createdAt: '2026-08-01T09:00:00.000Z',
  updatedAt: '2026-08-01T09:15:00.000Z',
  ...overrides,
});

describe('appointment mappers', () => {
  it('maps appointment transport fields into the frontend model', () => {
    const appointment = mapAppointmentFromDto(createAppointmentDto());

    expect(appointment).toMatchObject({
      id: 'appointment-1',
      clinicId: 'clinic-1',
      patientId: 'patient-1',
      patientName: 'Sara Amrani',
      patientPhone: '+212600000000',
      doctorId: 'doctor-1',
      doctorName: 'Dr. Salma El Mansouri',
      isEmergency: false,
      type: 'Consultation',
      channel: 'PHONE',
      status: 'CONFIRMED',
      notes: 'Arrive 10 minutes early.',
      cancelledAt: null,
      cancellationReason: null,
      createdBy: 'user-1',
    });
    expect(appointment.startAt).toEqual(
      new Date('2026-08-03T09:00:00.000Z'),
    );
    expect(appointment.endAt).toEqual(new Date('2026-08-03T09:30:00.000Z'));
    expect(appointment.createdAt).toEqual(
      new Date('2026-08-01T09:00:00.000Z'),
    );
    expect(appointment.updatedAt).toEqual(
      new Date('2026-08-01T09:15:00.000Z'),
    );
  });

  it('maps empty optional appointment response strings to null', () => {
    const appointment = mapAppointmentFromDto(
      createAppointmentDto({
        patientPhone: '',
        type: '',
        notes: '',
        cancelledAt: '',
        cancellationReason: '',
        createdBy: '',
      }),
    );

    expect(appointment.patientPhone).toBeNull();
    expect(appointment.type).toBeNull();
    expect(appointment.notes).toBeNull();
    expect(appointment.cancelledAt).toBeNull();
    expect(appointment.cancellationReason).toBeNull();
    expect(appointment.createdBy).toBeNull();
  });

  it('maps non-empty optional date strings to Date instances', () => {
    const appointment = mapAppointmentFromDto(
      createAppointmentDto({
        cancelledAt: '2026-08-03T10:00:00.000Z',
      }),
    );

    expect(appointment.cancelledAt).toEqual(
      new Date('2026-08-03T10:00:00.000Z'),
    );
  });

  it('maps appointment list responses and preserves total count', () => {
    const dto: AppointmentsListResponseDto = {
      appointments: [
        createAppointmentDto({ id: 'appointment-1' }),
        createAppointmentDto({ id: 'appointment-2' }),
      ],
      total: 12,
    };

    expect(mapAppointmentsListFromDto(dto)).toMatchObject({
      appointments: [{ id: 'appointment-1' }, { id: 'appointment-2' }],
      total: 12,
    });
  });

  it('maps check-in command fields into the Gateway body', () => {
    expect(
      mapCheckInAppointmentCommandToDto({
        clinicId: 'clinic-1',
        appointmentId: 'appointment-1',
        patientId: 'patient-1',
        patientName: 'Sara Amrani',
        patientPhone: null,
        doctorId: 'doctor-1',
        doctorName: 'Dr. Salma El Mansouri',
        appointmentType: 'Consultation',
        priority: 'URGENT',
        queueNotes: null,
        arrivedAt: new Date('2026-08-03T08:55:00.000Z'),
      }),
    ).toEqual({
      appointmentId: 'appointment-1',
      patientId: 'patient-1',
      patientName: 'Sara Amrani',
      patientPhone: undefined,
      doctorId: 'doctor-1',
      doctorName: 'Dr. Salma El Mansouri',
      appointmentType: 'Consultation',
      priority: 'URGENT',
      queueNotes: undefined,
      arrivedAt: '2026-08-03T08:55:00.000Z',
    });
  });
});
