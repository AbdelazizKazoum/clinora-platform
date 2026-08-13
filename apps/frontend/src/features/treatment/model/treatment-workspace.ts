import type {
  ClinicalDetail,
  ClinicalFinding,
  ClinicalFindingCode,
  ClinicalTarget,
  DocumentationHandoff,
  TreatmentAct,
  TreatmentActCode,
  TreatmentActStatus,
  TreatmentVisit,
} from './treatment';
import type { TreatmentWorkspaceRole } from './treatment.rules';

export interface MockTreatmentActor {
  readonly userId: string;
  readonly name: string;
  readonly role: Extract<TreatmentWorkspaceRole, 'doctor' | 'dental_assistant'>;
}

export interface RecordWorkspaceFindingInput {
  readonly id: string;
  readonly code: ClinicalFindingCode;
  readonly target: ClinicalTarget;
  readonly details?: readonly ClinicalDetail[];
  readonly note?: string | null;
}

export interface RecordWorkspaceActInput {
  readonly id: string;
  readonly code: TreatmentActCode;
  readonly target: ClinicalTarget;
  readonly details?: readonly ClinicalDetail[];
  readonly note?: string | null;
}

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
  const dentistEntry = actor.role === 'doctor';
  const finding: ClinicalFinding = {
    code: input.code,
    createdAt: now,
    details: input.details ?? [],
    enteredByUserId: actor.userId,
    id: input.id,
    note: input.note ?? null,
    status: dentistEntry ? 'CONFIRMED' : 'DRAFT',
    target: input.target,
    updatedAt: now,
    verifiedByUserId: dentistEntry ? actor.userId : null,
  };

  return {
    ...visit,
    findings: [...visit.findings, finding],
    updatedAt: now,
  };
};

export const recordWorkspaceAct = (
  visit: TreatmentVisit,
  actor: MockTreatmentActor,
  input: RecordWorkspaceActInput,
  now: Date,
): TreatmentVisit => {
  assertCanDocument(visit, actor);
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
    status: dentistEntry ? 'PLANNED' : 'DRAFT',
    target: input.target,
    updatedAt: now,
  };

  return { ...visit, acts: [...visit.acts, act], updatedAt: now };
};

export const approveWorkspaceFinding = (
  visit: TreatmentVisit,
  dentist: MockTreatmentActor,
  findingId: string,
  now: Date,
): TreatmentVisit => {
  assertResponsibleDentist(visit, dentist);
  return {
    ...visit,
    findings: visit.findings.map((finding) =>
      finding.id === findingId
        ? {
            ...finding,
            status: 'CONFIRMED',
            updatedAt: now,
            verifiedByUserId: dentist.userId,
          }
        : finding,
    ),
    updatedAt: now,
  };
};

export const approveWorkspaceAct = (
  visit: TreatmentVisit,
  dentist: MockTreatmentActor,
  actId: string,
  now: Date,
): TreatmentVisit => {
  assertResponsibleDentist(visit, dentist);
  return {
    ...visit,
    acts: visit.acts.map((act) =>
      act.id === actId
        ? {
            ...act,
            approvedByDentistId: dentist.userId,
            status: 'PLANNED',
            updatedAt: now,
          }
        : act,
    ),
    updatedAt: now,
  };
};

export const transitionWorkspaceAct = (
  visit: TreatmentVisit,
  dentist: MockTreatmentActor,
  actId: string,
  nextStatus: TreatmentActStatus,
  now: Date,
): TreatmentVisit => {
  assertResponsibleDentist(visit, dentist);
  assertVisitEditable(visit);
  const act = visit.acts.find(({ id }) => id === actId);
  if (!act || !ACT_TRANSITIONS[act.status].includes(nextStatus)) {
    throw new Error(`Treatment act cannot transition to ${nextStatus}.`);
  }

  const updatedAct: TreatmentAct = {
    ...act,
    approvedByDentistId:
      nextStatus === 'PLANNED' || nextStatus === 'COMPLETED'
        ? dentist.userId
        : act.approvedByDentistId,
    performedByUserId:
      nextStatus === 'COMPLETED' ? dentist.userId : act.performedByUserId,
    status: nextStatus,
    updatedAt: now,
  };

  return {
    ...visit,
    acts: visit.acts.map((candidate) =>
      candidate.id === actId ? updatedAct : candidate,
    ),
    updatedAt: now,
  };
};

export const assignWorkspaceDocumentation = (
  visit: TreatmentVisit,
  dentist: MockTreatmentActor,
  assistantId: string,
  handoffId: string,
  now: Date,
): TreatmentVisit => {
  assertResponsibleDentist(visit, dentist);
  const handoff: DocumentationHandoff = {
    assignedAt: now,
    assignedByDentistId: dentist.userId,
    assignedToAssistantId: assistantId,
    id: handoffId,
    note: 'Enter today’s clinical findings and proposed acts for dentist review.',
    reviewNote: null,
    reviewedAt: null,
    revision: 1,
    status: 'ASSIGNED',
    submittedAt: null,
  };
  return {
    ...visit,
    documentationHandoff: handoff,
    status: 'IN_PROGRESS',
    updatedAt: now,
  };
};

export const startWorkspaceDocumentation = (
  visit: TreatmentVisit,
  assistant: MockTreatmentActor,
  now: Date,
): TreatmentVisit => {
  const handoff = assertAssignedAssistant(visit, assistant);
  if (handoff.status !== 'ASSIGNED' && handoff.status !== 'RETURNED') {
    throw new Error('This documentation assignment cannot be started.');
  }
  return {
    ...visit,
    documentationHandoff: { ...handoff, status: 'IN_PROGRESS' },
    status: 'IN_PROGRESS',
    updatedAt: now,
  };
};

export const submitWorkspaceDocumentation = (
  visit: TreatmentVisit,
  assistant: MockTreatmentActor,
  now: Date,
): TreatmentVisit => {
  const handoff = assertAssignedAssistant(visit, assistant);
  if (handoff.status !== 'IN_PROGRESS') {
    throw new Error('Start the documentation before submitting it.');
  }
  return {
    ...visit,
    documentationHandoff: {
      ...handoff,
      status: 'SUBMITTED',
      submittedAt: now,
    },
    status: 'AWAITING_REVIEW',
    updatedAt: now,
  };
};

export const reviewWorkspaceDocumentation = (
  visit: TreatmentVisit,
  dentist: MockTreatmentActor,
  decision: 'ACCEPT' | 'RETURN',
  now: Date,
): TreatmentVisit => {
  assertResponsibleDentist(visit, dentist);
  const handoff = visit.documentationHandoff;
  if (handoff?.status !== 'SUBMITTED') {
    throw new Error('Only submitted documentation can be reviewed.');
  }
  return {
    ...visit,
    documentationHandoff: {
      ...handoff,
      reviewNote:
        decision === 'RETURN'
          ? 'Please review the selected teeth and clinical details.'
          : null,
      reviewedAt: now,
      revision: decision === 'RETURN' ? handoff.revision + 1 : handoff.revision,
      status: decision === 'ACCEPT' ? 'ACCEPTED' : 'RETURNED',
    },
    status: decision === 'ACCEPT' ? 'READY_FOR_COMPLETION' : 'IN_PROGRESS',
    updatedAt: now,
  };
};

export const completeWorkspaceVisit = (
  visit: TreatmentVisit,
  dentist: MockTreatmentActor,
  now: Date,
): TreatmentVisit => {
  assertResponsibleDentist(visit, dentist);
  if (visit.status !== 'READY_FOR_COMPLETION') {
    throw new Error('Review the clinical record before completing the visit.');
  }
  if (
    visit.findings.some(({ status }) => status === 'DRAFT') ||
    visit.acts.some(
      ({ status }) => status === 'DRAFT' || status === 'IN_PROGRESS',
    )
  ) {
    throw new Error('Approve or resolve all draft clinical entries first.');
  }
  return { ...visit, completedAt: now, status: 'COMPLETED', updatedAt: now };
};

const assertCanDocument = (
  visit: TreatmentVisit,
  actor: MockTreatmentActor,
): void => {
  if (visit.status === 'COMPLETED' || visit.status === 'CANCELLED') {
    throw new Error('This visit is read-only.');
  }
  if (actor.role === 'doctor' && actor.userId === visit.responsibleDentistId) {
    return;
  }
  const handoff = visit.documentationHandoff;
  if (
    actor.role !== 'dental_assistant' ||
    handoff?.assignedToAssistantId !== actor.userId ||
    !['ASSIGNED', 'IN_PROGRESS', 'RETURNED'].includes(handoff.status)
  ) {
    throw new Error('An active assistant assignment is required.');
  }
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
    actor.role !== 'dental_assistant' ||
    !handoff ||
    handoff.assignedToAssistantId !== actor.userId
  ) {
    throw new Error('This assistant is not assigned to the visit.');
  }
  return handoff;
};
