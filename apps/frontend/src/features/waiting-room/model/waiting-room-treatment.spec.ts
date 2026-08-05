import type { WaitingRoomEntry } from './waiting-room';
import {
  buildWaitingRoomTreatmentPath,
  getWaitingRoomTreatmentContext,
} from './waiting-room-treatment';

const entry = (
  overrides: Partial<WaitingRoomEntry> = {},
): WaitingRoomEntry => ({
  id: 'queue entry/1',
  clinicId: 'clinic-1',
  appointmentId: 'appointment-1',
  patientId: 'patient-1',
  patientName: 'Sara Amrani',
  patientPhone: null,
  doctorId: 'doctor-1',
  doctorName: 'Dr. Karim Alaoui',
  appointmentType: 'Consultation',
  status: 'IN_CHAIR',
  priority: 'NORMAL',
  queueNotes: null,
  chairId: 'chair-1',
  chairName: 'Operatory 1',
  manualOrder: null,
  arrivedAt: new Date('2026-08-05T08:00:00.000Z'),
  calledAt: new Date('2026-08-05T08:05:00.000Z'),
  seatedAt: new Date('2026-08-05T08:10:00.000Z'),
  completedAt: null,
  updatedAt: new Date('2026-08-05T08:10:00.000Z'),
  ...overrides,
});

describe('waiting-room treatment handoff', () => {
  it('builds the complete treatment navigation context', () => {
    expect(getWaitingRoomTreatmentContext(entry())).toEqual({
      appointmentId: 'appointment-1',
      chairId: 'chair-1',
      doctorId: 'doctor-1',
      patientId: 'patient-1',
      queueEntryId: 'queue entry/1',
    });
    expect(buildWaitingRoomTreatmentPath(entry())).toBe(
      '/visits/new?patientId=patient-1&appointmentId=appointment-1&queueEntryId=queue+entry%2F1&chairId=chair-1&doctorId=doctor-1',
    );
  });

  it('does not launch treatment before seating and chair assignment', () => {
    expect(
      buildWaitingRoomTreatmentPath(entry({ status: 'WAITING' })),
    ).toBeNull();
    expect(buildWaitingRoomTreatmentPath(entry({ chairId: null }))).toBeNull();
  });
});
