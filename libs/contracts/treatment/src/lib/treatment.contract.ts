import { resolve } from 'node:path';

import type { Observable } from 'rxjs';

export const TREATMENT_PACKAGE_NAME = 'treatment';
export const TREATMENT_SERVICE_NAME = 'TreatmentService';

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

export const TREATMENT_ACT_CATEGORIES = [
  'PREVENTIVE',
  'RESTORATIVE',
  'ENDODONTIC',
  'ORAL_SURGERY',
  'IMPLANT',
  'PROSTHODONTIC',
  'ORTHODONTIC',
] as const;

export const TREATMENT_TARGET_KINDS = [
  'MOUTH',
  'ARCH',
  'TOOTH',
  'TOOTH_SURFACE',
  'PERIODONTAL_SITE',
  'BRIDGE_SPAN',
] as const;

export const DENTAL_ARCHES = ['UPPER', 'LOWER'] as const;
export const TOOTH_SURFACES = [
  'BUCCAL',
  'LINGUAL',
  'MESIAL',
  'DISTAL',
  'OCCLUSAL',
] as const;
export const PERIODONTAL_SITES = ['MB', 'B', 'DB', 'ML', 'L', 'DL'] as const;

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

export const CLINICAL_DETAIL_KEYS = [
  'ICDAS_CARS_SEVERITY',
  'RADIOGRAPHIC_DEPTH',
  'FILLING_MATERIAL',
  'FILLING_DEFECT',
  'RESTORATION_TYPE',
  'RESTORATION_MATERIAL',
  'ENDODONTIC_STATE',
  'PROSTHESIS_TYPE',
  'TOOTH_STATE',
  'TOOTH_SUBSTRATE',
  'MOBILITY_GRADE',
  'PERIAPICAL_LESION_TYPE',
  'PULP_DIAGNOSIS',
  'APICAL_DIAGNOSIS',
  'ROOT_RESORPTION_TYPE',
  'ROOT_CARIES_STATE',
  'WEAR_TYPE',
  'DISCOLORATION_TYPE',
  'ORTHODONTIC_STATE',
  'PERI_IMPLANT_STATE',
  'PROBING_DEPTH_MM',
  'GINGIVAL_MARGIN_MM',
  'BLEEDING_ON_PROBING',
  'SUPPURATION',
  'FURCATION_GRADE',
  'PLAQUE_PRESENT',
] as const;

export type TreatmentVisitStatus = (typeof TREATMENT_VISIT_STATUSES)[number];
export type DocumentationHandoffStatus =
  (typeof DOCUMENTATION_HANDOFF_STATUSES)[number];
export type TreatmentActStatus = (typeof TREATMENT_ACT_STATUSES)[number];
export type ClinicalFindingStatus = (typeof CLINICAL_FINDING_STATUSES)[number];
export type TreatmentActCategory = (typeof TREATMENT_ACT_CATEGORIES)[number];
export type TreatmentTargetKind = (typeof TREATMENT_TARGET_KINDS)[number];
export type DentalArch = (typeof DENTAL_ARCHES)[number];
export type ToothSurface = (typeof TOOTH_SURFACES)[number];
export type PeriodontalSite = (typeof PERIODONTAL_SITES)[number];
export type TreatmentActCode = (typeof TREATMENT_ACT_CODES)[number];
export type ClinicalFindingCode = (typeof CLINICAL_FINDING_CODES)[number];
export type ClinicalDetailKey = (typeof CLINICAL_DETAIL_KEYS)[number];

export interface TreatmentCatalogueEntry {
  readonly code: TreatmentActCode;
  readonly category: TreatmentActCategory;
  readonly display: string;
  readonly allowedTargets: readonly TreatmentTargetKind[];
  readonly supportedDetailKeys: readonly ClinicalDetailKey[];
  readonly requiresDentistApproval: true;
}

const act = (
  code: TreatmentActCode,
  category: TreatmentActCategory,
  display: string,
  allowedTargets: readonly TreatmentTargetKind[],
  supportedDetailKeys: readonly ClinicalDetailKey[] = [],
): TreatmentCatalogueEntry => ({
  code,
  category,
  display,
  allowedTargets,
  supportedDetailKeys,
  requiresDentistApproval: true,
});

/**
 * The first Clinora-owned treatment catalogue. It is intentionally distinct
 * from findings: caries and diagnoses describe clinical state; these entries
 * describe proposed, active, or performed care.
 */
export const SUPPORTED_TREATMENT_ACT_CATALOGUE = [
  act('FISSURE_SEALING', 'PREVENTIVE', 'Fissure sealing', [
    'TOOTH',
    'TOOTH_SURFACE',
  ]),
  act(
    'DIRECT_FILLING',
    'RESTORATIVE',
    'Direct filling',
    ['TOOTH_SURFACE'],
    ['FILLING_MATERIAL'],
  ),
  act('CROWN', 'RESTORATIVE', 'Crown', ['TOOTH'], ['RESTORATION_MATERIAL']),
  act(
    'INLAY',
    'RESTORATIVE',
    'Inlay',
    ['TOOTH', 'TOOTH_SURFACE'],
    ['RESTORATION_MATERIAL'],
  ),
  act(
    'ONLAY',
    'RESTORATIVE',
    'Onlay',
    ['TOOTH', 'TOOTH_SURFACE'],
    ['RESTORATION_MATERIAL'],
  ),
  act('VENEER', 'RESTORATIVE', 'Veneer', ['TOOTH'], ['RESTORATION_MATERIAL']),
  act(
    'BRIDGE',
    'PROSTHODONTIC',
    'Fixed bridge',
    ['BRIDGE_SPAN'],
    ['RESTORATION_MATERIAL'],
  ),
  act('ROOT_CANAL_MEDICATION', 'ENDODONTIC', 'Root canal medication', [
    'TOOTH',
  ]),
  act('ROOT_CANAL_FILLING', 'ENDODONTIC', 'Root canal filling', ['TOOTH']),
  act('ROOT_CANAL_REPAIR', 'ENDODONTIC', 'Incomplete root canal correction', [
    'TOOTH',
  ]),
  act('GLASS_FIBER_POST', 'ENDODONTIC', 'Glass fiber post', ['TOOTH']),
  act('METAL_POST', 'ENDODONTIC', 'Metal post', ['TOOTH']),
  act('APICOECTOMY', 'ENDODONTIC', 'Apicoectomy / root resection', ['TOOTH']),
  act('PARAPULPAL_PIN', 'RESTORATIVE', 'Parapulpal pin', ['TOOTH']),
  act('EXTRACTION', 'ORAL_SURGERY', 'Tooth extraction', ['TOOTH']),
  act('IMPLANT_PLACEMENT', 'IMPLANT', 'Dental implant placement', ['TOOTH']),
  act('HEALING_ABUTMENT', 'IMPLANT', 'Healing abutment', ['TOOTH']),
  act('LOCATOR_ATTACHMENT', 'PROSTHODONTIC', 'Locator attachment', ['TOOTH']),
  act('LOCATOR_OVERDENTURE', 'PROSTHODONTIC', 'Locator overdenture', ['ARCH']),
  act('BAR_ATTACHMENT', 'PROSTHODONTIC', 'Bar attachment', ['TOOTH', 'ARCH']),
  act('BAR_OVERDENTURE', 'PROSTHODONTIC', 'Bar overdenture', ['ARCH']),
  act(
    'PARTIAL_REMOVABLE_DENTURE',
    'PROSTHODONTIC',
    'Partial removable denture',
    ['ARCH'],
  ),
  act(
    'COMPLETE_REMOVABLE_DENTURE',
    'PROSTHODONTIC',
    'Complete removable denture',
    ['ARCH'],
  ),
  act(
    'CROWN_REPLACEMENT',
    'RESTORATIVE',
    'Crown replacement',
    ['TOOTH'],
    ['RESTORATION_MATERIAL'],
  ),
  act(
    'ORTHODONTIC_APPLIANCE',
    'ORTHODONTIC',
    'Orthodontic appliance',
    ['TOOTH', 'ARCH'],
    ['ORTHODONTIC_STATE'],
  ),
] as const satisfies readonly TreatmentCatalogueEntry[];

export interface ClinicalFindingCatalogueEntry {
  readonly code: ClinicalFindingCode;
  readonly display: string;
  readonly allowedTargets: readonly TreatmentTargetKind[];
  readonly supportedDetailKeys: readonly ClinicalDetailKey[];
}

const finding = (
  code: ClinicalFindingCode,
  display: string,
  allowedTargets: readonly TreatmentTargetKind[],
  supportedDetailKeys: readonly ClinicalDetailKey[] = [],
): ClinicalFindingCatalogueEntry => ({
  code,
  display,
  allowedTargets,
  supportedDetailKeys,
});

/** Clinical charting coverage adapted from the audited ZoliQua feature set. */
export const SUPPORTED_CLINICAL_FINDING_CATALOGUE = [
  finding('TOOTH_STATE', 'Tooth state', ['TOOTH'], ['TOOTH_STATE']),
  finding('TOOTH_SUBSTRATE', 'Tooth substrate', ['TOOTH'], ['TOOTH_SUBSTRATE']),
  finding(
    'CARIES',
    'Dental caries',
    ['TOOTH_SURFACE'],
    ['ICDAS_CARS_SEVERITY', 'RADIOGRAPHIC_DEPTH'],
  ),
  finding('ROOT_CARIES', 'Root caries', ['TOOTH'], ['ROOT_CARIES_STATE']),
  finding(
    'EXISTING_FILLING',
    'Existing filling',
    ['TOOTH_SURFACE'],
    ['FILLING_MATERIAL', 'FILLING_DEFECT'],
  ),
  finding(
    'EXISTING_FIXED_RESTORATION',
    'Existing fixed restoration',
    ['TOOTH', 'BRIDGE_SPAN'],
    ['RESTORATION_TYPE', 'RESTORATION_MATERIAL'],
  ),
  finding(
    'EXISTING_ENDODONTIC_STATE',
    'Existing endodontic state',
    ['TOOTH'],
    ['ENDODONTIC_STATE'],
  ),
  finding(
    'EXISTING_PROSTHESIS',
    'Existing prosthesis or attachment',
    ['TOOTH', 'ARCH'],
    ['PROSTHESIS_TYPE'],
  ),
  finding('CALCULUS', 'Dental calculus', ['TOOTH']),
  finding('CONTACT_POINT_DEFECT', 'Contact point defect', ['TOOTH_SURFACE']),
  finding('TOOTH_FRACTURE', 'Tooth fracture', ['TOOTH_SURFACE']),
  finding('MOBILITY', 'Tooth mobility', ['TOOTH'], ['MOBILITY_GRADE']),
  finding('PERIODONTAL_INVOLVEMENT', 'Periodontal involvement', ['TOOTH']),
  finding(
    'PERIAPICAL_LESION',
    'Periapical lesion',
    ['TOOTH'],
    ['PERIAPICAL_LESION_TYPE'],
  ),
  finding('EXTRACTION_WOUND', 'Extraction wound', ['TOOTH']),
  finding('CROWN_LEAKAGE', 'Crown marginal leakage', ['TOOTH']),
  finding('PULP_DIAGNOSIS', 'Pulp diagnosis', ['TOOTH'], ['PULP_DIAGNOSIS']),
  finding(
    'APICAL_DIAGNOSIS',
    'Apical diagnosis',
    ['TOOTH'],
    ['APICAL_DIAGNOSIS'],
  ),
  finding(
    'ROOT_RESORPTION',
    'Root resorption',
    ['TOOTH'],
    ['ROOT_RESORPTION_TYPE'],
  ),
  finding(
    'TOOTH_WEAR',
    'Tooth wear',
    ['TOOTH', 'TOOTH_SURFACE'],
    ['WEAR_TYPE'],
  ),
  finding(
    'DISCOLORATION',
    'Tooth discoloration',
    ['TOOTH'],
    ['DISCOLORATION_TYPE'],
  ),
  finding(
    'ORTHODONTIC_STATE',
    'Orthodontic state',
    ['TOOTH'],
    ['ORTHODONTIC_STATE'],
  ),
  finding(
    'PERI_IMPLANT_STATUS',
    'Peri-implant status',
    ['TOOTH'],
    ['PERI_IMPLANT_STATE'],
  ),
  finding(
    'PERIODONTAL_MEASUREMENT',
    'Periodontal measurement',
    ['PERIODONTAL_SITE'],
    [
      'PROBING_DEPTH_MM',
      'GINGIVAL_MARGIN_MM',
      'BLEEDING_ON_PROBING',
      'SUPPURATION',
    ],
  ),
  finding(
    'FURCATION_INVOLVEMENT',
    'Furcation involvement',
    ['TOOTH'],
    ['FURCATION_GRADE'],
  ),
  finding(
    'PLAQUE_FINDING',
    'Plaque finding',
    ['TOOTH_SURFACE'],
    ['PLAQUE_PRESENT'],
  ),
  finding('GINGIVAL_FINDING', 'Gingival finding', ['TOOTH_SURFACE']),
] as const satisfies readonly ClinicalFindingCatalogueEntry[];

export function resolveTreatmentProtoPath(): string {
  return resolve(
    process.env['TREATMENT_PROTO_PATH'] ??
      'libs/contracts/treatment/src/lib/treatment.proto',
  );
}

export interface ClinicalTargetReply {
  kind: string;
  arch: string;
  toothNumbers: number[];
  surfaces: string[];
  periodontalSites: string[];
}

export interface ClinicalDetailReply {
  key: string;
  stringValue: string;
  integerValue?: number;
  booleanValue?: boolean;
}

export interface ClinicalFindingReply {
  id: string;
  code: string;
  status: string;
  target: ClinicalTargetReply;
  details: ClinicalDetailReply[];
  note: string;
  enteredByUserId: string;
  verifiedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TreatmentActReply {
  id: string;
  code: string;
  status: string;
  target: ClinicalTargetReply;
  details: ClinicalDetailReply[];
  note: string;
  enteredByUserId: string;
  approvedByDentistId: string;
  performedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentationHandoffReply {
  id: string;
  status: string;
  assignedByDentistId: string;
  assignedToAssistantId: string;
  note: string;
  reviewNote: string;
  revision: number;
  assignedAt: string;
  submittedAt: string;
  reviewedAt: string;
}

export interface TreatmentVisitReply {
  id: string;
  clinicId: string;
  patientId: string;
  responsibleDentistId: string;
  appointmentId: string;
  queueEntryId: string;
  chairId: string;
  status: string;
  chiefComplaint: string;
  clinicalNotes: string;
  findings: ClinicalFindingReply[];
  acts: TreatmentActReply[];
  documentationHandoff?: DocumentationHandoffReply;
  startedAt: string;
  completedAt: string;
  cancelledAt: string;
  cancellationReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetTreatmentVisitRequest {
  clinicId: string;
  visitId: string;
}

export interface ListPatientTreatmentVisitsRequest {
  clinicId: string;
  patientId: string;
  page?: number;
  limit?: number;
}

export interface TreatmentVisitsListReply {
  visits: TreatmentVisitReply[];
  total: number;
}

export interface CreateTreatmentVisitRequest {
  clinicId: string;
  patientId: string;
  responsibleDentistId: string;
  actorUserId: string;
  appointmentId?: string;
  queueEntryId?: string;
  chairId?: string;
  chiefComplaint?: string;
}

export interface StartTreatmentVisitRequest extends GetTreatmentVisitRequest {
  actorUserId: string;
}

export interface RecordClinicalFindingRequest extends GetTreatmentVisitRequest {
  actorUserId: string;
  code: ClinicalFindingCode;
  target: ClinicalTargetReply;
  details?: ClinicalDetailReply[];
  note?: string;
}

export interface RecordTreatmentActRequest extends GetTreatmentVisitRequest {
  actorUserId: string;
  code: TreatmentActCode;
  target: ClinicalTargetReply;
  details?: ClinicalDetailReply[];
  note?: string;
}

export interface TransitionTreatmentActRequest
  extends GetTreatmentVisitRequest {
  actorUserId: string;
  actId: string;
  status: TreatmentActStatus;
  reason?: string;
}

export interface AssignVisitDocumentationRequest
  extends GetTreatmentVisitRequest {
  actorUserId: string;
  assistantId: string;
  note?: string;
}

export interface UpdateDocumentationHandoffRequest
  extends GetTreatmentVisitRequest {
  actorUserId: string;
  note?: string;
}

export interface ReviewDocumentationHandoffRequest
  extends UpdateDocumentationHandoffRequest {
  decision: 'ACCEPT' | 'RETURN';
}

export interface CompleteTreatmentVisitRequest
  extends GetTreatmentVisitRequest {
  actorUserId: string;
}

export interface CancelTreatmentVisitRequest extends GetTreatmentVisitRequest {
  actorUserId: string;
  reason: string;
}

export interface TreatmentCatalogueReply {
  treatmentActs: TreatmentCatalogueEntry[];
  clinicalFindings: ClinicalFindingCatalogueEntry[];
}

export interface TreatmentServiceClient {
  getTreatmentVisit(
    request: GetTreatmentVisitRequest,
  ): Observable<TreatmentVisitReply>;
  listPatientTreatmentVisits(
    request: ListPatientTreatmentVisitsRequest,
  ): Observable<TreatmentVisitsListReply>;
  createTreatmentVisit(
    request: CreateTreatmentVisitRequest,
  ): Observable<TreatmentVisitReply>;
  startTreatmentVisit(
    request: StartTreatmentVisitRequest,
  ): Observable<TreatmentVisitReply>;
  recordClinicalFinding(
    request: RecordClinicalFindingRequest,
  ): Observable<TreatmentVisitReply>;
  recordTreatmentAct(
    request: RecordTreatmentActRequest,
  ): Observable<TreatmentVisitReply>;
  transitionTreatmentAct(
    request: TransitionTreatmentActRequest,
  ): Observable<TreatmentVisitReply>;
  assignVisitDocumentation(
    request: AssignVisitDocumentationRequest,
  ): Observable<TreatmentVisitReply>;
  startVisitDocumentation(
    request: UpdateDocumentationHandoffRequest,
  ): Observable<TreatmentVisitReply>;
  submitVisitDocumentation(
    request: UpdateDocumentationHandoffRequest,
  ): Observable<TreatmentVisitReply>;
  reviewVisitDocumentation(
    request: ReviewDocumentationHandoffRequest,
  ): Observable<TreatmentVisitReply>;
  completeTreatmentVisit(
    request: CompleteTreatmentVisitRequest,
  ): Observable<TreatmentVisitReply>;
  cancelTreatmentVisit(
    request: CancelTreatmentVisitRequest,
  ): Observable<TreatmentVisitReply>;
  getTreatmentCatalogue(
    request: Record<string, never>,
  ): Observable<TreatmentCatalogueReply>;
}
