import {
  createMockTreatmentVisit,
  MOCK_ASSISTANT,
  MOCK_DENTIST,
} from '../mock/treatment-workspace.mock';
import {
  assignWorkspaceDocumentation,
  recordWorkspaceAct,
} from './treatment-workspace';
import {
  assertReviewedEntries,
  canRemoveLocalTreatmentPlan,
  closeLocalTreatmentSession,
  completeLocalTreatmentVisit,
  createLocalTreatmentRecord,
  createNextLocalTreatmentVisit,
  getLocalTreatmentVisit,
  removeLocalTreatmentPlan,
  selectLocalTreatmentVisit,
  startLocalTreatmentSession,
  transitionLocalTreatmentPlan,
  updateLocalTreatmentVisit,
  type LocalTreatmentRecord,
} from './local-treatment-record';

const now = new Date('2026-10-28T10:00:00Z');
const later = new Date('2026-11-04T10:00:00Z');
const makeRecord = () => createLocalTreatmentRecord(createMockTreatmentVisit());
const start = (record: LocalTreatmentRecord, sessionId = 'session-1') =>
  startLocalTreatmentSession(
    record,
    MOCK_DENTIST,
    {
      planItemId: record.planItems[0].id,
      sessionId,
      expectedVersion: record.planItems[0].version,
    },
    now,
  );
const close = (
  record: LocalTreatmentRecord,
  outcome: 'CONTINUE_LATER' | 'TREATMENT_FINISHED' = 'CONTINUE_LATER',
) =>
  closeLocalTreatmentSession(
    record,
    MOCK_DENTIST,
    {
      sessionId: record.sessions.at(-1)?.id ?? '',
      outcome,
      note: 'Today’s work recorded. Further treatment discussed.',
      expectedVersion: 1,
    },
    now,
  );

describe('Local treatment continuation', () => {
  it('soft-removes a never-started doctor plan with an audit entry and no cancellation reason', () => {
    const record = makeRecord();
    const plan = record.planItems[0];
    expect(canRemoveLocalTreatmentPlan(record, MOCK_DENTIST, plan.id)).toBe(
      true,
    );
    const removed = removeLocalTreatmentPlan(
      record,
      MOCK_DENTIST,
      { planItemId: plan.id, expectedVersion: plan.version },
      now,
    );
    expect(getLocalTreatmentVisit(removed).acts).toHaveLength(0);
    expect(removed.planItems[0]).toMatchObject({
      status: 'PLANNED',
      removedAt: now,
      removedByUserId: MOCK_DENTIST.userId,
      version: 2,
    });
    expect(getLocalTreatmentVisit(removed).auditHistory?.at(-1)).toMatchObject({
      action: 'ACT_REMOVED',
      actorUserId: MOCK_DENTIST.userId,
      recordId: plan.id,
      reason: null,
    });
    expect(record.planItems[0].removedAt).toBeNull();
    expect(record.visits[0].acts).toHaveLength(1);
    expect(canRemoveLocalTreatmentPlan(removed, MOCK_DENTIST, plan.id)).toBe(
      false,
    );
    expect(() => start(removed)).toThrow('not found');
    expect(() =>
      transitionLocalTreatmentPlan(
        removed,
        MOCK_DENTIST,
        plan.id,
        'CANCELLED',
        'Do not restore.',
        now,
      ),
    ).toThrow('not found');
  });

  it('rejects removal after any session, including closed, cancelled, and earlier-visit sessions', () => {
    const record = makeRecord();
    const started = start(record);
    const closed = close(started);
    for (const candidate of [
      started,
      closed,
      {
        ...record,
        sessions: [
          {
            ...started.sessions[0],
            visitId: 'earlier-visit',
            status: 'CANCELLED' as const,
          },
        ],
      },
    ]) {
      const plan = candidate.planItems[0];
      expect(
        canRemoveLocalTreatmentPlan(candidate, MOCK_DENTIST, plan.id),
      ).toBe(false);
      expect(() =>
        removeLocalTreatmentPlan(
          candidate,
          MOCK_DENTIST,
          { planItemId: plan.id, expectedVersion: plan.version },
          now,
        ),
      ).toThrow('Only your never-started plans');
    }
  });

  it('protects finalized visits, original finalized records, other scopes, and assistant entries from free removal', () => {
    const record = makeRecord();
    const plan = record.planItems[0];
    const input = { planItemId: plan.id, expectedVersion: plan.version };
    expect(() =>
      removeLocalTreatmentPlan(record, MOCK_ASSISTANT, input, now),
    ).toThrow('assignment');
    expect(() =>
      removeLocalTreatmentPlan(
        record,
        { ...MOCK_DENTIST, userId: 'another-doctor' },
        input,
        now,
      ),
    ).toThrow('assignment');
    expect(() =>
      removeLocalTreatmentPlan(
        record,
        MOCK_DENTIST,
        { ...input, expectedVersion: 0 },
        now,
      ),
    ).toThrow('changed');
    const finalized = completeLocalTreatmentVisit(record, MOCK_DENTIST, now);
    expect(() =>
      removeLocalTreatmentPlan(finalized, MOCK_DENTIST, input, now),
    ).toThrow('read-only');
    const laterVisit = createNextLocalTreatmentVisit(
      finalized,
      MOCK_DENTIST,
      'visit-2',
      later,
    );
    expect(canRemoveLocalTreatmentPlan(laterVisit, MOCK_DENTIST, plan.id)).toBe(
      false,
    );
    expect(() =>
      removeLocalTreatmentPlan(laterVisit, MOCK_DENTIST, input, later),
    ).toThrow('Only your never-started plans');
    for (const fields of [
      { patientId: 'another-patient' },
      { clinicId: 'another-clinic' },
      { enteredByUserId: MOCK_ASSISTANT.userId },
      { status: 'CANCELLED' as const },
    ]) {
      expect(
        canRemoveLocalTreatmentPlan(
          { ...record, planItems: [{ ...plan, ...fields }] },
          MOCK_DENTIST,
          plan.id,
        ),
      ).toBe(false);
    }
    const referenced = {
      ...record,
      visits: [
        ...record.visits,
        {
          ...record.visits[0],
          id: 'finalized-reference',
          status: 'COMPLETED' as const,
        },
      ],
    };
    expect(canRemoveLocalTreatmentPlan(referenced, MOCK_DENTIST, plan.id)).toBe(
      false,
    );
  });

  it('retains all session history when started treatment is cancelled or corrected with a reason', () => {
    const closed = close(start(makeRecord()));
    const plan = closed.planItems[0];
    for (const status of ['CANCELLED', 'ENTERED_IN_ERROR'] as const) {
      expect(() =>
        transitionLocalTreatmentPlan(
          closed,
          MOCK_DENTIST,
          plan.id,
          status,
          ' ',
          now,
        ),
      ).toThrow('reason');
      const changed = transitionLocalTreatmentPlan(
        closed,
        MOCK_DENTIST,
        plan.id,
        status,
        'Clinical decision corrected.',
        now,
      );
      expect(changed.planItems[0]).toMatchObject({ status, removedAt: null });
      expect(changed.sessions).toBe(closed.sessions);
      expect(changed.visits[0].auditHistory?.at(-1)?.reason).toBe(
        'Clinical decision corrected.',
      );
    }
  });

  it('continues the same plan across visits without rewriting earlier visits or sessions', () => {
    const started = start(makeRecord());
    expect(() =>
      completeLocalTreatmentVisit(started, MOCK_DENTIST, now),
    ).toThrow('Close today');
    const closed = close(started);
    const completed = completeLocalTreatmentVisit(closed, MOCK_DENTIST, now);
    expect(completed.planItems[0].status).toBe('IN_PROGRESS');
    const originalVisit = completed.visits[0];
    const originalSession = completed.sessions[0];
    const next = createNextLocalTreatmentVisit(
      completed,
      MOCK_DENTIST,
      'visit-2',
      later,
    );
    expect(getLocalTreatmentVisit(next).acts).toHaveLength(0);
    const continued = startLocalTreatmentSession(
      next,
      MOCK_DENTIST,
      {
        planItemId: next.planItems[0].id,
        sessionId: 'session-2',
        expectedVersion: next.planItems[0].version,
      },
      later,
    );
    const finished = closeLocalTreatmentSession(
      continued,
      MOCK_DENTIST,
      {
        sessionId: 'session-2',
        outcome: 'TREATMENT_FINISHED',
        note: 'Treatment finished during this visit.',
        expectedVersion: 1,
      },
      later,
    );

    expect(finished.planItems).toHaveLength(1);
    expect(finished.planItems[0]).toMatchObject({
      status: 'COMPLETED',
      originVisitId: 'visit-demo',
      originHandoffId: null,
    });
    expect(finished.sessions.map(({ planItemId }) => planItemId)).toEqual([
      finished.planItems[0].id,
      finished.planItems[0].id,
    ]);
    expect(finished.visits[0]).toBe(originalVisit);
    expect(finished.sessions[0]).toBe(originalSession);
    expect(finished.visits[0].acts[0].status).toBe('IN_PROGRESS');
    expect(finished.sessions[0].planSnapshot.status).toBe('PLANNED');
    expect(finished.sessions[1].planSnapshot.status).toBe('IN_PROGRESS');
    expect(
      completeLocalTreatmentVisit(finished, MOCK_DENTIST, later).visits[1]
        .status,
    ).toBe('COMPLETED');
  });

  it('keeps several plan sessions independent within one visit', () => {
    const record = makeRecord();
    const another = { ...record.planItems[0], id: 'another-plan' };
    const withPlans = { ...record, planItems: [...record.planItems, another] };
    const first = start(withPlans);
    const second = startLocalTreatmentSession(
      first,
      MOCK_DENTIST,
      {
        planItemId: another.id,
        sessionId: 'session-2',
        expectedVersion: another.version,
      },
      now,
    );
    const closed = close(second, 'TREATMENT_FINISHED');
    expect(closed.planItems.map(({ status }) => status)).toEqual([
      'IN_PROGRESS',
      'COMPLETED',
    ]);
    expect(() =>
      completeLocalTreatmentVisit(closed, MOCK_DENTIST, now),
    ).toThrow('Close today');
  });

  it('rejects drafts, foreign scope, unauthorized clinicians, stale versions, and duplicate open sessions', () => {
    const record = makeRecord();
    const input = {
      planItemId: record.planItems[0].id,
      sessionId: 'session-1',
      expectedVersion: 1,
    };
    expect(() =>
      startLocalTreatmentSession(record, MOCK_ASSISTANT, input, now),
    ).toThrow('assignment');
    expect(() =>
      startLocalTreatmentSession(
        record,
        { ...MOCK_DENTIST, userId: 'another-doctor' },
        input,
        now,
      ),
    ).toThrow('assignment');
    expect(() =>
      startLocalTreatmentSession(
        record,
        MOCK_DENTIST,
        { ...input, expectedVersion: 0 },
        now,
      ),
    ).toThrow('changed');
    for (const status of [
      'DRAFT',
      'CANCELLED',
      'COMPLETED',
      'ENTERED_IN_ERROR',
    ] as const) {
      expect(() =>
        start({ ...record, planItems: [{ ...record.planItems[0], status }] }),
      ).toThrow('active treatment');
    }
    for (const scope of [
      { clinicId: 'another-clinic' },
      { patientId: 'another-patient' },
    ]) {
      expect(() =>
        start({ ...record, planItems: [{ ...record.planItems[0], ...scope }] }),
      ).toThrow('patient and clinic');
    }
    const started = start(record);
    expect(startLocalTreatmentSession(started, MOCK_DENTIST, input, now)).toBe(
      started,
    );
    expect(() => start(started, 'duplicate-session')).toThrow(
      'Close the previous',
    );
    expect(() => start(close(started), 'duplicate-session')).toThrow(
      'already has a session',
    );
  });

  it('requires closure notes and prevents correction of finalized history', () => {
    const started = start(makeRecord());
    const input = {
      sessionId: 'session-1',
      outcome: 'CONTINUE_LATER' as const,
      note: ' ',
      expectedVersion: 1,
    };
    expect(() =>
      closeLocalTreatmentSession(started, MOCK_DENTIST, input, now),
    ).toThrow('Describe today');
    expect(() =>
      closeLocalTreatmentSession(
        started,
        MOCK_DENTIST,
        { ...input, note: 'Work recorded.', expectedVersion: 0 },
        now,
      ),
    ).toThrow('changed');
    const closed = close(started);
    expect(close(closed)).toBe(closed);
    const completed = completeLocalTreatmentVisit(closed, MOCK_DENTIST, now);
    expect(() =>
      updateLocalTreatmentVisit(completed, (visit) => ({
        ...visit,
        findings: [],
      })),
    ).toThrow('read-only');
    expect(() => start(completed, 'session-2')).toThrow('read-only');
    const next = createNextLocalTreatmentVisit(
      completed,
      MOCK_DENTIST,
      'visit-2',
      later,
    );
    expect(() =>
      closeLocalTreatmentSession(
        next,
        MOCK_DENTIST,
        { ...input, note: 'Change previous session.' },
        later,
      ),
    ).toThrow('not found in this visit');
    const historical = selectLocalTreatmentVisit(
      next,
      completed.currentVisitId,
    );
    expect(getLocalTreatmentVisit(historical)).toBe(completed.visits[0]);
    expect(() =>
      createNextLocalTreatmentVisit(historical, MOCK_DENTIST, 'visit-3', later),
    ).toThrow('Complete the open visit');
  });

  it('retains handoff provenance and allows the assigned user to finalize without review', () => {
    const assigned = updateLocalTreatmentVisit(makeRecord(), (visit) =>
      assignWorkspaceDocumentation(
        visit,
        MOCK_DENTIST,
        MOCK_ASSISTANT.userId,
        'handoff-1',
        'Record the requested treatment.',
        now,
      ),
    );
    const documented = updateLocalTreatmentVisit(assigned, (visit) =>
      recordWorkspaceAct(
        visit,
        MOCK_ASSISTANT,
        {
          id: 'assistant-plan',
          code: 'ROOT_CANAL_FILLING',
          details: [],
          target: { ...visit.acts[0].target, kind: 'TOOTH' },
        },
        now,
      ),
    );
    expect(documented.planItems[1]).toMatchObject({
      source: 'STAFF_HANDOFF',
      originHandoffId: 'handoff-1',
      status: 'PLANNED',
    });
    expect(() =>
      assertReviewedEntries(getLocalTreatmentVisit(documented)),
    ).not.toThrow();
    const completed = completeLocalTreatmentVisit(
      documented,
      MOCK_ASSISTANT,
      now,
    );
    expect(completed.visits[0]).toMatchObject({
      status: 'COMPLETED',
      completedByUserId: MOCK_ASSISTANT.userId,
      documentationHandoff: { status: 'COMPLETED' },
    });
  });

  it('requires a correction reason and never cancels an open session implicitly', () => {
    const record = makeRecord();
    expect(() =>
      transitionLocalTreatmentPlan(
        record,
        MOCK_DENTIST,
        record.planItems[0].id,
        'CANCELLED',
        '',
        now,
      ),
    ).toThrow('reason');
    const started = start(record);
    for (const status of ['CANCELLED', 'ENTERED_IN_ERROR'] as const) {
      expect(() =>
        transitionLocalTreatmentPlan(
          started,
          MOCK_DENTIST,
          record.planItems[0].id,
          status,
          '',
          now,
        ),
      ).toThrow('reason');
      const stopped = transitionLocalTreatmentPlan(
        started,
        MOCK_DENTIST,
        record.planItems[0].id,
        status,
        'Entry needs correction.',
        now,
      );
      expect(stopped.planItems[0].status).toBe(status);
      expect(stopped.sessions[0]).toMatchObject({
        status: 'CANCELLED',
        closedAt: now,
        version: 2,
      });
      expect(stopped.sessions[0].note).toContain('Entry needs correction.');
      expect(stopped.sessions[0].planSnapshot).toBe(
        started.sessions[0].planSnapshot,
      );
      expect(started.sessions[0].status).toBe('IN_PROGRESS');
    }
    const foreignSession = {
      ...started,
      sessions: [{ ...started.sessions[0], visitId: 'another-visit' }],
    };
    expect(() =>
      transitionLocalTreatmentPlan(
        foreignSession,
        MOCK_DENTIST,
        record.planItems[0].id,
        'CANCELLED',
        'Stop treatment.',
        now,
      ),
    ).toThrow('owning visit');
    const cancelled = transitionLocalTreatmentPlan(
      record,
      MOCK_DENTIST,
      record.planItems[0].id,
      'CANCELLED',
      'Treatment declined.',
      now,
    );
    expect(cancelled.planItems[0].status).toBe('CANCELLED');
    expect(cancelled.visits[0].auditHistory?.at(-1)?.reason).toBe(
      'Treatment declined.',
    );
  });
});
