import type {
  ClinicalFindingCode,
  TreatmentActCode,
} from './treatment-catalogue';

export const TREATMENT_VISIT_STATUSES = [
  'DRAFT',
  'IN_PROGRESS',
  'AWAITING_REVIEW',
  'READY_FOR_COMPLETION',
  'COMPLETED',
  'CANCELLED',
] as const;

export const DOCUMENTATION_HANDOFF_STATUSES = [
  'ASSIGNED',
  'IN_PROGRESS',
  'SUBMITTED',
  'RETURNED',
  'ACCEPTED',
  'CANCELLED',
] as const;

export const TREATMENT_ACT_STATUSES = [
  'DRAFT',
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'ENTERED_IN_ERROR',
] as const;

export const CLINICAL_FINDING_STATUSES = [
  'DRAFT',
  'CONFIRMED',
  'REFUTED',
  'ENTERED_IN_ERROR',
] as const;

export type TreatmentVisitStatus = (typeof TREATMENT_VISIT_STATUSES)[number];
export type DocumentationHandoffStatus =
  (typeof DOCUMENTATION_HANDOFF_STATUSES)[number];
export type TreatmentActStatus = (typeof TREATMENT_ACT_STATUSES)[number];
export type ClinicalFindingStatus = (typeof CLINICAL_FINDING_STATUSES)[number];
export type TreatmentActorRole = 'DOCTOR' | 'DENTAL_ASSISTANT' | 'ADMIN';
export type TreatmentTargetKind =
  | 'MOUTH'
  | 'ARCH'
  | 'TOOTH'
  | 'TOOTH_SURFACE'
  | 'PERIODONTAL_SITE'
  | 'BRIDGE_SPAN';
export type DentalArch = 'UPPER' | 'LOWER';
export type ToothSurface =
  | 'BUCCAL'
  | 'LINGUAL'
  | 'MESIAL'
  | 'DISTAL'
  | 'OCCLUSAL';
export type PeriodontalSite = 'MB' | 'B' | 'DB' | 'ML' | 'L' | 'DL';

export interface TreatmentActor {
  readonly userId: string;
  readonly role: TreatmentActorRole;
}

export interface ClinicalTarget {
  readonly kind: TreatmentTargetKind;
  readonly arch: DentalArch | null;
  readonly toothNumbers: readonly number[];
  readonly surfaces: readonly ToothSurface[];
  readonly periodontalSites: readonly PeriodontalSite[];
}

export interface ClinicalDetail {
  readonly key: string;
  readonly value: string | number | boolean;
}

export interface ClinicalFinding {
  readonly id: string;
  readonly code: ClinicalFindingCode;
  readonly status: ClinicalFindingStatus;
  readonly target: ClinicalTarget;
  readonly details: readonly ClinicalDetail[];
  readonly note: string | null;
  readonly enteredByUserId: string;
  readonly verifiedByUserId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TreatmentAct {
  readonly id: string;
  readonly code: TreatmentActCode;
  readonly status: TreatmentActStatus;
  readonly target: ClinicalTarget;
  readonly details: readonly ClinicalDetail[];
  readonly note: string | null;
  readonly enteredByUserId: string;
  readonly approvedByDentistId: string | null;
  readonly performedByUserId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface DocumentationHandoff {
  readonly id: string;
  readonly status: DocumentationHandoffStatus;
  readonly assignedByDentistId: string;
  readonly assignedToAssistantId: string;
  readonly note: string | null;
  readonly reviewNote: string | null;
  readonly revision: number;
  readonly assignedAt: Date;
  readonly submittedAt: Date | null;
  readonly reviewedAt: Date | null;
}

export interface TreatmentVisit {
  readonly id: string;
  readonly clinicId: string;
  readonly patientId: string;
  readonly responsibleDentistId: string;
  readonly appointmentId: string | null;
  readonly queueEntryId: string | null;
  readonly chairId: string | null;
  readonly status: TreatmentVisitStatus;
  readonly chiefComplaint: string | null;
  readonly clinicalNotes: string | null;
  readonly findings: readonly ClinicalFinding[];
  readonly acts: readonly TreatmentAct[];
  readonly documentationHandoff: DocumentationHandoff | null;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly cancellationReason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateTreatmentVisitInput {
  readonly id: string;
  readonly clinicId: string;
  readonly patientId: string;
  readonly responsibleDentistId: string;
  readonly appointmentId?: string | null;
  readonly queueEntryId?: string | null;
  readonly chairId?: string | null;
  readonly chiefComplaint?: string | null;
}

export function createTreatmentVisit(
  input: CreateTreatmentVisitInput,
  actor: TreatmentActor,
  now: Date,
): TreatmentVisit {
  if (actor.role !== 'DOCTOR' || actor.userId !== input.responsibleDentistId) {
    throw new TreatmentDomainError(
      'CLINICAL_AUTHORITY_REQUIRED',
      'The responsible dentist must create the treatment visit.',
    );
  }

  for (const [field, value] of Object.entries({
    id: input.id,
    clinicId: input.clinicId,
    patientId: input.patientId,
    responsibleDentistId: input.responsibleDentistId,
  })) {
    if (!value.trim()) {
      throw new TreatmentDomainError(
        'INVALID_TREATMENT_VISIT',
        `${field} must not be blank.`,
      );
    }
  }

  return {
    ...input,
    appointmentId: input.appointmentId ?? null,
    queueEntryId: input.queueEntryId ?? null,
    chairId: input.chairId ?? null,
    chiefComplaint: input.chiefComplaint ?? null,
    status: 'DRAFT',
    clinicalNotes: null,
    findings: [],
    acts: [],
    documentationHandoff: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: now,
    updatedAt: now,
  };
}

export type TreatmentDomainErrorCode =
  | 'CLINICAL_AUTHORITY_REQUIRED'
  | 'DOCUMENTATION_ASSIGNMENT_REQUIRED'
  | 'INVALID_LIFECYCLE_TRANSITION' 
  | 'INVALID_TREATMENT_VISIT'
  | 'UNRESOLVED_CLINICAL_DRAFTS';

export class TreatmentDomainError extends Error {
  constructor(
    public readonly code: TreatmentDomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'TreatmentDomainError';
  }
}
