import { apiClient } from '@/lib/api';
import type { DeletePatientCommand } from '../../model';
import type { SuccessResponseDto } from '../dto';
import { patientApiPaths } from '../patient-api-paths';

export const deletePatient = async (
  command: DeletePatientCommand,
): Promise<void> => {
  await apiClient.delete<SuccessResponseDto>(
    patientApiPaths.patient(command.clinicId, command.patientId),
  );
};
