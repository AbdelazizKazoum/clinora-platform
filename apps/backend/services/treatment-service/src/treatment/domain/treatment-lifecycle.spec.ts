import {
  CLINICAL_FINDING_CODES as CONTRACT_FINDINGS,
  TREATMENT_ACT_CODES as CONTRACT_ACTS,
} from '@clinora/contracts-treatment';
import {
  CLINICAL_FINDING_CODES,
  TREATMENT_ACT_CODES,
} from './treatment-catalogue';
import {
  assignVisitDocumentation,
  canActorEditDraftDocumentation,
  completeTreatmentVisit,
  recordClinicalFinding,
  recordTreatmentAct,
  startTreatmentVisit,
  transitionTreatmentAct,
} from './treatment-lifecycle';
import { createTreatmentVisit, type TreatmentActor } from './treatment-visit';

const doctor: TreatmentActor = { userId: 'doctor', role: 'DOCTOR' };
const now = new Date('2026-10-30T12:00:00Z');
const visit = () =>
  startTreatmentVisit(
    createTreatmentVisit(
      {
        id: 'visit',
        clinicId: 'clinic',
        patientId: 'patient',
        responsibleDentistId: doctor.userId,
      },
      doctor,
      now,
    ),
    doctor,
    now,
  );
const target = {
  kind: 'TOOTH' as const,
  arch: null,
  toothNumbers: [36],
  surfaces: [],
  periodontalSites: [],
};
const act = { id: 'act', code: 'ROOT_CANAL_FILLING' as const, target };

describe('Treatment delegation authority', () => {
  it('preserves catalogue code parity', () => {
    expect(TREATMENT_ACT_CODES).toEqual(CONTRACT_ACTS);
    expect(CLINICAL_FINDING_CODES).toEqual(CONTRACT_FINDINGS);
  });

  it.each(['DENTAL_ASSISTANT', 'SECRETARY'] as const)(
    'allows assigned %s direct documentation and completion',
    (role) => {
      const staff: TreatmentActor = { userId: 'staff', role };
      let record = assignVisitDocumentation(
        visit(),
        doctor,
        {
          handoffId: 'h',
          assigneeUserId: staff.userId,
          assigneeRole: role,
          note: 'Document the work performed.',
        },
        now,
      );
      expect(canActorEditDraftDocumentation(record, staff)).toBe(true);
      record = recordTreatmentAct(record, staff, act, now);
      expect(record.acts[0]).toMatchObject({
        status: 'PLANNED',
        enteredByUserId: staff.userId,
        approvedByDentistId: null,
      });
      record = recordClinicalFinding(
        record,
        staff,
        { id: 'f', code: 'CALCULUS', target },
        now,
      );
      expect(record.findings[0]).toMatchObject({
        status: 'CONFIRMED',
        enteredByUserId: staff.userId,
      });
      record = transitionTreatmentAct(
        record,
        staff,
        act.id,
        'IN_PROGRESS',
        now,
      );
      record = transitionTreatmentAct(record, staff, act.id, 'COMPLETED', now);
      expect(record.acts[0]).toMatchObject({
        enteredByUserId: staff.userId,
        performedByUserId: doctor.userId,
        approvedByDentistId: null,
      });
      record = completeTreatmentVisit(record, staff, now);
      expect(record).toMatchObject({
        status: 'COMPLETED',
        completedByUserId: staff.userId,
        documentationHandoff: {
          status: 'COMPLETED',
          assignedToUserId: staff.userId,
          assignedToRole: role,
          completedByUserId: staff.userId,
        },
      });
      expect(() =>
        recordTreatmentAct(record, staff, { ...act, id: 'late' }, now),
      ).toThrow('immutable');
    },
  );

  it.each(['DENTAL_ASSISTANT', 'SECRETARY'] as const)(
    'rejects unassigned, wrong-role, and cancelled assignment writes for %s',
    (role) => {
      const staff: TreatmentActor = { userId: 'staff', role };
      const assigned = assignVisitDocumentation(
        visit(),
        doctor,
        {
          handoffId: 'h',
          assigneeUserId: staff.userId,
          assigneeRole: role,
          note: 'Instructions.',
        },
        now,
      );
      for (const actor of [
        { ...staff, userId: 'other' },
        { ...staff, role: 'ADMIN' as const },
        {
          ...staff,
          role:
            role === 'SECRETARY'
              ? ('DENTAL_ASSISTANT' as const)
              : ('SECRETARY' as const),
        },
      ]) {
        expect(canActorEditDraftDocumentation(assigned, actor)).toBe(false);
        expect(() => recordTreatmentAct(assigned, actor, act, now)).toThrow(
          expect.objectContaining({
            code: 'DOCUMENTATION_ASSIGNMENT_REQUIRED',
          }),
        );
        expect(() => completeTreatmentVisit(assigned, actor, now)).toThrow();
      }
      expect(() => recordTreatmentAct(visit(), staff, act, now)).toThrow();
      const handoff = assigned.documentationHandoff;
      if (!handoff) throw new Error('Missing handoff fixture');
      expect(() =>
        recordTreatmentAct(
          {
            ...assigned,
            documentationHandoff: { ...handoff, status: 'CANCELLED' },
          },
          staff,
          act,
          now,
        ),
      ).toThrow();
    },
  );

  it('requires doctor instructions and reserves assignment/visit creation for the doctor', () => {
    expect(() =>
      assignVisitDocumentation(
        visit(),
        doctor,
        {
          handoffId: 'h',
          assigneeUserId: 's',
          assigneeRole: 'SECRETARY',
          note: ' ',
        },
        now,
      ),
    ).toThrow('instructions');
    expect(() =>
      startTreatmentVisit(
        { ...visit(), status: 'DRAFT' },
        { userId: 's', role: 'SECRETARY' },
        now,
      ),
    ).toThrow();
  });
});
