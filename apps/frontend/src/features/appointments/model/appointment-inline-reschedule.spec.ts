import type { Appointment } from './appointment';
import {
  buildAppointmentInlineRescheduleCommand,
  executeAppointmentInlineReschedule,
} from './appointment-inline-reschedule';

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

describe('appointment inline reschedule', () => {
  it('preserves the original duration when moving an appointment without an explicit end', () => {
    const command = buildAppointmentInlineRescheduleCommand({
      appointment: makeAppointment(),
      newEndAt: null,
      newStartAt: date('2026-08-03T10:00:00.000Z'),
    });

    expect(command?.newStartAt.toISOString()).toBe(
      '2026-08-03T10:00:00.000Z',
    );
    expect(command?.newEndAt.toISOString()).toBe('2026-08-03T10:30:00.000Z');
  });

  it('uses the resized end time instead of forcing the original duration', () => {
    const command = buildAppointmentInlineRescheduleCommand({
      appointment: makeAppointment(),
      newEndAt: date('2026-08-03T11:00:00.000Z'),
      newStartAt: date('2026-08-03T10:00:00.000Z'),
    });

    expect(command?.newEndAt.toISOString()).toBe('2026-08-03T11:00:00.000Z');
  });

  it('allows an appointment to be resized to the 15-minute minimum', () => {
    const command = buildAppointmentInlineRescheduleCommand({
      appointment: makeAppointment(),
      newEndAt: date('2026-08-03T10:15:00.000Z'),
      newStartAt: date('2026-08-03T10:00:00.000Z'),
    });

    expect(command?.newEndAt.toISOString()).toBe('2026-08-03T10:15:00.000Z');
  });

  it('rejects an appointment resized below the 15-minute minimum', () => {
    const command = buildAppointmentInlineRescheduleCommand({
      appointment: makeAppointment(),
      newEndAt: date('2026-08-03T10:14:00.000Z'),
      newStartAt: date('2026-08-03T10:00:00.000Z'),
    });

    expect(command).toBeNull();
  });

  it('uses a new doctor when resource-aware input supplies one', () => {
    const command = buildAppointmentInlineRescheduleCommand({
      appointment: makeAppointment(),
      newDoctorId: 'doctor-2',
      newDoctorName: 'Dr. Amal Khatib',
      newEndAt: null,
      newStartAt: date('2026-08-03T10:00:00.000Z'),
    });

    expect(command).toMatchObject({
      doctorId: 'doctor-2',
      doctorName: 'Dr. Amal Khatib',
    });
  });

  it('reverts invalid calendar changes', async () => {
    const revert = jest.fn();
    const rescheduleAppointment = jest.fn();

    const result = await executeAppointmentInlineReschedule({
      appointment: makeAppointment(),
      checkConflicts: jest.fn(),
      newEndAt: date('2026-08-03T09:00:00.000Z'),
      newStartAt: date('2026-08-03T10:00:00.000Z'),
      rescheduleAppointment,
      revert,
    });

    expect(result.status).toBe('invalid');
    expect(revert).toHaveBeenCalledTimes(1);
    expect(rescheduleAppointment).not.toHaveBeenCalled();
  });

  it('checks conflicts for non-emergency reschedules and reverts conflicts', async () => {
    const checkConflicts = jest.fn().mockResolvedValue({ hasConflict: true });
    const revert = jest.fn();
    const rescheduleAppointment = jest.fn();

    const result = await executeAppointmentInlineReschedule({
      appointment: makeAppointment(),
      checkConflicts,
      newEndAt: null,
      newStartAt: date('2026-08-03T10:00:00.000Z'),
      rescheduleAppointment,
      revert,
    });

    expect(result.status).toBe('conflict');
    expect(checkConflicts).toHaveBeenCalledWith({
      clinicId: 'clinic-1',
      doctorId: 'doctor-1',
      startAt: date('2026-08-03T10:00:00.000Z'),
      endAt: date('2026-08-03T10:30:00.000Z'),
      excludeAppointmentId: 'appointment-1',
    });
    expect(revert).toHaveBeenCalledTimes(1);
    expect(rescheduleAppointment).not.toHaveBeenCalled();
  });

  it('skips proactive conflict checks for emergency reschedules', async () => {
    const checkConflicts = jest.fn();
    const rescheduleAppointment = jest.fn().mockResolvedValue(undefined);

    const result = await executeAppointmentInlineReschedule({
      appointment: makeAppointment({ isEmergency: true }),
      checkConflicts,
      newEndAt: null,
      newStartAt: date('2026-08-03T10:00:00.000Z'),
      rescheduleAppointment,
      revert: jest.fn(),
    });

    expect(result.status).toBe('rescheduled');
    expect(checkConflicts).not.toHaveBeenCalled();
    expect(rescheduleAppointment).toHaveBeenCalledTimes(1);
  });

  it('reverts mutation failures and rethrows them', async () => {
    const error = new Error('Backend unavailable');
    const revert = jest.fn();

    await expect(
      executeAppointmentInlineReschedule({
        appointment: makeAppointment(),
        checkConflicts: jest.fn().mockResolvedValue({ hasConflict: false }),
        newEndAt: null,
        newStartAt: date('2026-08-03T10:00:00.000Z'),
        rescheduleAppointment: jest.fn().mockRejectedValue(error),
        revert,
      }),
    ).rejects.toThrow(error);

    expect(revert).toHaveBeenCalledTimes(1);
  });
});
