import type { TreatmentLaunchContext, TreatmentVisit } from './treatment';

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
    role === 'dental_assistant' &&
      handoff?.assignedToAssistantId === userId &&
      ['ASSIGNED', 'IN_PROGRESS', 'RETURNED'].includes(handoff.status),
  );
};

export const canApproveTreatmentDocumentation = (
  visit: TreatmentVisit,
  userId: string,
  role: TreatmentWorkspaceRole,
): boolean => role === 'doctor' && visit.responsibleDentistId === userId;

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
