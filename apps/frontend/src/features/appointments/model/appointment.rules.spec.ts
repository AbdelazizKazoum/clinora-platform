import type { Appointment } from './appointment';
import {
  appointmentsOverlap,
  calculateDurationMinutes,
  calculateEndAtFromDuration,
  canCheckInAppointment,
  isBlockingAppointment,
  isBlockingOverlap,
  isValidAppointmentTiming,
} from './appointment.rules';

const date = (value: string) => new Date(value);

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
  startAt: date('2026-08-03T09:00:00.000Z'),
  endAt: date('2026-08-03T09:30:00.000Z'),
  isEmergency: false,
  type: 'Consultation',
  channel: 'PHONE',
  status: 'CONFIRMED',
  notes: null,
  cancelledAt: null,
  cancellationReason: null,
  createdBy: 'user-1',
  createdAt: date('2026-08-01T09:00:00.000Z'),
  updatedAt: date('2026-08-01T09:00:00.000Z'),
  ...overrides,
});

describe('appointment timing rules', () => {
  it('accepts appointment timing only when end is after start', () => {
    expect(
      isValidAppointmentTiming(
        date('2026-08-03T09:00:00.000Z'),
        date('2026-08-03T09:30:00.000Z'),
      ),
    ).toBe(true);
    expect(
      isValidAppointmentTiming(
        date('2026-08-03T09:00:00.000Z'),
        date('2026-08-03T09:00:00.000Z'),
      ),
    ).toBe(false);
    expect(
      isValidAppointmentTiming(
        date('2026-08-03T09:30:00.000Z'),
        date('2026-08-03T09:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it('rejects invalid dates as appointment timing', () => {
    expect(
      isValidAppointmentTiming(
        new Date(Number.NaN),
        date('2026-08-03T09:30:00.000Z'),
      ),
    ).toBe(false);
  });

  it('calculates end time from a selected duration', () => {
    expect(
      calculateEndAtFromDuration(
        date('2026-08-03T09:00:00.000Z'),
        45,
      ).toISOString(),
    ).toBe('2026-08-03T09:45:00.000Z');
  });

  it('rejects non-positive duration values', () => {
    expect(() =>
      calculateEndAtFromDuration(date('2026-08-03T09:00:00.000Z'), 0),
    ).toThrow(RangeError);
  });

  it('calculates duration from start and end time', () => {
    expect(
      calculateDurationMinutes(
        date('2026-08-03T09:00:00.000Z'),
        date('2026-08-03T10:30:00.000Z'),
      ),
    ).toBe(90);
  });
});

describe('appointment overlap rules', () => {
  it('identifies true overlapping appointment windows', () => {
    expect(
      appointmentsOverlap(
        date('2026-08-03T09:00:00.000Z'),
        date('2026-08-03T09:30:00.000Z'),
        date('2026-08-03T09:15:00.000Z'),
        date('2026-08-03T09:45:00.000Z'),
      ),
    ).toBe(true);
  });

  it('allows exact back-to-back appointment windows', () => {
    expect(
      appointmentsOverlap(
        date('2026-08-03T09:00:00.000Z'),
        date('2026-08-03T09:30:00.000Z'),
        date('2026-08-03T09:30:00.000Z'),
        date('2026-08-03T10:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it('treats cancelled and no-show appointments as non-blocking', () => {
    expect(isBlockingAppointment(makeAppointment({ status: 'CANCELLED' }))).toBe(
      false,
    );
    expect(isBlockingAppointment(makeAppointment({ status: 'NO_SHOW' }))).toBe(
      false,
    );
    expect(isBlockingAppointment(makeAppointment({ status: 'CONFIRMED' }))).toBe(
      true,
    );
  });

  it('blocks overlapping active appointments', () => {
    expect(
      isBlockingOverlap(
        makeAppointment({ status: 'PENDING' }),
        date('2026-08-03T09:15:00.000Z'),
        date('2026-08-03T09:45:00.000Z'),
      ),
    ).toBe(true);
  });

  it('does not block cancelled or no-show overlaps', () => {
    expect(
      isBlockingOverlap(
        makeAppointment({ status: 'CANCELLED' }),
        date('2026-08-03T09:15:00.000Z'),
        date('2026-08-03T09:45:00.000Z'),
      ),
    ).toBe(false);
    expect(
      isBlockingOverlap(
        makeAppointment({ status: 'NO_SHOW' }),
        date('2026-08-03T09:15:00.000Z'),
        date('2026-08-03T09:45:00.000Z'),
      ),
    ).toBe(false);
  });

  it('allows emergency appointments to bypass proactive blocking checks', () => {
    expect(
      isBlockingOverlap(
        makeAppointment({ status: 'CONFIRMED' }),
        date('2026-08-03T09:15:00.000Z'),
        date('2026-08-03T09:45:00.000Z'),
        { allowEmergencyOverride: true },
      ),
    ).toBe(false);
  });
});

describe('appointment check-in rules', () => {
  it('allows pending and confirmed appointments to be checked in', () => {
    expect(canCheckInAppointment(makeAppointment({ status: 'PENDING' }))).toBe(
      true,
    );
    expect(canCheckInAppointment(makeAppointment({ status: 'CONFIRMED' }))).toBe(
      true,
    );
  });

  it('prevents terminal or missed appointments from being checked in', () => {
    expect(canCheckInAppointment(makeAppointment({ status: 'COMPLETED' }))).toBe(
      false,
    );
    expect(canCheckInAppointment(makeAppointment({ status: 'CANCELLED' }))).toBe(
      false,
    );
    expect(canCheckInAppointment(makeAppointment({ status: 'NO_SHOW' }))).toBe(
      false,
    );
  });
});
