import type {
  ClinicalDetailResponseDto,
  ClinicalFindingResponseDto,
  ClinicalTargetResponseDto,
  DocumentationHandoffResponseDto,
  TreatmentActResponseDto,
  TreatmentVisitResponseDto,
} from '../api/dto/treatment-response.dto';
import {
  CLINICAL_FINDING_CODES,
  CLINICAL_FINDING_STATUSES,
  DOCUMENTATION_HANDOFF_STATUSES,
  TREATMENT_ACT_CODES,
  TREATMENT_ACT_STATUSES,
  TREATMENT_TARGET_KINDS,
  TREATMENT_VISIT_STATUSES,
  type ClinicalDetail,
  type ClinicalFinding,
  type ClinicalTarget,
  type DentalArch,
  type DocumentationHandoff,
  type PeriodontalSite,
  type ToothSurface,
  type TreatmentAct,
  type TreatmentVisit,
} from './treatment';

const emptyStringToNull = (value: string): string | null =>
  value === '' ? null : value;
const dateStringToDate = (value: string): Date | null =>
  value === '' ? null : new Date(value);

const enumValue = <T extends string>(
  value: string,
  supported: readonly T[],
  field: string,
): T => {
  if ((supported as readonly string[]).includes(value)) return value as T;
  throw new Error(`Unsupported Treatment ${field}: ${value}`);
};

const mapTarget = (dto: ClinicalTargetResponseDto): ClinicalTarget => ({
  kind: enumValue(dto.kind, TREATMENT_TARGET_KINDS, 'target kind'),
  arch:
    dto.arch === ''
      ? null
      : enumValue(dto.arch, ['UPPER', 'LOWER'] as const, 'arch'),
  toothNumbers: dto.toothNumbers,
  surfaces: dto.surfaces.map((value) =>
    enumValue(
      value,
      ['BUCCAL', 'LINGUAL', 'MESIAL', 'DISTAL', 'OCCLUSAL'] as const,
      'surface',
    ),
  ) as ToothSurface[],
  periodontalSites: dto.periodontalSites.map((value) =>
    enumValue(
      value,
      ['MB', 'B', 'DB', 'ML', 'L', 'DL'] as const,
      'periodontal site',
    ),
  ) as PeriodontalSite[],
});

const mapDetail = (dto: ClinicalDetailResponseDto): ClinicalDetail => {
  const values = [
    dto.stringValue !== '' ? dto.stringValue : undefined,
    dto.integerValue,
    dto.booleanValue,
  ].filter((value) => value !== undefined);
  if (values.length !== 1) {
    throw new Error(`Treatment detail ${dto.key} must contain one value`);
  }
  return { key: dto.key, value: values[0] as string | number | boolean };
};

const mapFinding = (dto: ClinicalFindingResponseDto): ClinicalFinding => ({
  id: dto.id,
  code: enumValue(dto.code, CLINICAL_FINDING_CODES, 'finding code'),
  status: enumValue(dto.status, CLINICAL_FINDING_STATUSES, 'finding status'),
  target: mapTarget(dto.target),
  details: dto.details.map(mapDetail),
  note: emptyStringToNull(dto.note),
  enteredByUserId: dto.enteredByUserId,
  verifiedByUserId: emptyStringToNull(dto.verifiedByUserId),
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});

const mapAct = (dto: TreatmentActResponseDto): TreatmentAct => ({
  id: dto.id,
  code: enumValue(dto.code, TREATMENT_ACT_CODES, 'act code'),
  status: enumValue(dto.status, TREATMENT_ACT_STATUSES, 'act status'),
  target: mapTarget(dto.target),
  details: dto.details.map(mapDetail),
  note: emptyStringToNull(dto.note),
  enteredByUserId: dto.enteredByUserId,
  approvedByDentistId: emptyStringToNull(dto.approvedByDentistId),
  performedByUserId: emptyStringToNull(dto.performedByUserId),
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});

const mapHandoff = (
  dto: DocumentationHandoffResponseDto,
): DocumentationHandoff => ({
  id: dto.id,
  status: enumValue(
    dto.status,
    DOCUMENTATION_HANDOFF_STATUSES,
    'documentation handoff status',
  ),
  assignedByDentistId: dto.assignedByDentistId,
  assignedToAssistantId: dto.assignedToAssistantId,
  note: emptyStringToNull(dto.note),
  reviewNote: emptyStringToNull(dto.reviewNote),
  revision: dto.revision,
  assignedAt: new Date(dto.assignedAt),
  submittedAt: dateStringToDate(dto.submittedAt),
  reviewedAt: dateStringToDate(dto.reviewedAt),
});

export const mapTreatmentVisitFromDto = (
  dto: TreatmentVisitResponseDto,
): TreatmentVisit => ({
  id: dto.id,
  clinicId: dto.clinicId,
  patientId: dto.patientId,
  responsibleDentistId: dto.responsibleDentistId,
  appointmentId: emptyStringToNull(dto.appointmentId),
  queueEntryId: emptyStringToNull(dto.queueEntryId),
  chairId: emptyStringToNull(dto.chairId),
  status: enumValue(dto.status, TREATMENT_VISIT_STATUSES, 'visit status'),
  chiefComplaint: emptyStringToNull(dto.chiefComplaint),
  clinicalNotes: emptyStringToNull(dto.clinicalNotes),
  findings: dto.findings.map(mapFinding),
  acts: dto.acts.map(mapAct),
  documentationHandoff: dto.documentationHandoff
    ? mapHandoff(dto.documentationHandoff)
    : null,
  startedAt: dateStringToDate(dto.startedAt),
  completedAt: dateStringToDate(dto.completedAt),
  cancelledAt: dateStringToDate(dto.cancelledAt),
  cancellationReason: emptyStringToNull(dto.cancellationReason),
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});

export type { DentalArch };
