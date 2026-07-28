import { apiClient } from '@/lib/api';
import {
  mapPatientFromDto,
  type Patient,
  type RestorePatientCommand,
} from '../../model';
import type { PatientResponseDto } from '../dto';
import { patientApiPaths } from '../patient-api-paths';

export const restorePatient = async (
  command: RestorePatientCommand,
): Promise<Patient> => {
  const response = await apiClient.put<PatientResponseDto>(
    patientApiPaths.restorePatient(command.clinicId, command.patientId),
  );

  return mapPatientFromDto(response.data);
};
