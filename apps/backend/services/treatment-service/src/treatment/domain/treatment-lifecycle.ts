import {
  type ClinicalDetail,
  type ClinicalFinding,
  type ClinicalFindingStatus,
  type ClinicalTarget,
  type DocumentationHandoff,
  type TreatmentAct,
  type TreatmentActStatus,
  type TreatmentActor,
  TreatmentDomainError,
  type TreatmentVisit,
} from './treatment-visit';
import type {
  ClinicalFindingCode,
  TreatmentActCode,
} from './treatment-catalogue';

const ACT_TRANSITIONS: Readonly<
  Record<TreatmentActStatus, readonly TreatmentActStatus[]>
> = {
  DRAFT: ['PLANNED', 'CANCELLED', 'ENTERED_IN_ERROR'],
  PLANNED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ENTERED_IN_ERROR'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED', 'ENTERED_IN_ERROR'],
  COMPLETED: ['ENTERED_IN_ERROR'],
  CANCELLED: [],
  ENTERED_IN_ERROR: [],
};

const FINDING_TRANSITIONS: Readonly<
  Record<ClinicalFindingStatus, readonly ClinicalFindingStatus[]>
> = {
  DRAFT: ['CONFIRMED', 'REFUTED', 'ENTERED_IN_ERROR'],
  CONFIRMED: ['REFUTED', 'ENTERED_IN_ERROR'],
  REFUTED: ['ENTERED_IN_ERROR'],
  ENTERED_IN_ERROR: [],
};

const assertResponsibleDentist = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
): void => {
  if (actor.role !== 'DOCTOR' || actor.userId !== visit.responsibleDentistId) {
    throw new TreatmentDomainError(
      'CLINICAL_AUTHORITY_REQUIRED',
      'Only the responsible dentist may approve this clinical record.',
    );
  }
};

const assertVisitEditable = (visit: TreatmentVisit): void => {
  if (visit.status === 'COMPLETED' || visit.status === 'CANCELLED') {
    throw new TreatmentDomainError(
      'INVALID_LIFECYCLE_TRANSITION',
      `Visit ${visit.status.toLowerCase()} is immutable.`,
    );
  }
};

const assertAssignedAssistant = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
): DocumentationHandoff => {
  const handoff = visit.documentationHandoff;
  if (
    actor.role !== 'DENTAL_ASSISTANT' ||
    !handoff ||
    handoff.assignedToAssistantId !== actor.userId
  ) {
    throw new TreatmentDomainError(
      'DOCUMENTATION_ASSIGNMENT_REQUIRED',
      'An active documentation assignment is required.',
    );
  }

  return handoff;
};

export const canActorEditDraftDocumentation = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
): boolean => {
  if (visit.status === 'COMPLETED' || visit.status === 'CANCELLED') {
    return false;
  }
  if (actor.role === 'DOCTOR' && actor.userId === visit.responsibleDentistId) {
    return true;
  }

  const handoff = visit.documentationHandoff;
  return Boolean(
    actor.role === 'DENTAL_ASSISTANT' &&
      handoff?.assignedToAssistantId === actor.userId &&
      (handoff.status === 'ASSIGNED' ||
        handoff.status === 'IN_PROGRESS' ||
        handoff.status === 'RETURNED'),
  );
};

const assertActorCanRecordDraft = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
): void => {
  assertVisitEditable(visit);
  if (
    visit.status !== 'IN_PROGRESS' ||
    !canActorEditDraftDocumentation(visit, actor)
  ) {
    throw new TreatmentDomainError(
      'DOCUMENTATION_ASSIGNMENT_REQUIRED',
      'The actor cannot edit documentation for this visit.',
    );
  }
};

export const recordClinicalFinding = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
  input: {
    readonly id: string;
    readonly code: ClinicalFindingCode;
    readonly target: ClinicalTarget;
    readonly details?: readonly ClinicalDetail[];
    readonly note?: string | null;
  },
  now: Date,
): TreatmentVisit => {
  assertActorCanRecordDraft(visit, actor);
  if (!input.id.trim() || visit.findings.some(({ id }) => id === input.id)) {
    throw new TreatmentDomainError(
      'INVALID_TREATMENT_VISIT',
      'Clinical finding IDs must be unique and nonblank.',
    );
  }

  const enteredByDentist =
    actor.role === 'DOCTOR' && actor.userId === visit.responsibleDentistId;
  const finding: ClinicalFinding = {
    id: input.id,
    code: input.code,
    status: enteredByDentist ? 'CONFIRMED' : 'DRAFT',
    target: input.target,
    details: input.details ?? [],
    note: input.note ?? null,
    enteredByUserId: actor.userId,
    verifiedByUserId: enteredByDentist ? actor.userId : null,
    createdAt: now,
    updatedAt: now,
  };

  return {
    ...visit,
    findings: [...visit.findings, finding],
    updatedAt: now,
  };
};

export const transitionClinicalFinding = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
  findingId: string,
  nextStatus: Exclude<ClinicalFindingStatus, 'DRAFT'>,
  now: Date,
): TreatmentVisit => {
  assertResponsibleDentist(visit, actor);
  assertVisitEditable(visit);
  const finding = visit.findings.find(({ id }) => id === findingId);
  if (!finding || !FINDING_TRANSITIONS[finding.status].includes(nextStatus)) {
    throw new TreatmentDomainError(
      'INVALID_LIFECYCLE_TRANSITION',
      `Clinical finding cannot transition to ${nextStatus}.`,
    );
  }

  const updatedFinding: ClinicalFinding = {
    ...finding,
    status: nextStatus,
    verifiedByUserId:
      nextStatus === 'CONFIRMED' ? actor.userId : finding.verifiedByUserId,
    updatedAt: now,
  };

  return {
    ...visit,
    findings: visit.findings.map((candidate) =>
      candidate.id === findingId ? updatedFinding : candidate,
    ),
    updatedAt: now,
  };
};

export const recordTreatmentAct = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
  input: {
    readonly id: string;
    readonly code: TreatmentActCode;
    readonly target: ClinicalTarget;
    readonly details?: readonly ClinicalDetail[];
    readonly note?: string | null;
  },
  now: Date,
): TreatmentVisit => {
  assertActorCanRecordDraft(visit, actor);
  if (!input.id.trim() || visit.acts.some(({ id }) => id === input.id)) {
    throw new TreatmentDomainError(
      'INVALID_TREATMENT_VISIT',
      'Treatment act IDs must be unique and nonblank.',
    );
  }

  const enteredByDentist =
    actor.role === 'DOCTOR' && actor.userId === visit.responsibleDentistId;
  const treatmentAct: TreatmentAct = {
    id: input.id,
    code: input.code,
    status: enteredByDentist ? 'PLANNED' : 'DRAFT',
    target: input.target,
    details: input.details ?? [],
    note: input.note ?? null,
    enteredByUserId: actor.userId,
    approvedByDentistId: enteredByDentist ? actor.userId : null,
    performedByUserId: null,
    createdAt: now,
    updatedAt: now,
  };

  return {
    ...visit,
    acts: [...visit.acts, treatmentAct],
    updatedAt: now,
  };
};

export const startTreatmentVisit = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
  now: Date,
): TreatmentVisit => {
  assertResponsibleDentist(visit, actor);
  if (visit.status !== 'DRAFT') {
    throw new TreatmentDomainError(
      'INVALID_LIFECYCLE_TRANSITION',
      'Only a draft visit can be started.',
    );
  }

  return { ...visit, status: 'IN_PROGRESS', startedAt: now, updatedAt: now };
};

export const markVisitReadyForCompletion = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
  now: Date,
): TreatmentVisit => {
  assertResponsibleDentist(visit, actor);
  if (visit.status !== 'IN_PROGRESS') {
    throw new TreatmentDomainError(
      'INVALID_LIFECYCLE_TRANSITION',
      'Only an in-progress visit can be marked ready.',
    );
  }
  if (
    visit.documentationHandoff &&
    visit.documentationHandoff.status !== 'ACCEPTED'
  ) {
    throw new TreatmentDomainError(
      'INVALID_LIFECYCLE_TRANSITION',
      'Delegated documentation must be accepted before completion.',
    );
  }

  return { ...visit, status: 'READY_FOR_COMPLETION', updatedAt: now };
};

export const assignVisitDocumentation = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
  input: {
    readonly handoffId: string;
    readonly assistantId: string;
    readonly note?: string | null;
  },
  now: Date,
): TreatmentVisit => {
  assertResponsibleDentist(visit, actor);
  assertVisitEditable(visit);
  if (visit.status !== 'IN_PROGRESS') {
    throw new TreatmentDomainError(
      'INVALID_LIFECYCLE_TRANSITION',
      'Documentation can only be delegated during an in-progress visit.',
    );
  }
  if (!input.assistantId.trim() || input.assistantId === actor.userId) {
    throw new TreatmentDomainError(
      'INVALID_TREATMENT_VISIT',
      'A different dental assistant must be assigned.',
    );
  }
  if (
    visit.documentationHandoff &&
    !['ACCEPTED', 'CANCELLED'].includes(visit.documentationHandoff.status)
  ) {
    throw new TreatmentDomainError(
      'INVALID_LIFECYCLE_TRANSITION',
      'The current documentation assignment must finish first.',
    );
  }

  return {
    ...visit,
    documentationHandoff: {
      id: input.handoffId,
      status: 'ASSIGNED',
      assignedByDentistId: actor.userId,
      assignedToAssistantId: input.assistantId,
      note: input.note ?? null,
      reviewNote: null,
      revision: 1,
      assignedAt: now,
      submittedAt: null,
      reviewedAt: null,
    },
    updatedAt: now,
  };
};

export const startVisitDocumentation = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
  now: Date,
): TreatmentVisit => {
  assertVisitEditable(visit);
  const handoff = assertAssignedAssistant(visit, actor);
  if (handoff.status !== 'ASSIGNED' && handoff.status !== 'RETURNED') {
    throw new TreatmentDomainError(
      'INVALID_LIFECYCLE_TRANSITION',
      'Only assigned or returned documentation can be started.',
    );
  }

  return {
    ...visit,
    status: 'IN_PROGRESS',
    documentationHandoff: { ...handoff, status: 'IN_PROGRESS' },
    updatedAt: now,
  };
};

export const submitVisitDocumentation = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
  note: string | null,
  now: Date,
): TreatmentVisit => {
  assertVisitEditable(visit);
  const handoff = assertAssignedAssistant(visit, actor);
  if (handoff.status !== 'IN_PROGRESS') {
    throw new TreatmentDomainError(
      'INVALID_LIFECYCLE_TRANSITION',
      'Documentation must be in progress before submission.',
    );
  }

  return {
    ...visit,
    status: 'AWAITING_REVIEW',
    documentationHandoff: {
      ...handoff,
      status: 'SUBMITTED',
      note: note ?? handoff.note,
      submittedAt: now,
    },
    updatedAt: now,
  };
};

export const reviewVisitDocumentation = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
  decision: 'ACCEPT' | 'RETURN',
  reviewNote: string | null,
  now: Date,
): TreatmentVisit => {
  assertResponsibleDentist(visit, actor);
  const handoff = visit.documentationHandoff;
  if (visit.status !== 'AWAITING_REVIEW' || handoff?.status !== 'SUBMITTED') {
    throw new TreatmentDomainError(
      'INVALID_LIFECYCLE_TRANSITION',
      'Only submitted documentation can be reviewed.',
    );
  }
  if (decision === 'RETURN' && !reviewNote?.trim()) {
    throw new TreatmentDomainError(
      'INVALID_TREATMENT_VISIT',
      'A review note is required when documentation is returned.',
    );
  }

  return {
    ...visit,
    status: decision === 'ACCEPT' ? 'READY_FOR_COMPLETION' : 'IN_PROGRESS',
    documentationHandoff: {
      ...handoff,
      status: decision === 'ACCEPT' ? 'ACCEPTED' : 'RETURNED',
      reviewNote,
      revision: decision === 'RETURN' ? handoff.revision + 1 : handoff.revision,
      reviewedAt: now,
    },
    updatedAt: now,
  };
};

export const transitionTreatmentAct = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
  actId: string,
  nextStatus: TreatmentActStatus,
  now: Date,
): TreatmentVisit => {
  assertResponsibleDentist(visit, actor);
  assertVisitEditable(visit);
  const act = visit.acts.find(({ id }) => id === actId);
  if (!act || !ACT_TRANSITIONS[act.status].includes(nextStatus)) {
    throw new TreatmentDomainError(
      'INVALID_LIFECYCLE_TRANSITION',
      `Treatment act cannot transition to ${nextStatus}.`,
    );
  }

  const updatedAct: TreatmentAct = {
    ...act,
    status: nextStatus,
    approvedByDentistId:
      nextStatus === 'PLANNED' || nextStatus === 'COMPLETED'
        ? actor.userId
        : act.approvedByDentistId,
    performedByUserId:
      nextStatus === 'COMPLETED' ? actor.userId : act.performedByUserId,
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

export const completeTreatmentVisit = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
  now: Date,
): TreatmentVisit => {
  assertResponsibleDentist(visit, actor);
  if (visit.status !== 'READY_FOR_COMPLETION') {
    throw new TreatmentDomainError(
      'INVALID_LIFECYCLE_TRANSITION',
      'The visit must be reviewed and ready before completion.',
    );
  }
  const hasDraftFinding = visit.findings.some(
    ({ status }) => status === 'DRAFT',
  );
  const hasUnresolvedAct = visit.acts.some(({ status }) =>
    ['DRAFT', 'IN_PROGRESS'].includes(status),
  );
  if (hasDraftFinding || hasUnresolvedAct) {
    throw new TreatmentDomainError(
      'UNRESOLVED_CLINICAL_DRAFTS',
      'Draft findings and active treatment acts must be resolved first.',
    );
  }

  return {
    ...visit,
    status: 'COMPLETED',
    completedAt: now,
    updatedAt: now,
  };
};

export const cancelTreatmentVisit = (
  visit: TreatmentVisit,
  actor: TreatmentActor,
  reason: string,
  now: Date,
): TreatmentVisit => {
  assertVisitEditable(visit);
  const authorized =
    actor.role === 'ADMIN' ||
    (actor.role === 'DOCTOR' && actor.userId === visit.responsibleDentistId);
  if (!authorized) {
    throw new TreatmentDomainError(
      'CLINICAL_AUTHORITY_REQUIRED',
      'Only the responsible dentist or an administrator may cancel a visit.',
    );
  }
  if (!reason.trim()) {
    throw new TreatmentDomainError(
      'INVALID_TREATMENT_VISIT',
      'A cancellation reason is required.',
    );
  }

  return {
    ...visit,
    status: 'CANCELLED',
    documentationHandoff: visit.documentationHandoff
      ? { ...visit.documentationHandoff, status: 'CANCELLED' }
      : null,
    cancelledAt: now,
    cancellationReason: reason,
    updatedAt: now,
  };
};
