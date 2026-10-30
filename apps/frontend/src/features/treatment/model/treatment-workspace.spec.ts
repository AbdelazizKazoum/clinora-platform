import {
  createMockTreatmentVisit,
  MOCK_DENTIST,
  MOCK_ASSISTANT,
  MOCK_SECRETARY,
} from '../mock/treatment-workspace.mock';
import {
  assignWorkspaceDocumentation,
  completeWorkspaceVisit,
  recordWorkspaceAct,
  recordWorkspaceFinding,
  removeWorkspaceFinding,
  startWorkspaceDocumentation,
  updateWorkspacePeriodontalExamination,
} from './treatment-workspace';
import {
  createLocalTreatmentRecord,
  updateLocalTreatmentVisit,
  getLocalTreatmentVisit,
  startLocalTreatmentSession,
  closeLocalTreatmentSession,
  completeLocalTreatmentVisit,
  removeLocalTreatmentPlan,
  transitionLocalTreatmentPlan,
} from './local-treatment-record';
import { canEditTreatmentDraft } from './treatment.rules';
import { updatePeriodontalSite } from './periodontal';

const now = new Date('2026-10-30T12:00:00.000Z');
const target = {
  kind: 'TOOTH' as const,
  arch: null,
  toothNumbers: [36],
  surfaces: [],
  periodontalSites: [],
};
const input = {
  id: 'staff-act',
  code: 'ROOT_CANAL_FILLING' as const,
  target,
  details: [],
};
const assignedTo = (staff: typeof MOCK_ASSISTANT) =>
  assignWorkspaceDocumentation(
    createMockTreatmentVisit(),
    MOCK_DENTIST,
    staff.userId,
    'handoff-1',
    'Document today’s work on tooth 36.',
    now,
    staff.role === 'secretary' ? 'secretary' : 'dental_assistant',
  );

describe('Direct assigned documentation', () => {
  it.each([MOCK_ASSISTANT, MOCK_SECRETARY])(
    'lets $role record active entries and finalize directly',
    (staff) => {
      const assigned = assignedTo(staff);
      expect(assigned.documentationHandoff).toMatchObject({
        assignedToUserId: staff.userId,
        assignedToRole: staff.role,
        note: 'Document today’s work on tooth 36.',
        status: 'ASSIGNED',
      });
      expect(assigned.acts).toHaveLength(
        createMockTreatmentVisit().acts.length,
      );
      const documented = recordWorkspaceAct(assigned, staff, input, now);
      expect(documented.acts.at(-1)).toMatchObject({
        status: 'PLANNED',
        enteredByUserId: staff.userId,
        approvedByDentistId: null,
      });
      const found = recordWorkspaceFinding(
        documented,
        staff,
        { id: 'finding-staff', code: 'CALCULUS', target, details: [] },
        now,
      );
      expect(found.findings.at(-1)).toMatchObject({
        status: 'CONFIRMED',
        enteredByUserId: staff.userId,
      });
      const exam = updateWorkspacePeriodontalExamination(
        found,
        staff,
        (current) => updatePeriodontalSite(current, 36, 'B', { pd: 4 }),
        now,
      );
      expect(exam.periodontalExamination).toMatchObject({
        status: 'CONFIRMED',
        enteredByUserId: staff.userId,
        verifiedByDentistId: null,
      });
      const completed = completeWorkspaceVisit(exam, staff, now);
      expect(completed).toMatchObject({
        status: 'COMPLETED',
        completedByUserId: staff.userId,
        documentationHandoff: {
          status: 'COMPLETED',
          completedByUserId: staff.userId,
        },
      });
      expect(completed.auditHistory?.at(-1)).toMatchObject({
        action: 'VISIT_COMPLETED',
        actorUserId: staff.userId,
      });
      expect(() =>
        recordWorkspaceAct(completed, staff, { ...input, id: 'late' }, now),
      ).toThrow('read-only');
    },
  );

  it.each([MOCK_ASSISTANT, MOCK_SECRETARY])(
    'distinguishes the $role recorder from the clinical performer across sessions',
    (staff) => {
      let record = createLocalTreatmentRecord(assignedTo(staff));
      record = updateLocalTreatmentVisit(record, (visit) =>
        recordWorkspaceAct(visit, staff, input, now),
      );
      record = startLocalTreatmentSession(
        record,
        staff,
        { planItemId: input.id, sessionId: 's1', expectedVersion: 1 },
        now,
      );
      expect(record.sessions[0]).toMatchObject({
        enteredByUserId: staff.userId,
        performedByUserId: MOCK_DENTIST.userId,
        originHandoffId: 'handoff-1',
      });
      expect(() => completeLocalTreatmentVisit(record, staff, now)).toThrow(
        'Close today',
      );
      record = closeLocalTreatmentSession(
        record,
        staff,
        {
          sessionId: 's1',
          expectedVersion: 1,
          outcome: 'TREATMENT_FINISHED',
          note: 'Doctor’s treatment recorded.',
        },
        now,
      );
      expect(record.sessions[0]).toMatchObject({
        closedByUserId: staff.userId,
        performedByUserId: MOCK_DENTIST.userId,
      });
      expect(record.planItems.at(-1)).toMatchObject({
        status: 'COMPLETED',
        enteredByUserId: staff.userId,
        performedByUserId: MOCK_DENTIST.userId,
        source: 'STAFF_HANDOFF',
      });
      expect(
        getLocalTreatmentVisit(completeLocalTreatmentVisit(record, staff, now))
          .completedByUserId,
      ).toBe(staff.userId);
    },
  );

  it.each([MOCK_ASSISTANT, MOCK_SECRETARY])(
    'denies every treatment mutation to unassigned $role users',
    (staff) => {
      const visit = assignedTo(staff);
      const other = { ...staff, userId: 'not-assigned' };
      if (!visit.documentationHandoff)
        throw new Error('Missing handoff fixture');
      const record = createLocalTreatmentRecord(visit);
      const planId = record.planItems[0].id;
      expect(canEditTreatmentDraft(visit, other.userId, other.role)).toBe(
        false,
      );
      const commands = [
        () => recordWorkspaceAct(visit, other, input, now),
        () =>
          recordWorkspaceFinding(
            visit,
            other,
            { id: 'f', code: 'CALCULUS', target },
            now,
          ),
        () =>
          removeWorkspaceFinding(
            visit,
            other,
            visit.findings[0].id,
            'Correction.',
            now,
          ),
        () =>
          updateWorkspacePeriodontalExamination(
            visit,
            other,
            (exam) => exam,
            now,
          ),
        () => startWorkspaceDocumentation(visit, other, now),
        () =>
          startLocalTreatmentSession(
            record,
            other,
            { planItemId: planId, sessionId: 's', expectedVersion: 1 },
            now,
          ),
        () =>
          removeLocalTreatmentPlan(
            record,
            other,
            { planItemId: planId, expectedVersion: 1 },
            now,
          ),
        () =>
          transitionLocalTreatmentPlan(
            record,
            other,
            planId,
            'CANCELLED',
            'Reason.',
            now,
          ),
        () => completeLocalTreatmentVisit(record, other, now),
      ];
      for (const command of commands) expect(command).toThrow('assignment');
      expect(() =>
        recordWorkspaceAct(
          { ...visit, documentationHandoff: null },
          staff,
          input,
          now,
        ),
      ).toThrow('assignment');
      expect(() =>
        recordWorkspaceAct(
          {
            ...visit,
            documentationHandoff: {
              ...visit.documentationHandoff,
              status: 'CANCELLED',
            },
          },
          staff,
          input,
          now,
        ),
      ).toThrow('assignment');
    },
  );

  it('rejects blank doctor instructions and non-doctor delegation', () => {
    expect(() =>
      assignWorkspaceDocumentation(
        createMockTreatmentVisit(),
        MOCK_DENTIST,
        MOCK_ASSISTANT.userId,
        'h',
        ' ',
        now,
      ),
    ).toThrow('doctor instructions');
    expect(() =>
      assignWorkspaceDocumentation(
        assignedTo(MOCK_ASSISTANT),
        MOCK_ASSISTANT,
        MOCK_SECRETARY.userId,
        'h2',
        'Instructions.',
        now,
        'secretary',
      ),
    ).toThrow('responsible dentist');
  });

  it('requires a reason to correct an effective finding without erasing its author', () => {
    const visit = recordWorkspaceFinding(
      assignedTo(MOCK_SECRETARY),
      MOCK_SECRETARY,
      { id: 'f', code: 'CALCULUS', target },
      now,
    );
    expect(() =>
      removeWorkspaceFinding(visit, MOCK_SECRETARY, 'f', undefined, now),
    ).toThrow('reason');
    const corrected = removeWorkspaceFinding(
      visit,
      MOCK_SECRETARY,
      'f',
      'Wrong tooth.',
      now,
    );
    expect(corrected.findings.at(-1)).toMatchObject({
      status: 'ENTERED_IN_ERROR',
      enteredByUserId: MOCK_SECRETARY.userId,
    });
    expect(corrected.auditHistory?.at(-1)?.actorUserId).toBe(
      MOCK_SECRETARY.userId,
    );
  });
});
