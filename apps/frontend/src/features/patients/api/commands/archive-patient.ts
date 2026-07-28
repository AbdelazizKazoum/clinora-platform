import { apiClient } from '@/lib/api';
import type { ArchivePatientCommand } from '../../model';
import type { SuccessResponseDto } from '../dto';
import { patientApiPaths } from '../patient-api-paths';

export const archivePatient = async (
  command: ArchivePatientCommand,
): Promise<void> => {
  await apiClient.put<SuccessResponseDto>(
    patientApiPaths.softDeletePatient(command.clinicId, command.patientId),
  );
};
