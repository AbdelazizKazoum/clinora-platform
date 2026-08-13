export interface ClinicalTargetResponseDto {
  kind: string;
  arch: string;
  toothNumbers: number[];
  surfaces: string[];
  periodontalSites: string[];
}

export interface ClinicalDetailResponseDto {
  key: string;
  stringValue: string;
  integerValue?: number;
  booleanValue?: boolean;
}

export interface ClinicalFindingResponseDto {
  id: string;
  code: string;
  status: string;
  target: ClinicalTargetResponseDto;
  details: ClinicalDetailResponseDto[];
  note: string;
  enteredByUserId: string;
  verifiedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TreatmentActResponseDto {
  id: string;
  code: string;
  status: string;
  target: ClinicalTargetResponseDto;
  details: ClinicalDetailResponseDto[];
  note: string;
  enteredByUserId: string;
  approvedByDentistId: string;
  performedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentationHandoffResponseDto {
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

export interface TreatmentVisitResponseDto {
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
  findings: ClinicalFindingResponseDto[];
  acts: TreatmentActResponseDto[];
  documentationHandoff?: DocumentationHandoffResponseDto;
  startedAt: string;
  completedAt: string;
  cancelledAt: string;
  cancellationReason: string;
  createdAt: string;
  updatedAt: string;
}
