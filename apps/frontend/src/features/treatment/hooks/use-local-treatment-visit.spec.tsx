import { StrictMode, type PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react';
import { updatePeriodontalSite } from '../model/periodontal';
import { useLocalTreatmentVisit } from './use-local-treatment-visit';

const strictWrapper = ({ children }: PropsWithChildren) => (
  <StrictMode>{children}</StrictMode>
);

const crown = {
  code: 'CROWN' as const,
  details: [{ key: 'RESTORATION_MATERIAL', value: 'ZIRCON' }],
  target: {
    arch: null,
    kind: 'TOOTH' as const,
    periodontalSites: [],
    surfaces: [],
    toothNumbers: [16],
  },
};

describe('Local treatment visit', () => {
  it('removes unstarted plans from active lists and the chart without creating cancelled rows', () => {
    const { result } = renderHook(() => useLocalTreatmentVisit(), {
      wrapper: strictWrapper,
    });
    act(() => result.current.actions.recordAct(crown));
    const plan = result.current.planItems.at(-1);
    expect(plan).toBeDefined();
    const id = plan?.id ?? '';
    expect(result.current.removablePlanIds.has(id)).toBe(true);
    act(() => result.current.actions.removeAct(id));
    expect(
      result.current.planItems.some((candidate) => candidate.id === id),
    ).toBe(false);
    expect(
      result.current.visit.acts.some((candidate) => candidate.id === id),
    ).toBe(false);
    expect(result.current.removablePlanIds.has(id)).toBe(false);
    expect(result.current.visit.auditHistory?.at(-1)?.action).toBe(
      'ACT_REMOVED',
    );
    expect(result.current.feedback?.variant).toBe('success');
  });

  it('does not offer free removal again after a session closes for continuation', () => {
    const { result } = renderHook(() => useLocalTreatmentVisit());
    const id = result.current.planItems[0].id;
    act(() => result.current.actions.transitionAct(id, 'IN_PROGRESS'));
    expect(result.current.removablePlanIds.has(id)).toBe(false);
    act(() =>
      result.current.actions.closeSession(
        result.current.sessions[0].id,
        'CONTINUE_LATER',
        'Further work required.',
      ),
    );
    act(() => result.current.actions.removeAct(id));
    expect(result.current.feedback?.variant).toBe('danger');
    expect(result.current.planItems[0].status).toBe('IN_PROGRESS');
    expect(result.current.sessions).toHaveLength(1);
  });

  it('keeps SQL-shaped identities and assistant handoff origins across visits', () => {
    const { result } = renderHook(() => useLocalTreatmentVisit(), {
      wrapper: strictWrapper,
    });
    const planId = result.current.planItems[0].id;
    act(() => result.current.actions.transitionAct(planId, 'IN_PROGRESS'));
    const sessionId = result.current.sessions[0].id;
    act(() =>
      result.current.actions.closeSession(
        sessionId,
        'CONTINUE_LATER',
        'Further treatment required.',
      ),
    );
    act(() => result.current.actions.completeVisit());
    const originalVisit = result.current.visits[0];
    act(() => result.current.actions.createNextVisit());
    const newVisitId = result.current.visit.id;
    act(() => result.current.actions.transitionAct(planId, 'IN_PROGRESS'));
    act(() =>
      result.current.actions.closeSession(
        result.current.sessions[1].id,
        'TREATMENT_FINISHED',
        'Remaining work completed.',
      ),
    );
    expect(result.current.planItems).toHaveLength(1);
    expect(result.current.sessions.map(({ planItemId }) => planItemId)).toEqual(
      [planId, planId],
    );
    expect(result.current.visits[0]).toBe(originalVisit);
    act(() =>
      result.current.actions.assignDocumentation(
        result.current.assistant.userId,
        'Enter the additional crown plan.',
      ),
    );
    const handoffId = result.current.visit.documentationHandoff?.id;
    act(() => result.current.setActor(result.current.assistant));
    act(() => result.current.actions.startDocumentation());
    act(() => result.current.actions.recordAct(crown));
    expect(result.current.planItems[1]).toMatchObject({
      originVisitId: newVisitId,
      originHandoffId: handoffId,
      source: 'STAFF_HANDOFF',
      status: 'PLANNED',
    });
    act(() => result.current.actions.completeVisit());
    expect(result.current.visit.completedByUserId).toBe(
      result.current.assistant.userId,
    );
    expect(result.current.visit.status).toBe('COMPLETED');
  });

  it('keeps plan creation scoped to a launched patient and dentist', () => {
    const { result } = renderHook(() =>
      useLocalTreatmentVisit({
        patientId: 'patient-2',
        doctorId: 'doctor-2',
        appointmentId: null,
        chairId: null,
        queueEntryId: null,
      }),
    );
    expect(result.current.planItems[0]).toMatchObject({
      patientId: 'patient-2',
      source: 'DOCTOR_DIRECT',
      originHandoffId: null,
    });
    act(() =>
      result.current.actions.transitionAct(
        result.current.planItems[0].id,
        'IN_PROGRESS',
      ),
    );
    expect(result.current.sessions[0]).toMatchObject({
      patientId: 'patient-2',
      performedByUserId: 'doctor-2',
    });
  });

  it('retains queued writes and unique IDs when React replays updates', () => {
    const { result } = renderHook(() => useLocalTreatmentVisit(), {
      wrapper: strictWrapper,
    });
    const initialCount = result.current.visit.acts.length;
    act(() => {
      result.current.actions.recordAct(crown);
      result.current.actions.recordAct(crown);
    });
    const acts = result.current.visit.acts;
    expect(acts).toHaveLength(initialCount + 2);
    expect(new Set(acts.map(({ id }) => id)).size).toBe(acts.length);
    expect(result.current.visit.auditHistory).toHaveLength(2);
  });

  it('preserves the visit and reports validation errors', () => {
    const { result } = renderHook(() => useLocalTreatmentVisit());
    const originalVisit = result.current.visit;
    act(() => result.current.actions.recordAct({ ...crown, details: [] }));
    expect(result.current.visit).toBe(originalVisit);
    expect(result.current.feedback?.variant).toBe('danger');
    expect(result.current.feedback?.message).toContain('RESTORATION_MATERIAL');
  });

  it('applies queued periodontal edits to the latest examination', () => {
    const { result } = renderHook(() => useLocalTreatmentVisit(), {
      wrapper: strictWrapper,
    });
    act(() => {
      result.current.actions.updatePeriodontalExamination((exam) =>
        updatePeriodontalSite(exam, 16, 'MB', { pd: 4 }),
      );
      result.current.actions.updatePeriodontalExamination((exam) =>
        updatePeriodontalSite(exam, 16, 'DL', { pd: 3 }),
      );
    });
    const tooth = result.current.visit.periodontalExamination?.teeth.find(
      (entry) => entry.toothNumber === 16,
    );
    expect(tooth?.sites.MB?.pd).toBe(4);
    expect(tooth?.sites.DL?.pd).toBe(3);
  });
});
