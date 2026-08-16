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

export const TREATMENT_TARGET_KINDS = [
  'MOUTH',
  'ARCH',
  'TOOTH',
  'TOOTH_SURFACE',
  'TOOTH_REGION',
  'INDEX_SURFACE',
  'PERIODONTAL_SITE',
  'FURCATION_ENTRANCE',
  'BRIDGE_SPAN',
] as const;

export const TREATMENT_ACT_CODES = [
  'FISSURE_SEALING',
  'DIRECT_FILLING',
  'CROWN',
  'INLAY',
  'ONLAY',
  'VENEER',
  'BRIDGE',
  'ROOT_CANAL_MEDICATION',
  'ROOT_CANAL_FILLING',
  'ROOT_CANAL_REPAIR',
  'GLASS_FIBER_POST',
  'METAL_POST',
  'APICOECTOMY',
  'PARAPULPAL_PIN',
  'EXTRACTION',
  'IMPLANT_PLACEMENT',
  'HEALING_ABUTMENT',
  'LOCATOR_ATTACHMENT',
  'LOCATOR_OVERDENTURE',
  'BAR_ATTACHMENT',
  'BAR_OVERDENTURE',
  'PARTIAL_REMOVABLE_DENTURE',
  'COMPLETE_REMOVABLE_DENTURE',
  'CROWN_REPLACEMENT',
  'ORTHODONTIC_APPLIANCE',
] as const;

export const CLINICAL_FINDING_CODES = [
  'TOOTH_STATE',
  'TOOTH_SUBSTRATE',
  'CARIES',
  'ROOT_CARIES',
  'EXISTING_FILLING',
  'EXISTING_FIXED_RESTORATION',
  'EXISTING_ENDODONTIC_STATE',
  'EXISTING_PROSTHESIS',
  'CALCULUS',
  'CONTACT_POINT_DEFECT',
  'TOOTH_FRACTURE',
  'MOBILITY',
  'PERIODONTAL_INVOLVEMENT',
  'PERIAPICAL_LESION',
  'EXTRACTION_WOUND',
  'CROWN_LEAKAGE',
  'PULP_DIAGNOSIS',
  'APICAL_DIAGNOSIS',
  'ROOT_RESORPTION',
  'TOOTH_WEAR',
  'DISCOLORATION',
  'ORTHODONTIC_STATE',
  'PERI_IMPLANT_STATUS',
  'PERIODONTAL_MEASUREMENT',
  'FURCATION_INVOLVEMENT',
  'PLAQUE_FINDING',
  'GINGIVAL_FINDING',
] as const;

export type TreatmentVisitStatus = (typeof TREATMENT_VISIT_STATUSES)[number];
export type DocumentationHandoffStatus =
  (typeof DOCUMENTATION_HANDOFF_STATUSES)[number];
export type TreatmentActStatus = (typeof TREATMENT_ACT_STATUSES)[number];
export type ClinicalFindingStatus = (typeof CLINICAL_FINDING_STATUSES)[number];
export type TreatmentTargetKind = (typeof TREATMENT_TARGET_KINDS)[number];
export type TreatmentActCode = (typeof TREATMENT_ACT_CODES)[number];
export type ClinicalFindingCode = (typeof CLINICAL_FINDING_CODES)[number];
export type DentalArch = 'UPPER' | 'LOWER';
export type ToothSurface =
  | 'BUCCAL'
  | 'LINGUAL'
  | 'MESIAL'
  | 'DISTAL'
  | 'OCCLUSAL';
export type IndexSurface = Exclude<ToothSurface, 'OCCLUSAL'>;
export type PeriodontalSite = 'MB' | 'B' | 'DB' | 'ML' | 'L' | 'DL';
export type FurcationEntrance = 'MESIAL' | 'DISTAL' | 'BUCCAL' | 'LINGUAL';

export interface ClinicalTarget {
  kind: TreatmentTargetKind;
  arch: DentalArch | null;
  toothNumbers: readonly number[];
  surfaces: readonly ToothSurface[];
  periodontalSites: readonly (PeriodontalSite | FurcationEntrance)[];
}

/** Target geometries used by typed Treatment creation paths. */
export interface ToothTarget extends ClinicalTarget {
  readonly kind: 'TOOTH';
}

export interface RestorativeSurfaceTarget extends ClinicalTarget {
  readonly kind: 'TOOTH_SURFACE';
  readonly surfaces: readonly ToothSurface[];
}

export interface ToothRegionTarget extends ClinicalTarget {
  readonly kind: 'TOOTH_REGION';
  readonly surfaces: readonly ('MESIAL' | 'DISTAL' | 'OCCLUSAL')[];
}

export interface IndexSurfaceTarget extends ClinicalTarget {
  readonly kind: 'INDEX_SURFACE';
  readonly surfaces: readonly IndexSurface[];
}

export interface PeriodontalSiteTarget extends ClinicalTarget {
  readonly kind: 'PERIODONTAL_SITE';
  readonly periodontalSites: readonly PeriodontalSite[];
}

export interface FurcationEntranceTarget extends ClinicalTarget {
  readonly kind: 'FURCATION_ENTRANCE';
  readonly periodontalSites: readonly FurcationEntrance[];
}

export interface BridgeSpanTarget extends ClinicalTarget {
  readonly kind: 'BRIDGE_SPAN';
}

export interface ArchTarget extends ClinicalTarget {
  readonly kind: 'ARCH';
  readonly arch: DentalArch;
}

export interface MouthTarget extends ClinicalTarget {
  readonly kind: 'MOUTH';
}

export type TypedTreatmentTarget =
  | MouthTarget
  | ArchTarget
  | ToothTarget
  | RestorativeSurfaceTarget
  | ToothRegionTarget
  | IndexSurfaceTarget
  | PeriodontalSiteTarget
  | FurcationEntranceTarget
  | BridgeSpanTarget;

export interface ClinicalDetail {
  key: string;
  value: string | number | boolean;
}

export interface ClinicalFinding {
  id: string;
  code: ClinicalFindingCode;
  status: ClinicalFindingStatus;
  target: ClinicalTarget;
  details: readonly ClinicalDetail[];
  note: string | null;
  enteredByUserId: string;
  verifiedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TreatmentAct {
  id: string;
  code: TreatmentActCode;
  status: TreatmentActStatus;
  target: ClinicalTarget;
  details: readonly ClinicalDetail[];
  note: string | null;
  enteredByUserId: string;
  approvedByDentistId: string | null;
  performedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentationHandoff {
  id: string;
  status: DocumentationHandoffStatus;
  assignedByDentistId: string;
  assignedToAssistantId: string;
  note: string | null;
  reviewNote: string | null;
  revision: number;
  assignedAt: Date;
  submittedAt: Date | null;
  reviewedAt: Date | null;
}

export interface TreatmentVisit {
  id: string;
  clinicId: string;
  patientId: string;
  responsibleDentistId: string;
  appointmentId: string | null;
  queueEntryId: string | null;
  chairId: string | null;
  status: TreatmentVisitStatus;
  chiefComplaint: string | null;
  clinicalNotes: string | null;
  findings: readonly ClinicalFinding[];
  acts: readonly TreatmentAct[];
  readonly periodontalExamination?: PeriodontalExamination | null;
  documentationHandoff: DocumentationHandoff | null;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TreatmentLaunchContext {
  appointmentId: string | null;
  chairId: string | null;
  doctorId: string;
  patientId: string;
  queueEntryId: string | null;
}

export const treatmentVisitStatusLabels = {
  DRAFT: 'Draft',
  IN_PROGRESS: 'In progress',
  AWAITING_REVIEW: 'Awaiting dentist review',
  READY_FOR_COMPLETION: 'Ready for completion',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} satisfies Record<TreatmentVisitStatus, string>;

export const documentationHandoffStatusLabels = {
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'Assistant documenting',
  SUBMITTED: 'Submitted for review',
  RETURNED: 'Returned for correction',
  ACCEPTED: 'Accepted by dentist',
  CANCELLED: 'Cancelled',
} satisfies Record<DocumentationHandoffStatus, string>;
import type { PeriodontalExamination } from './periodontal';
