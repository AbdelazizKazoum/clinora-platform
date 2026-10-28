import type {
  TreatmentAct,
  TreatmentPlanItem,
  TreatmentSession,
  TreatmentSessionOutcome,
  TreatmentVisit,
} from './treatment';
import {
  completeWorkspaceVisit,
  transitionWorkspaceAct,
  type MockTreatmentActor,
} from './treatment-workspace';

/** Local relational collections. Visit acts are historical chart snapshots. */
export interface LocalTreatmentRecord {
  readonly currentVisitId: string;
  readonly visits: readonly TreatmentVisit[];
  readonly planItems: readonly TreatmentPlanItem[];
  readonly sessions: readonly TreatmentSession[];
}

export function createLocalTreatmentRecord(
  visit: TreatmentVisit,
): LocalTreatmentRecord {
  return {
    currentVisitId: visit.id,
    visits: [visit],
    planItems: visit.acts.map((act) => toPlanItem(act, visit)),
    sessions: [],
  };
}

export function getLocalTreatmentVisit(
  record: LocalTreatmentRecord,
): TreatmentVisit {
  const visit = record.visits.find(({ id }) => id === record.currentVisitId);
  if (!visit) throw new Error('Treatment visit was not found.');
  return visit;
}

/** Reuse finding/handoff/catalogue commands without making snapshots the plan store. */
export function updateLocalTreatmentVisit(
  record: LocalTreatmentRecord,
  update: (visit: TreatmentVisit) => TreatmentVisit,
): LocalTreatmentRecord {
  const previous = getLocalTreatmentVisit(record);
  assertEditable(previous);
  const next = update(previous);
  if (
    next.id !== previous.id ||
    next.patientId !== previous.patientId ||
    next.clinicId !== previous.clinicId
  ) {
    throw new Error('A visit update cannot change its identity or scope.');
  }
  if (new Set(next.acts.map(({ id }) => id)).size !== next.acts.length) {
    throw new Error('A treatment plan with this ID already exists.');
  }
  const planItems = [...record.planItems];
  for (const act of next.acts) {
    if (previous.acts.find(({ id }) => id === act.id) === act) continue;
    const index = planItems.findIndex(({ id }) => id === act.id);
    if (index < 0) {
      planItems.push(toPlanItem(act, next));
    } else {
      const plan = planItems[index];
      if (plan.removedAt)
        throw new Error(
          'A removed treatment plan cannot be restored through a visit update.',
        );
      if (!previous.acts.some(({ id }) => id === act.id))
        throw new Error('A treatment plan with this ID already exists.');
      assertPlanScope(plan, next);
      planItems[index] = {
        ...plan,
        ...act,
        version: plan.version + 1,
        approvedAt:
          plan.approvedAt ?? (act.approvedByDentistId ? act.updatedAt : null),
      };
    }
  }
  return replaceVisit({ ...record, planItems }, next);
}

export function startLocalTreatmentSession(
  record: LocalTreatmentRecord,
  actor: MockTreatmentActor,
  input: {
    readonly planItemId: string;
    readonly sessionId: string;
    readonly expectedVersion: number;
  },
  now: Date,
): LocalTreatmentRecord {
  const visit = getLocalTreatmentVisit(record);
  assertDentist(visit, actor);
  assertEditable(visit);
  if (!input.sessionId.trim())
    throw new Error('A treatment session ID is required.');
  const plan = findPlan(record, input.planItemId, visit);
  const existing = record.sessions.find(({ id }) => id === input.sessionId);
  if (existing) {
    if (
      existing.visitId === visit.id &&
      existing.planItemId === plan.id &&
      existing.performedByUserId === actor.userId
    )
      return record;
    throw new Error('This treatment session ID is already in use.');
  }
  if (plan.version !== input.expectedVersion)
    throw new Error(
      'The treatment plan changed. Refresh before starting a session.',
    );
  if (
    !['PLANNED', 'IN_PROGRESS'].includes(plan.status) ||
    !plan.approvedByDentistId
  ) {
    throw new Error('Only approved, active treatment plans can be started.');
  }
  if (!['IN_PROGRESS', 'READY_FOR_COMPLETION'].includes(visit.status)) {
    throw new Error(
      'Resolve the documentation review before starting treatment.',
    );
  }
  if (
    record.sessions.some(
      (session) =>
        session.planItemId === plan.id && session.status === 'IN_PROGRESS',
    )
  ) {
    throw new Error(
      'Close the previous treatment session before starting another.',
    );
  }
  if (
    record.sessions.some(
      (session) =>
        session.planItemId === plan.id &&
        session.visitId === visit.id &&
        session.status !== 'CANCELLED',
    )
  ) {
    throw new Error(
      'This plan already has a session in this visit. Continue in a later visit.',
    );
  }
  const nextPlan: TreatmentPlanItem = {
    ...plan,
    status: 'IN_PROGRESS',
    version: plan.version + 1,
    updatedAt: now,
  };
  const session: TreatmentSession = {
    id: input.sessionId,
    planItemId: plan.id,
    visitId: visit.id,
    clinicId: visit.clinicId,
    patientId: visit.patientId,
    status: 'IN_PROGRESS',
    outcome: null,
    note: null,
    performedByUserId: actor.userId,
    enteredByUserId: actor.userId,
    originHandoffId: null,
    planVersion: plan.version,
    planSnapshot: snapshotAct(plan),
    startedAt: now,
    closedAt: null,
    version: 1,
  };
  return commitPlan(
    { ...record, sessions: [...record.sessions, session] },
    nextPlan,
    audit(visit, 'TREATMENT_SESSION_STARTED', actor.userId, session.id, now),
  );
}

export function closeLocalTreatmentSession(
  record: LocalTreatmentRecord,
  actor: MockTreatmentActor,
  input: {
    readonly sessionId: string;
    readonly outcome: TreatmentSessionOutcome;
    readonly note: string;
    readonly expectedVersion: number;
  },
  now: Date,
): LocalTreatmentRecord {
  const visit = getLocalTreatmentVisit(record);
  assertDentist(visit, actor);
  assertEditable(visit);
  const session = record.sessions.find(
    (candidate) =>
      candidate.id === input.sessionId && candidate.visitId === visit.id,
  );
  if (!session)
    throw new Error('Treatment session was not found in this visit.');
  if (
    session.patientId !== visit.patientId ||
    session.clinicId !== visit.clinicId
  )
    throw new Error(
      'The treatment session must belong to this patient and clinic.',
    );
  const plan = findPlan(record, session.planItemId, visit);
  const note = input.note.trim();
  if (!note)
    throw new Error('Describe today’s work and any remaining treatment.');
  if (!['CONTINUE_LATER', 'TREATMENT_FINISHED'].includes(input.outcome))
    throw new Error('Choose a valid treatment session outcome.');
  if (
    session.status === 'COMPLETED' &&
    session.outcome === input.outcome &&
    session.note === note
  )
    return record;
  if (
    session.version !== input.expectedVersion ||
    session.status !== 'IN_PROGRESS'
  )
    throw new Error('This treatment session has changed or is already closed.');
  if (plan.status !== 'IN_PROGRESS')
    throw new Error('The treatment plan is no longer active.');
  const finished = input.outcome === 'TREATMENT_FINISHED';
  const nextPlan: TreatmentPlanItem = {
    ...plan,
    status: finished ? 'COMPLETED' : 'IN_PROGRESS',
    performedByUserId: finished
      ? session.performedByUserId
      : plan.performedByUserId,
    updatedAt: now,
    version: plan.version + 1,
  };
  const sessions = record.sessions.map(
    (candidate): TreatmentSession =>
      candidate.id === session.id
        ? {
            ...session,
            status: 'COMPLETED',
            outcome: input.outcome,
            note,
            closedAt: now,
            version: session.version + 1,
          }
        : candidate,
  );
  return commitPlan(
    { ...record, sessions },
    nextPlan,
    audit(
      visit,
      'TREATMENT_SESSION_CLOSED',
      actor.userId,
      session.id,
      now,
      note,
    ),
  );
}

export function canRemoveLocalTreatmentPlan(
  record: LocalTreatmentRecord,
  actor: MockTreatmentActor,
  planItemId: string,
): boolean {
  const visit = getLocalTreatmentVisit(record);
  const plan = record.planItems.find(({ id }) => id === planItemId);
  return Boolean(
    actor.role === 'doctor' &&
      actor.userId === visit.responsibleDentistId &&
      !['COMPLETED', 'CANCELLED'].includes(visit.status) &&
      plan &&
      !plan.removedAt &&
      plan.status === 'PLANNED' &&
      plan.source === 'DOCTOR_DIRECT' &&
      plan.enteredByUserId === actor.userId &&
      plan.originVisitId === visit.id &&
      plan.patientId === visit.patientId &&
      plan.clinicId === visit.clinicId &&
      !record.sessions.some((session) => session.planItemId === plan.id) &&
      !record.visits.some(
        (candidate) =>
          ['COMPLETED', 'CANCELLED'].includes(candidate.status) &&
          candidate.acts.some(({ id }) => id === plan.id),
      ),
  );
}

export function removeLocalTreatmentPlan(
  record: LocalTreatmentRecord,
  actor: MockTreatmentActor,
  input: { readonly planItemId: string; readonly expectedVersion: number },
  now: Date,
): LocalTreatmentRecord {
  const visit = getLocalTreatmentVisit(record);
  assertDentist(visit, actor);
  assertEditable(visit);
  const plan = findPlan(record, input.planItemId, visit);
  if (plan.version !== input.expectedVersion)
    throw new Error('The treatment plan changed. Refresh before removing it.');
  if (!canRemoveLocalTreatmentPlan(record, actor, plan.id)) {
    throw new Error(
      'Only never-started doctor plans from this editable visit can be removed. Use cancellation or correction with a reason for recorded treatment.',
    );
  }
  return replaceVisit(
    {
      ...record,
      planItems: record.planItems.map((candidate) =>
        candidate.id === plan.id
          ? {
              ...plan,
              removedAt: now,
              removedByUserId: actor.userId,
              updatedAt: now,
              version: plan.version + 1,
            }
          : candidate,
      ),
    },
    audit(
      {
        ...visit,
        acts: visit.acts.filter(({ id }) => id !== plan.id),
        updatedAt: now,
      },
      'ACT_REMOVED',
      actor.userId,
      plan.id,
      now,
    ),
  );
}

export function transitionLocalTreatmentPlan(
  record: LocalTreatmentRecord,
  actor: MockTreatmentActor,
  id: string,
  status: 'CANCELLED' | 'ENTERED_IN_ERROR',
  reason: string,
  now: Date,
): LocalTreatmentRecord {
  const visit = getLocalTreatmentVisit(record);
  assertDentist(visit, actor);
  assertEditable(visit);
  const plan = findPlan(record, id, visit);
  if (!reason.trim())
    throw new Error('A reason is required to correct or cancel a plan.');
  const activeSessions = record.sessions.filter(
    (session) => session.planItemId === id && session.status === 'IN_PROGRESS',
  );
  if (activeSessions.some((session) => session.visitId !== visit.id)) {
    throw new Error(
      'Close the treatment session in its owning visit before cancelling or correcting its plan.',
    );
  }
  const transitioned = transitionWorkspaceAct(
    { ...visit, acts: [plan] },
    actor,
    id,
    status,
    now,
  ).acts[0];
  const sessions =
    activeSessions.length === 0
      ? record.sessions
      : record.sessions.map(
          (session): TreatmentSession =>
            activeSessions.includes(session)
              ? {
                  ...session,
                  status: 'CANCELLED',
                  outcome: null,
                  note: [
                    session.note,
                    `${status === 'ENTERED_IN_ERROR' ? 'Entry correction' : 'Cancellation'}: ${reason.trim()}`,
                  ]
                    .filter(Boolean)
                    .join('\n\n'),
                  closedAt: now,
                  version: session.version + 1,
                }
              : session,
        );
  const auditedVisit = activeSessions.reduce(
    (current, session) =>
      audit(
        current,
        'TREATMENT_SESSION_CLOSED',
        actor.userId,
        session.id,
        now,
        reason.trim(),
      ),
    visit,
  );
  return commitPlan(
    { ...record, sessions },
    { ...plan, ...transitioned, version: plan.version + 1 },
    audit(
      auditedVisit,
      'ACT_STATUS_CHANGED',
      actor.userId,
      id,
      now,
      reason.trim(),
    ),
  );
}

export function completeLocalTreatmentVisit(
  record: LocalTreatmentRecord,
  actor: MockTreatmentActor,
  now: Date,
): LocalTreatmentRecord {
  const visit = getLocalTreatmentVisit(record);
  assertDentist(visit, actor);
  assertEditable(visit);
  assertReviewedEntries(visit);
  if (
    visit.documentationHandoff &&
    !['ACCEPTED', 'CANCELLED'].includes(visit.documentationHandoff.status)
  ) {
    throw new Error(
      'Resolve the assistant handoff before completing the visit.',
    );
  }
  const treatmentSessions = record.sessions.filter(
    ({ visitId }) => visitId === visit.id,
  );
  if (treatmentSessions.some(({ status }) => status === 'IN_PROGRESS'))
    throw new Error(
      'Close today’s treatment sessions before completing the visit.',
    );
  const completed = completeWorkspaceVisit(
    { ...visit, status: 'READY_FOR_COMPLETION', treatmentSessions },
    actor,
    now,
  );
  return replaceVisit(record, completed);
}

export function assertReviewedEntries(visit: TreatmentVisit): void {
  if (
    visit.findings.some(({ status }) => status === 'DRAFT') ||
    visit.acts.some(({ status }) => status === 'DRAFT') ||
    visit.periodontalExamination?.status === 'DRAFT'
  ) {
    throw new Error('Approve or resolve all draft clinical entries first.');
  }
}

export function createNextLocalTreatmentVisit(
  record: LocalTreatmentRecord,
  actor: MockTreatmentActor,
  id: string,
  now: Date,
): LocalTreatmentRecord {
  const previous = getLocalTreatmentVisit(record);
  assertDentist(previous, actor);
  if (!id.trim()) throw new Error('A visit ID is required.');
  if (
    record.visits.some(
      (visit) => !['COMPLETED', 'CANCELLED'].includes(visit.status),
    )
  )
    throw new Error('Complete the open visit before creating the next visit.');
  if (record.visits.some((visit) => visit.id === id))
    throw new Error('This visit ID is already in use.');
  const latest = record.visits.at(-1);
  if (!latest) throw new Error('No previous visit is available.');
  const visit: TreatmentVisit = {
    id,
    clinicId: previous.clinicId,
    patientId: previous.patientId,
    responsibleDentistId: actor.userId,
    appointmentId: null,
    queueEntryId: null,
    chairId: previous.chairId,
    status: 'IN_PROGRESS',
    chiefComplaint: null,
    clinicalNotes: null,
    // Baseline clinical snapshots, not new treatment or duplicated plan identities.
    findings: latest.findings.filter(({ status }) => status === 'CONFIRMED'),
    acts: record.planItems
      .filter(
        (plan) =>
          !plan.removedAt &&
          plan.clinicId === previous.clinicId &&
          plan.patientId === previous.patientId &&
          plan.status === 'COMPLETED',
      )
      .map(snapshotAct),
    documentationHandoff: null,
    periodontalExamination: null,
    auditHistory: [],
    startedAt: now,
    completedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: now,
    updatedAt: now,
  };
  return { ...record, currentVisitId: id, visits: [...record.visits, visit] };
}

export function selectLocalTreatmentVisit(
  record: LocalTreatmentRecord,
  id: string,
): LocalTreatmentRecord {
  const current = getLocalTreatmentVisit(record);
  const visit = record.visits.find((candidate) => candidate.id === id);
  if (
    !visit ||
    visit.clinicId !== current.clinicId ||
    visit.patientId !== current.patientId
  )
    throw new Error(
      'Treatment visit was not found for this patient and clinic.',
    );
  return { ...record, currentVisitId: id };
}

function toPlanItem(
  act: TreatmentAct,
  visit: TreatmentVisit,
): TreatmentPlanItem {
  return {
    ...act,
    clinicId: visit.clinicId,
    patientId: visit.patientId,
    originVisitId: visit.id,
    originHandoffId:
      act.enteredByUserId === visit.responsibleDentistId
        ? null
        : (visit.documentationHandoff?.id ?? null),
    source:
      act.enteredByUserId === visit.responsibleDentistId
        ? 'DOCTOR_DIRECT'
        : 'ASSISTANT_HANDOFF',
    approvedAt: act.approvedByDentistId ? act.updatedAt : null,
    removedAt: null,
    removedByUserId: null,
    version: 1,
  };
}

function snapshotAct(plan: TreatmentAct): TreatmentAct {
  return {
    id: plan.id,
    code: plan.code,
    status: plan.status,
    target: {
      ...plan.target,
      toothNumbers: [...plan.target.toothNumbers],
      surfaces: [...plan.target.surfaces],
      periodontalSites: [...plan.target.periodontalSites],
    },
    details: plan.details.map((detail) => ({ ...detail })),
    note: plan.note,
    enteredByUserId: plan.enteredByUserId,
    approvedByDentistId: plan.approvedByDentistId,
    performedByUserId: plan.performedByUserId,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

function findPlan(
  record: LocalTreatmentRecord,
  id: string,
  visit: TreatmentVisit,
): TreatmentPlanItem {
  const plan = record.planItems.find(
    (candidate) => candidate.id === id && !candidate.removedAt,
  );
  if (!plan) throw new Error('Treatment plan was not found.');
  assertPlanScope(plan, visit);
  return plan;
}

function assertPlanScope(plan: TreatmentPlanItem, visit: TreatmentVisit): void {
  if (plan.clinicId !== visit.clinicId || plan.patientId !== visit.patientId)
    throw new Error(
      'The treatment plan must belong to this patient and clinic.',
    );
}

function assertDentist(visit: TreatmentVisit, actor: MockTreatmentActor): void {
  if (actor.role !== 'doctor' || actor.userId !== visit.responsibleDentistId)
    throw new Error(
      'Only the responsible dentist can manage treatment sessions.',
    );
}

function assertEditable(visit: TreatmentVisit): void {
  if (['COMPLETED', 'CANCELLED'].includes(visit.status))
    throw new Error('This visit is read-only.');
}

function replaceVisit(
  record: LocalTreatmentRecord,
  visit: TreatmentVisit,
): LocalTreatmentRecord {
  return {
    ...record,
    visits: record.visits.map((candidate) =>
      candidate.id === visit.id ? visit : candidate,
    ),
  };
}

function commitPlan(
  record: LocalTreatmentRecord,
  plan: TreatmentPlanItem,
  visit: TreatmentVisit,
): LocalTreatmentRecord {
  const acts = visit.acts.some(({ id }) => id === plan.id)
    ? visit.acts.map((act) => (act.id === plan.id ? snapshotAct(plan) : act))
    : [...visit.acts, snapshotAct(plan)];
  return replaceVisit(
    {
      ...record,
      planItems: record.planItems.map((candidate) =>
        candidate.id === plan.id ? plan : candidate,
      ),
    },
    { ...visit, acts, updatedAt: plan.updatedAt },
  );
}

function audit(
  visit: TreatmentVisit,
  action:
    | 'TREATMENT_SESSION_STARTED'
    | 'TREATMENT_SESSION_CLOSED'
    | 'ACT_STATUS_CHANGED'
    | 'ACT_REMOVED',
  actorUserId: string,
  recordId: string,
  occurredAt: Date,
  reason: string | null = null,
): TreatmentVisit {
  return {
    ...visit,
    auditHistory: [
      ...(visit.auditHistory ?? []),
      {
        id: `${action}-${recordId}-${occurredAt.getTime()}`,
        action,
        actorUserId,
        recordId,
        occurredAt,
        reason,
      },
    ],
  };
}
