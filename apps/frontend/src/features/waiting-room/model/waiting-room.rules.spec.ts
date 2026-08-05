import type { WaitingRoomChair, WaitingRoomEntry } from './waiting-room';
import {
  canLaunchTreatmentFromWaitingRoom,
  getChairDisplayName,
  getEntryChairLabel,
  getPreviousQueueStatus,
  isBackwardQueueStatusMove,
  isChairAssignable,
  isChairSelectableForEntry,
  queuePriorityBadgeClassNames,
  queueStatusBadgeClassNames,
  queueStatusLabels,
  requiresQueueStatusCorrectionReason,
} from './index';

const now = new Date('2026-08-04T08:00:00.000Z');

const chair = (
  overrides: Partial<WaitingRoomChair> = {},
): WaitingRoomChair => ({
  id: 'chair-1',
  clinicId: 'clinic-1',
  name: 'Operatory 1',
  code: 'OP-1',
  isActive: true,
  isAvailable: true,
  occupiedByEntryId: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const entry = (
  overrides: Partial<WaitingRoomEntry> = {},
): WaitingRoomEntry => ({
  id: 'queue-1',
  clinicId: 'clinic-1',
  appointmentId: 'appointment-1',
  patientId: 'patient-1',
  patientName: 'Sara Amrani',
  patientPhone: null,
  doctorId: 'doctor-1',
  doctorName: 'Dr. Salma El Mansouri',
  appointmentType: null,
  status: 'WAITING',
  priority: 'NORMAL',
  queueNotes: null,
  chairId: null,
  chairName: null,
  manualOrder: null,
  arrivedAt: now,
  calledAt: null,
  seatedAt: null,
  completedAt: null,
  updatedAt: now,
  ...overrides,
});

describe('waiting-room rules and display metadata', () => {
  it('detects backward status moves that require a correction reason', () => {
    expect(isBackwardQueueStatusMove('IN_CHAIR', 'WAITING')).toBe(true);
    expect(requiresQueueStatusCorrectionReason('DONE', 'ARRIVED')).toBe(true);
    expect(isBackwardQueueStatusMove('WAITING', 'IN_CHAIR')).toBe(false);
    expect(getPreviousQueueStatus('IN_CHAIR')).toBe('WAITING');
    expect(getPreviousQueueStatus('ARRIVED')).toBeNull();
  });

  it('centralizes chair and entry display helpers', () => {
    expect(isChairAssignable(chair())).toBe(true);
    expect(isChairAssignable(chair({ isAvailable: false }))).toBe(false);
    expect(
      isChairSelectableForEntry(
        chair({ isAvailable: false, occupiedByEntryId: 'queue-1' }),
        'queue-1',
      ),
    ).toBe(true);
    expect(
      isChairSelectableForEntry(
        chair({ isAvailable: false, occupiedByEntryId: 'queue-2' }),
        'queue-1',
      ),
    ).toBe(false);
    expect(getChairDisplayName(chair())).toBe('Operatory 1 (OP-1)');
    expect(getChairDisplayName(chair({ code: null }))).toBe('Operatory 1');
    expect(getEntryChairLabel(entry({ chairName: 'Operatory 1' }))).toBe(
      'Operatory 1',
    );
    expect(getEntryChairLabel(entry({ chairId: 'chair-1' }))).toBe('chair-1');
  });

  it('centralizes board action and badge metadata', () => {
    expect(canLaunchTreatmentFromWaitingRoom(entry())).toBe(false);
    expect(
      canLaunchTreatmentFromWaitingRoom(entry({ status: 'IN_CHAIR' })),
    ).toBe(false);
    expect(
      canLaunchTreatmentFromWaitingRoom(
        entry({ chairId: 'chair-1', status: 'IN_CHAIR' }),
      ),
    ).toBe(true);
    expect(queueStatusLabels.IN_CHAIR).toBe('In Chair');
    expect(queueStatusBadgeClassNames.WAITING).toContain('warning');
    expect(queuePriorityBadgeClassNames.EMERGENCY).toContain('danger');
  });
});
