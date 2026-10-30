import type {
  ClinicalFinding,
  TreatmentLaunchContext,
  TreatmentVisit,
} from './treatment';

export type TreatmentWorkspaceRole =
  | 'admin'
  | 'doctor'
  | 'dental_assistant'
  | 'secretary'
  | 'patient';

export const canEditTreatmentDraft = (
  visit: TreatmentVisit,
  userId: string,
  role: TreatmentWorkspaceRole,
): boolean => {
  if (visit.status === 'COMPLETED' || visit.status === 'CANCELLED')
    return false;
  if (role === 'doctor' && visit.responsibleDentistId === userId) return true;

  const handoff = visit.documentationHandoff;
  return Boolean(
    (role === 'dental_assistant' || role === 'secretary') &&
      handoff?.assignedToUserId === userId &&
      (handoff.assignedToRole ?? 'dental_assistant') === role &&
      ['ASSIGNED', 'IN_PROGRESS', 'RETURNED', 'SUBMITTED'].includes(
        handoff.status,
      ),
  );
};

export const canRemoveTreatmentFinding = (
  visit: TreatmentVisit,
  finding: ClinicalFinding,
  userId: string,
  role: TreatmentWorkspaceRole,
): boolean => {
  if (visit.status === 'COMPLETED' || visit.status === 'CANCELLED') {
    return false;
  }

  if (finding.status === 'DRAFT') {
    return (
      canEditTreatmentDraft(visit, userId, role) &&
      (role === 'doctor' || finding.enteredByUserId === userId)
    );
  }

  return (
    finding.status === 'CONFIRMED' && canEditTreatmentDraft(visit, userId, role)
  );
};

export const parseTreatmentLaunchContext = (
  input: URLSearchParams,
): TreatmentLaunchContext | null => {
  const patientId = input.get('patientId')?.trim() ?? '';
  const doctorId = input.get('doctorId')?.trim() ?? '';
  if (!patientId || !doctorId) return null;

  return {
    patientId,
    doctorId,
    appointmentId: input.get('appointmentId')?.trim() || null,
    queueEntryId: input.get('queueEntryId')?.trim() || null,
    chairId: input.get('chairId')?.trim() || null,
  };
};
