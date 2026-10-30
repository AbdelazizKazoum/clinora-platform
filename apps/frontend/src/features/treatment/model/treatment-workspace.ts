import type {
  ClinicalFinding,
  DocumentationHandoff,
  TreatmentAuditAction,
  TreatmentAuditEntry,
  TreatmentAct,
  TreatmentActStatus,
  TreatmentVisit,
} from './treatment';
import {
  validateTreatmentInput,
  type TypedClinicalFindingInput,
  type TypedTreatmentActInput,
} from './treatment-inputs';
import {
  createEmptyPeriodontalExamination,
  type PeriodontalExamination,
} from './periodontal';
import {
  canEditTreatmentDraft,
  type TreatmentWorkspaceRole,
} from './treatment.rules';

export interface MockTreatmentActor {
  readonly userId: string;
  readonly name: string;
  readonly role: Extract<
    TreatmentWorkspaceRole,
    'doctor' | 'dental_assistant' | 'secretary'
  >;
}

export type RecordWorkspaceFindingInput = TypedClinicalFindingInput;
export type RecordWorkspaceActInput = TypedTreatmentActInput;

export type PeriodontalExaminationUpdater = (
  examination: PeriodontalExamination,
) => PeriodontalExamination;

const ACT_TRANSITIONS: Readonly<
  Record<TreatmentActStatus, readonly TreatmentActStatus[]>
> = {
  CANCELLED: [],
  COMPLETED: ['ENTERED_IN_ERROR'],
  DRAFT: ['PLANNED', 'CANCELLED', 'ENTERED_IN_ERROR'],
  ENTERED_IN_ERROR: [],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED', 'ENTERED_IN_ERROR'],
  PLANNED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ENTERED_IN_ERROR'],
};

export const recordWorkspaceFinding = (
  visit: TreatmentVisit,
  actor: MockTreatmentActor,
  input: RecordWorkspaceFindingInput,
  now: Date,
): TreatmentVisit => {
  assertCanDocument(visit, actor);
  validateTreatmentInput(input);
  const finding: ClinicalFinding = {
    code: input.code,
    createdAt: now,
    details: input.details ?? [],
    enteredByUserId: actor.userId,
    id: input.id,
    note: input.note ?? null,
    status: 'CONFIRMED',
    target: input.target,
    updatedAt: now,
    verifiedByUserId: actor.userId,
  };

  return withAudit(
    {
      ...visit,
      findings: [...visit.findings, finding],
      updatedAt: now,
    },
    'FINDING_RECORDED',
    actor.userId,
    finding.id,
    now,
  );
};

export const recordWorkspaceAct = (
  visit: TreatmentVisit,
  actor: MockTreatmentActor,
  input: RecordWorkspaceActInput,
  now: Date,
): TreatmentVisit => {
  assertCanDocument(visit, actor);
  validateTreatmentInput(input);
  const dentistEntry = actor.role === 'doctor';
  const act: TreatmentAct = {
    approvedByDentistId: dentistEntry ? actor.userId : null,
    code: input.code,
    createdAt: now,
    details: input.details ?? [],
    enteredByUserId: actor.userId,
    id: input.id,
    note: input.note ?? null,
    performedByUserId: null,
    status: 'PLANNED',
    target: input.target,
    updatedAt: now,
  };

  return withAudit(
    { ...visit, acts: [...visit.acts, act], updatedAt: now },
    'ACT_RECORDED',
    actor.userId,
    act.id,
    now,
  );
};

export const removeWorkspaceFinding = (
  visit: TreatmentVisit,
  actor: MockTreatmentActor,
  findingId: string,
  reason: string | undefined,
  now: Date,
): TreatmentVisit => {
  const finding = visit.findings.find(({ id }) => id === findingId);
  if (!finding) {
    throw new Error('Clinical finding was not found.');
  }

  if (finding.status === 'DRAFT') {
    assertCanDocument(visit, actor);
    if (actor.role !== 'doctor' && finding.enteredByUserId !== actor.userId) {
      throw new Error('An assistant can only remove their own draft finding.');
    }

    return withAudit(
      {
        ...visit,
        findings: visit.findings.filter(({ id }) => id !== findingId),
        updatedAt: now,
      },
      'FINDING_REMOVED',
      actor.userId,
      findingId,
      now,
    );
  }

  assertCanDocument(visit, actor);
  const removalReason = reason?.trim();
  if (!removalReason) {
    throw new Error('A reason is required to remove a confirmed finding.');
  }
  if (finding.status !== 'CONFIRMED') {
    throw new Error('Only draft or confirmed findings can be removed.');
  }

  return withAudit(
    {
      ...visit,
      findings: visit.findings.map((candidate) =>
        candidate.id === findingId
          ? { ...candidate, status: 'ENTERED_IN_ERROR', updatedAt: now }
          : candidate,
      ),
      updatedAt: now,
    },
    'FINDING_ENTERED_IN_ERROR',
    actor.userId,
    findingId,
    now,
    removalReason,
  );
};

export const updateWorkspacePeriodontalExamination = (
  visit: TreatmentVisit,
  actor: MockTreatmentActor,
  update: PeriodontalExaminationUpdater,
  now: Date,
): TreatmentVisit => {
  assertCanDocument(visit, actor);
  const current =
    visit.periodontalExamination ??
    createEmptyPeriodontalExamination(actor.userId, now);
  const next = update(current);
  return withAudit(
    {
      ...visit,
      periodontalExamination: {
        ...next,
        enteredByUserId: current.enteredByUserId,
        status: 'CONFIRMED',
        updatedAt: now,
        verifiedByDentistId:
          actor.role === 'doctor' ? actor.userId : current.verifiedByDentistId,
      },
      updatedAt: now,
    },
    'PERIODONTAL_UPDATED',
    actor.userId,
    null,
    now,
  );
};

export const transitionWorkspaceAct = (
  visit: TreatmentVisit,
  dentist: MockTreatmentActor,
  actId: string,
  nextStatus: TreatmentActStatus,
  now: Date,
): TreatmentVisit => {
  assertCanDocument(visit, dentist);
  const act = visit.acts.find(({ id }) => id === actId);
  if (!act || !ACT_TRANSITIONS[act.status].includes(nextStatus)) {
    throw new Error(`Treatment act cannot transition to ${nextStatus}.`);
  }

  const updatedAct: TreatmentAct = {
    ...act,
    approvedByDentistId:
      nextStatus === 'PLANNED' || nextStatus === 'COMPLETED'
        ? dentist.role === 'doctor'
          ? dentist.userId
          : act.approvedByDentistId
        : act.approvedByDentistId,
    performedByUserId:
      nextStatus === 'COMPLETED'
        ? visit.responsibleDentistId
        : act.performedByUserId,
    status: nextStatus,
    updatedAt: now,
  };

  return withAudit(
    {
      ...visit,
      acts: visit.acts.map((candidate) =>
        candidate.id === actId ? updatedAct : candidate,
      ),
      updatedAt: now,
    },
    'ACT_STATUS_CHANGED',
    dentist.userId,
    actId,
    now,
  );
};

export const assignWorkspaceDocumentation = (
  visit: TreatmentVisit,
  dentist: MockTreatmentActor,
  assistantId: string,
  handoffId: string,
  instruction: string,
  now: Date,
  assigneeRole: 'dental_assistant' | 'secretary' = 'dental_assistant',
): TreatmentVisit => {
  assertResponsibleDentist(visit, dentist);
  assertVisitEditable(visit);
  if (visit.status !== 'IN_PROGRESS' || visit.documentationHandoff) {
    throw new Error(
      'Only an in-progress visit without a handoff can be assigned.',
    );
  }
  if (!assistantId.trim() || assistantId === dentist.userId) {
    throw new Error(
      'A different assistant or secretariat user must be assigned.',
    );
  }
  const note = instruction.trim();
  if (!note) {
    throw new Error('Enter doctor instructions before assigning the handoff.');
  }
  const handoff: DocumentationHandoff = {
    assignedAt: now,
    assignedByDentistId: dentist.userId,
    assignedToUserId: assistantId,
    assignedToRole: assigneeRole,
    completedAt: null,
    completedByUserId: null,
    id: handoffId,
    note,
    reviewNote: null,
    reviewedAt: null,
    revision: 1,
    status: 'ASSIGNED',
    submittedAt: null,
  };
  return withAudit(
    {
      ...visit,
      documentationHandoff: handoff,
      status: 'IN_PROGRESS',
      updatedAt: now,
    },
    'DOCUMENTATION_ASSIGNED',
    dentist.userId,
    handoffId,
    now,
  );
};

export const startWorkspaceDocumentation = (
  visit: TreatmentVisit,
  assistant: MockTreatmentActor,
  now: Date,
): TreatmentVisit => {
  assertCanDocument(visit, assistant);
  const handoff = assertAssignedAssistant(visit, assistant);
  if (handoff.status !== 'ASSIGNED' && handoff.status !== 'RETURNED') {
    throw new Error('This documentation assignment cannot be started.');
  }
  return withAudit(
    {
      ...visit,
      documentationHandoff: { ...handoff, status: 'IN_PROGRESS' },
      status: 'IN_PROGRESS',
      updatedAt: now,
    },
    'DOCUMENTATION_STARTED',
    assistant.userId,
    handoff.id,
    now,
  );
};

export const completeWorkspaceVisit = (
  visit: TreatmentVisit,
  dentist: MockTreatmentActor,
  now: Date,
): TreatmentVisit => {
  assertCanDocument(visit, dentist);
  if (
    visit.findings.some(({ status }) => status === 'DRAFT') ||
    visit.acts.some(
      ({ id, status }) =>
        status === 'DRAFT' ||
        (status === 'IN_PROGRESS' &&
          !visit.treatmentSessions?.some(
            (session) =>
              session.planItemId === id &&
              session.visitId === visit.id &&
              session.status === 'COMPLETED',
          )),
    ) ||
    visit.treatmentSessions?.some(({ status }) => status === 'IN_PROGRESS') ||
    visit.periodontalExamination?.status === 'DRAFT'
  ) {
    throw new Error('Approve or resolve all draft clinical entries first.');
  }
  return withAudit(
    {
      ...visit,
      completedAt: now,
      completedByUserId: dentist.userId,
      status: 'COMPLETED',
      updatedAt: now,
      documentationHandoff:
        visit.documentationHandoff &&
        visit.documentationHandoff.status !== 'CANCELLED'
          ? {
              ...visit.documentationHandoff,
              status: 'COMPLETED',
              completedAt: now,
              completedByUserId: dentist.userId,
            }
          : visit.documentationHandoff,
    },
    'VISIT_COMPLETED',
    dentist.userId,
    null,
    now,
  );
};

export const assertCanDocument = (
  visit: TreatmentVisit,
  actor: MockTreatmentActor,
): void => {
  assertVisitEditable(visit);
  if (!canEditTreatmentDraft(visit, actor.userId, actor.role)) {
    throw new Error('An active documentation assignment is required.');
  }
};

const withAudit = (
  visit: TreatmentVisit,
  action: TreatmentAuditAction,
  actorUserId: string,
  recordId: string | null,
  occurredAt: Date,
  reason: string | null = null,
): TreatmentVisit => {
  const entry: TreatmentAuditEntry = {
    action,
    actorUserId,
    id: `${action}-${recordId ?? 'visit'}-${occurredAt.getTime()}`,
    occurredAt,
    reason,
    recordId,
  };
  return {
    ...visit,
    auditHistory: [...(visit.auditHistory ?? []), entry],
  };
};

const assertVisitEditable = (visit: TreatmentVisit): void => {
  if (visit.status === 'COMPLETED' || visit.status === 'CANCELLED') {
    throw new Error('This visit is read-only.');
  }
};

const assertResponsibleDentist = (
  visit: TreatmentVisit,
  actor: MockTreatmentActor,
): void => {
  if (actor.role !== 'doctor' || actor.userId !== visit.responsibleDentistId) {
    throw new Error('Only the responsible dentist can approve this record.');
  }
};

const assertAssignedAssistant = (
  visit: TreatmentVisit,
  actor: MockTreatmentActor,
): DocumentationHandoff => {
  const handoff = visit.documentationHandoff;
  if (
    (actor.role !== 'dental_assistant' && actor.role !== 'secretary') ||
    !handoff ||
    handoff.assignedToUserId !== actor.userId ||
    (handoff.assignedToRole ?? 'dental_assistant') !== actor.role
  ) {
    throw new Error('This assistant is not assigned to the visit.');
  }
  return handoff;
};
