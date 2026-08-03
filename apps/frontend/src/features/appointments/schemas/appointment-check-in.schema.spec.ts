import { ApiError } from '@/lib/api';

import type { Appointment } from '../model';
import {
  createAppointmentCheckInFormValues,
  mapAppointmentCheckInErrorToMessage,
  mapAppointmentCheckInFormToCommand,
} from './appointment-check-in.schema';

const makeAppointment = (
  overrides: Partial<Appointment> = {},
): Appointment => ({
  id: 'appointment-1',
  clinicId: 'clinic-1',
  patientId: 'patient-1',
  patientName: 'Sara Amrani',
  patientPhone: '+212600000000',
  doctorId: 'doctor-1',
  doctorName: 'Dr. Salma El Mansouri',
  startAt: new Date('2026-08-03T09:00:00.000Z'),
  endAt: new Date('2026-08-03T09:30:00.000Z'),
  isEmergency: false,
  type: 'Consultation',
  channel: 'PHONE',
  status: 'CONFIRMED',
  notes: null,
  cancelledAt: null,
  cancellationReason: null,
  createdBy: 'user-1',
  createdAt: new Date('2026-08-01T09:00:00.000Z'),
  updatedAt: new Date('2026-08-01T09:00:00.000Z'),
  ...overrides,
});

describe('appointment check-in schema', () => {
  it('defaults normal appointments to normal queue priority', () => {
    expect(createAppointmentCheckInFormValues(makeAppointment())).toEqual({
      priority: 'NORMAL',
      queueNotes: '',
    });
  });

  it('defaults emergency appointments to emergency queue priority', () => {
    expect(
      createAppointmentCheckInFormValues(
        makeAppointment({ isEmergency: true }),
      ).priority,
    ).toBe('EMERGENCY');
  });

  it('maps an appointment snapshot and form values into a queue command', () => {
    const command = mapAppointmentCheckInFormToCommand(
      makeAppointment(),
      {
        priority: 'URGENT',
        queueNotes: ' Patient arrived early. ',
      },
      new Date('2026-08-03T08:55:00.000Z'),
    );

    expect(command).toEqual({
      clinicId: 'clinic-1',
      appointmentId: 'appointment-1',
      patientId: 'patient-1',
      patientName: 'Sara Amrani',
      patientPhone: '+212600000000',
      doctorId: 'doctor-1',
      doctorName: 'Dr. Salma El Mansouri',
      appointmentType: 'Consultation',
      priority: 'URGENT',
      queueNotes: 'Patient arrived early.',
      arrivedAt: new Date('2026-08-03T08:55:00.000Z'),
    });
  });

  it('maps blank arrival notes to null', () => {
    const command = mapAppointmentCheckInFormToCommand(
      makeAppointment(),
      {
        priority: 'NORMAL',
        queueNotes: '   ',
      },
      new Date('2026-08-03T08:55:00.000Z'),
    );

    expect(command.queueNotes).toBeNull();
  });

  it('maps duplicate queue check-in errors to a clear message', () => {
    expect(
      mapAppointmentCheckInErrorToMessage(
        new ApiError('duplicate queue entry', 409),
      ),
    ).toBe('This appointment has already been checked into the queue.');
  });
});
